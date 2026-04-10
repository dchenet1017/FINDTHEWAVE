import Stripe from 'stripe'
import { config } from '../config'

/**
 * Stripe singleton.
 * We intentionally do NOT throw at import-time so the server can boot
 * in environments where Stripe is not configured (non-payment features).
 */
export const stripe: Stripe | null = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey)
  : null

