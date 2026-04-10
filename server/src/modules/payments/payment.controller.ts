import { FastifyRequest, FastifyReply } from 'fastify'
import Stripe from 'stripe'
import { Decimal } from '@prisma/client/runtime/library'
import { stripe } from '../../lib/stripe'
import { prisma } from '../../lib/prisma'
import { config } from '../../config'

const webhookSecret = config.stripe.webhookSecret

export async function handleStripeWebhook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!stripe || !webhookSecret) {
    return reply.code(503).send({
      error: 'Payments not configured',
    })
  }

  const rawBody = (request as FastifyRequest & { rawBody?: Buffer }).rawBody
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    return reply.code(400).send({ error: 'Raw body required' })
  }

  const sig = request.headers['stripe-signature']
  if (!sig || typeof sig !== 'string') {
    return reply.code(400).send({ error: 'No signature' })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    request.log.error({ err }, 'Webhook signature verification failed')
    return reply.code(400).send({ error: 'Invalid signature' })
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
      break
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
      break
    case 'charge.refunded':
      await handleRefund(event.data.object as Stripe.Charge)
      break
    default:
      request.log.info({ eventType: event.type }, 'Unhandled webhook event type')
  }

  return reply.send({ received: true })
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const booking = await prisma.booking.findFirst({
    where: { paymentIntentId: paymentIntent.id },
  })
  if (!booking) return
  // Idempotency: if we've already recorded payment, skip.
  if (booking.paidAt) return
  if (booking.status !== 'PENDING') return
  const now = new Date()
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CONFIRMED',
        paidAt: now,
        confirmedAt: now,
      },
    }),
    prisma.waveLeader.update({
      where: { id: booking.waveLeaderId },
      data: { totalBookings: { increment: 1 } },
    }),
  ])
  // TODO: Send confirmation notifications
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const booking = await prisma.booking.findFirst({
    where: { paymentIntentId: paymentIntent.id },
  })
  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancelReason: 'Payment failed',
        cancelledAt: new Date(),
      },
    })
    // TODO: Send payment failure notification
  }
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id
  if (!paymentIntentId) return
  const booking = await prisma.booking.findFirst({
    where: { paymentIntentId: paymentIntentId },
  })
  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        refundAmount: new Decimal(charge.amount_refunded / 100),
      },
    })
  }
}
