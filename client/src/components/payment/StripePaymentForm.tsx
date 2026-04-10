import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe'
import { CheckoutForm, type CheckoutFormProps } from './CheckoutForm'

type Props = Omit<CheckoutFormProps, 'isSubmitting' | 'setIsSubmitting'> & {
  isSubmitting: boolean
  setIsSubmitting: (v: boolean) => void
}

export function StripePaymentForm(props: Props) {
  const stripePromise = getStripe()

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}
