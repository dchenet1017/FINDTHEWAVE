import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
  if (!key) {
    return Promise.resolve(null)
  }
  if (!stripePromise) {
    stripePromise = loadStripe(key)
  }
  return stripePromise
}
