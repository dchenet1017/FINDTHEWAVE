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
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  /**
   * Extra browser origins allowed through CORS, comma separated. Use for
   * preview deploys or a custom domain that is not FRONTEND_URL.
   */
  CORS_ORIGINS: z.string().optional(),
  /**
   * Escape hatch that restores the old "any *.onrender.com origin" rule.
   * Off by default: with credentials enabled, that let any app hosted on
   * Render make authenticated cross-origin calls to this API.
   */
  ALLOW_ALL_RENDER_ORIGINS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // A raw ZodError in Render's log is near-unreadable, so spell out what is
  // wrong and stop - booting half-configured just fails later and less clearly.
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
  console.error(
    `\n❌ Invalid environment configuration:\n${issues}\n\n` +
      `Set these in your host's environment (Render: Dashboard → Service → Environment)\n` +
      `or in server/.env for local development. See render.yaml for the full list.\n`
  )
  process.exit(1)
}

const env = parsed.data
const isProd = env.NODE_ENV === 'production'

/** Browser origins allowed to call this API with credentials. */
const corsOrigins = Array.from(
  new Set(
    [
      env.FRONTEND_URL,
      ...(env.CORS_ORIGINS?.split(',') ?? []),
      ...(isProd
        ? []
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']),
    ]
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean)
  )
)

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
  cors: {
    origins: corsOrigins,
    allowAllRenderOrigins: env.ALLOW_ALL_RENDER_ORIGINS,
  },
  redis: {
    url: env.REDIS_URL,
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  isDev: env.NODE_ENV === 'development',
  isProd,
}

/**
 * Vars the app boots without but that quietly disable a feature. Surfaced at
 * startup so a broken production deploy is obvious in the logs rather than
 * showing up later as a failed checkout.
 */
export function warnOnMissingOptionalEnv() {
  if (!isProd) return

  const warnings: string[] = []
  if (!env.STRIPE_SECRET_KEY) {
    warnings.push('STRIPE_SECRET_KEY is unset — payments and payouts are disabled')
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    warnings.push('STRIPE_WEBHOOK_SECRET is unset — Stripe webhooks cannot be verified')
  }
  if (!env.REDIS_URL) {
    warnings.push('REDIS_URL is unset — anything relying on Redis is disabled')
  }

  if (warnings.length > 0) {
    console.warn(
      `\n⚠️  Optional environment variables missing in production:\n` +
        warnings.map((w) => `  - ${w}`).join('\n') +
        `\n`
    )
  }

  // MAPBOX_TOKEN is deliberately not checked here: nothing on the server uses
  // Mapbox. The map is client-side and reads VITE_MAPBOX_TOKEN, which must be
  // set on the static site at BUILD time (see render.yaml).
}
