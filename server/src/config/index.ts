// Centralized configuration with validation
import dotenv from 'dotenv'
import { z } from 'zod'

// Load environment variables from .env file
dotenv.config()

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().url(),
  REDIS_URL: z.string().optional(),
})

const env = envSchema.parse(process.env)

export const config = {
  port: parseInt(env.PORT),
  nodeEnv: env.NODE_ENV,
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  },
  frontend: {
    url: env.FRONTEND_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
}

