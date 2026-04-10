import { useState, type FormEvent } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Lock, Loader2 } from 'lucide-react'
import { useCreateBooking, useConfirmBookingPayment } from '@/hooks/useBookings'
import type { BookingPaymentDraft } from '@/types/booking-payment'
import { calculateBookingPrice, formatCurrency } from '@/utils/booking'

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
}

export interface CheckoutFormProps {
  bookingDraft: BookingPaymentDraft
  onSuccess: (bookingId: string) => void
  onError: (message: string) => void
  isSubmitting: boolean
  setIsSubmitting: (v: boolean) => void
}

export function CheckoutForm({
  bookingDraft,
  onSuccess,
  onError,
  isSubmitting,
  setIsSubmitting,
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardholderName, setCardholderName] = useState('')
  const [billingStreet, setBillingStreet] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingState, setBillingState] = useState('')
  const [billingZip, setBillingZip] = useState('')
  const [saveCard, setSaveCard] = useState(false)

  const createBookingMutation = useCreateBooking()
  const confirmPaymentMutation = useConfirmBookingPayment()

  const pricing = calculateBookingPrice(bookingDraft.hourlyRate, bookingDraft.durationHours)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) {
      onError('Payment form is not ready. Check your Stripe configuration.')
      return
    }
    if (!cardholderName.trim()) {
      onError('Please enter the cardholder name.')
      return
    }

    setIsSubmitting(true)
    onError('')

    const payload = {
      waveLeaderId: bookingDraft.waveLeaderId,
      scheduledDate: bookingDraft.scheduledDate,
      scheduledTime: bookingDraft.scheduledTime,
      durationHours: bookingDraft.durationHours,
      serviceType: bookingDraft.serviceType,
      location: bookingDraft.location,
      notes: bookingDraft.notes,
    }

    try {
      const booking = await createBookingMutation.mutateAsync(payload)

      const card = elements.getElement(CardElement)
      if (!card) {
        onError('Card field not found')
        setIsSubmitting(false)
        return
      }

      const billingDetails: {
        name: string
        address?: { line1?: string; city?: string; state?: string; postal_code?: string }
      } = { name: cardholderName.trim() }
      if (billingStreet || billingCity || billingState || billingZip) {
        billingDetails.address = {
          line1: billingStreet || undefined,
          city: billingCity || undefined,
          state: billingState || undefined,
          postal_code: billingZip || undefined,
        }
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(booking.clientSecret, {
        payment_method: {
          card,
          billing_details: billingDetails,
        },
      })

      if (error) {
        onError(error.message || 'Payment failed')
        setIsSubmitting(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        await confirmPaymentMutation.mutateAsync({
          bookingId: booking.id,
          paymentIntentId: paymentIntent.id,
        })
        onSuccess(booking.id)
      } else {
        onError('Payment was not completed.')
        setIsSubmitting(false)
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
              ?.message
          : err instanceof Error
            ? err.message
            : 'An error occurred'
      onError(message || 'An error occurred')
      setIsSubmitting(false)
    }
  }

  const disabled = !stripe || isSubmitting

  return (
    <form id="booking-payment-form" onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="cardholder" className="block text-sm font-medium text-gray-300 mb-2">
          Cardholder name
        </label>
        <input
          id="cardholder"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="John Doe"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-300 mb-2">Card information</span>
        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg min-h-[52px]">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-300">Billing address (optional)</p>
        <input
          type="text"
          value={billingStreet}
          onChange={(e) => setBillingStreet(e.target.value)}
          disabled={disabled}
          placeholder="Street address"
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-500"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
            disabled={disabled}
            placeholder="City"
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-500"
          />
          <input
            type="text"
            value={billingState}
            onChange={(e) => setBillingState(e.target.value)}
            disabled={disabled}
            placeholder="State"
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-500"
          />
          <input
            type="text"
            value={billingZip}
            onChange={(e) => setBillingZip(e.target.value)}
            disabled={disabled}
            placeholder="ZIP"
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 sm:col-span-1 col-span-2"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          disabled={disabled}
          className="rounded border-gray-600 bg-gray-900"
        />
        Save card for future bookings
      </label>

      <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>
        Submit
      </button>

      <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-500" />
          <span>Secured by Stripe</span>
        </div>
        <span className="hidden sm:inline">·</span>
        <span>Your payment information is encrypted</span>
      </div>

      {isSubmitting && (
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Processing payment…</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Pay {formatCurrency(pricing.total)} using the button in the summary →
      </p>
    </form>
  )
}
