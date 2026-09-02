import api from '@/lib/axios'
import type {
  ActiveDemand,
  BusinessOffer,
  GoOutIntent,
  MyIntentResponse,
  MyOffersResponse,
  RaiseHandInput,
  SendOfferInput,
  SendOfferResult,
} from '@/types/goOut'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message?: string } }

export const goOutService = {
  // --- User ---
  raiseHand: (input: RaiseHandInput) =>
    api.post<ApiEnvelope<GoOutIntent>>('/go-out/raise-hand', input),

  lowerHand: () => api.delete<ApiEnvelope<GoOutIntent>>('/go-out/lower-hand'),

  myIntent: () => api.get<ApiEnvelope<MyIntentResponse>>('/go-out/my-intent'),

  myOffers: () => api.get<ApiEnvelope<MyOffersResponse>>('/go-out/my-offers'),

  respondToOffer: (offerId: string, action: 'ACCEPT' | 'DECLINE') =>
    api.post<ApiEnvelope<{ offer: BusinessOffer; intent: GoOutIntent }>>(
      `/go-out/respond-offer/${offerId}`,
      { action }
    ),

  // --- Business ---
  activeDemand: (radius: number) =>
    api.get<ApiEnvelope<ActiveDemand>>('/go-out/active-demand', {
      params: { radius },
    }),

  sendOffer: (input: SendOfferInput) =>
    api.post<ApiEnvelope<SendOfferResult>>('/go-out/send-offer', input),

  sentOffers: () =>
    api.get<ApiEnvelope<{ offers: BusinessOffer[] }>>('/go-out/sent-offers'),
}
