import { Readable } from 'stream'
import { FastifyInstance } from 'fastify'
import * as paymentController from './payment.controller'

/**
 * Payment routes (Stripe webhook).
 * Webhook route uses preParsing to capture raw body for signature verification.
 */
export default async function paymentRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/webhook',
    {
      config: { rawBody: true },
      preParsing: async (request, _reply, payload) => {
        const chunks: Buffer[] = []
        for await (const chunk of payload as AsyncIterable<Buffer>) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        }
        ;(request as FastifyRequestWithRawBody).rawBody = Buffer.concat(chunks)
        return Readable.from((request as FastifyRequestWithRawBody).rawBody!)
      },
    },
    paymentController.handleStripeWebhook
  )
}

interface FastifyRequestWithRawBody {
  rawBody?: Buffer
}
