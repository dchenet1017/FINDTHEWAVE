import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import { validate } from '../../middleware/validate'
import * as goOutController from './go-out.controller'
import {
  activeDemandQuerySchema,
  raiseHandSchema,
  respondOfferParamsSchema,
  respondOfferSchema,
  sendOfferSchema,
} from './go-out.schema'

/**
 * "I Want to Go Out" demand queue.
 * Prefix: /api/go-out
 *
 * Replaced the GoOutStatus availability toggle. Business-facing routes return
 * aggregates only - see getActiveDemand.
 */
export default async function goOutRoutes(fastify: FastifyInstance) {
  /**
   * Public: which venues are running a live offer, ids only. The map badges
   * these, and /map is reachable while logged out, so this sits outside the
   * authenticated scope below. It exposes no user or offer detail.
   */
  fastify.get('/active-venues', goOutController.getActiveVenues)

  await fastify.register(async (scoped) => {
    scoped.addHook('preHandler', authenticate)

    // --- User ---
    scoped.post(
      '/raise-hand',
      { preHandler: validate({ body: raiseHandSchema }) },
      goOutController.raiseHand
    )
    scoped.delete('/lower-hand', goOutController.lowerHand)
    scoped.get('/my-intent', goOutController.getMyIntent)
    scoped.get('/my-offers', goOutController.getMyOffers)
    scoped.post(
      '/respond-offer/:offerId',
      {
        preHandler: validate({
          params: respondOfferParamsSchema,
          body: respondOfferSchema,
        }),
      },
      goOutController.respondToOffer
    )

    // --- Business ---
    scoped.get(
      '/active-demand',
      {
        preHandler: [
          requireRole('BUSINESS', 'ADMIN'),
          validate({ query: activeDemandQuerySchema }),
        ],
      },
      goOutController.getActiveDemand
    )
    scoped.post(
      '/send-offer',
      {
        preHandler: [
          requireRole('BUSINESS', 'ADMIN'),
          validate({ body: sendOfferSchema }),
        ],
      },
      goOutController.sendOffer
    )
    scoped.get(
      '/sent-offers',
      { preHandler: requireRole('BUSINESS', 'ADMIN') },
      goOutController.getSentOffers
    )
  })
}
