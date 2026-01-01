import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import type {
  AuthResponse,
  RegisterData,
  LoginData,
  Tokens,
  TokenPayload,
  UserWithoutPassword,
} from './auth.types'
import { Role } from '@prisma/client'

const SALT_ROUNDS = 10
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY_DAYS = 7

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existingUser) {
        return {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
          },
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS)

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex')

      // Create user (auto-verify for now, email verification will be added later)
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role as Role,
          verificationToken,
          isVerified: true, // Auto-verify for now
        },
      })

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.role)

      // Log verification token for now (replace with email later)
      console.log(`Verification token for ${user.email}: ${verificationToken}`)
      console.log(`Verification URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`)

      return {
        success: true,
        data: {
          user: this.excludePassword(user),
          ...tokens,
          // Include verification token in development mode
          ...(process.env.NODE_ENV === 'development' && { verificationToken }),
        },
      }
    } catch (error) {
      console.error('Register error:', error)
      return {
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register user',
        },
      }
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        }
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Account has been disabled',
          },
        }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        }
      }

      // Email verification check removed for now (will be added later)
      // if (!user.isVerified) {
      //   return {
      //     success: false,
      //     error: {
      //       code: 'EMAIL_NOT_VERIFIED',
      //       message: 'Please verify your email before logging in',
      //     },
      //   }
      // }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      })

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.role)

      return {
        success: true,
        data: {
          user: this.excludePassword(user),
          ...tokens,
        },
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Failed to login',
        },
      }
    }
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(userId: string, role: Role): Promise<Tokens> {
    // Generate access token (15 minutes)
    const accessToken = this.fastify.jwt.sign(
      { userId, role },
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    )

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    })

    return {
      accessToken,
      refreshToken,
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    try {
      // Find refresh token in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      })

      if (!tokenRecord) {
        return {
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid refresh token',
          },
        }
      }

      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        // Delete expired token
        await prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        })
        return {
          success: false,
          error: {
            code: 'REFRESH_TOKEN_EXPIRED',
            message: 'Refresh token has expired',
          },
        }
      }

      // Check if user is still active
      if (!tokenRecord.user.isActive) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Account has been disabled',
          },
        }
      }

      // Delete old refresh token (rotation)
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      })

      // Generate new tokens
      const tokens = await this.generateTokens(
        tokenRecord.userId,
        tokenRecord.user.role
      )

      return {
        success: true,
        data: tokens,
      }
    } catch (error) {
      console.error('Refresh tokens error:', error)
      return {
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: 'Failed to refresh tokens',
        },
      }
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const user = await prisma.user.findFirst({
        where: { verificationToken: token },
      })

      if (!user) {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired verification token',
          },
        }
      }

      if (user.isVerified) {
        return {
          success: true,
          data: {
            message: 'Email is already verified',
          },
        }
      }

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
        },
      })

      return {
        success: true,
        data: {
          message: 'Email verified successfully',
        },
      }
    } catch (error) {
      console.error('Verify email error:', error)
      return {
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: 'Failed to verify email',
        },
      }
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        // Don't reveal if user exists for security
        return {
          success: true,
          data: {
            message: 'If an account exists, a password reset link has been sent',
          },
        }
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date()
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1) // 1 hour expiry

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      })

      // Log token for now (replace with email later)
      console.log(`Password reset token for ${user.email}: ${resetToken}`)

      return {
        success: true,
        data: {
          message: 'If an account exists, a password reset link has been sent',
        },
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      return {
        success: false,
        error: {
          code: 'RESET_REQUEST_FAILED',
          message: 'Failed to process password reset request',
        },
      }
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(), // Token not expired
          },
        },
      })

      if (!user) {
        return {
          success: false,
          error: {
            code: 'INVALID_OR_EXPIRED_TOKEN',
            message: 'Invalid or expired reset token',
          },
        }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      })

      // Invalidate all refresh tokens for security
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      })

      return {
        success: true,
        data: {
          message: 'Password reset successfully',
        },
      }
    } catch (error) {
      console.error('Reset password error:', error)
      return {
        success: false,
        error: {
          code: 'RESET_FAILED',
          message: 'Failed to reset password',
        },
      }
    }
  }

  /**
   * Logout and invalidate refresh token
   */
  async logout(refreshToken: string): Promise<AuthResponse> {
    try {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      })

      return {
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout',
        },
      }
    }
  }

  /**
   * Validate access token and return payload
   */
  async validateAccessToken(token: string): Promise<AuthResponse> {
    try {
      const decoded = this.fastify.jwt.verify<TokenPayload>(token)
      return {
        success: true,
        data: decoded,
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token',
        },
      }
    }
  }

  /**
   * Get current user without password
   */
  async getCurrentUser(userId: string): Promise<AuthResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        }
      }

      return {
        success: true,
        data: {
          user: this.excludePassword(user),
        },
      }
    } catch (error) {
      console.error('Get current user error:', error)
      return {
        success: false,
        error: {
          code: 'FETCH_USER_FAILED',
          message: 'Failed to fetch user',
        },
      }
    }
  }

  /**
   * Exclude password from user object
   */
  private excludePassword(user: any): UserWithoutPassword {
    const { password, verificationToken, resetToken, resetTokenExpiry, ...userWithoutPassword } =
      user
    return userWithoutPassword as UserWithoutPassword
  }
}

