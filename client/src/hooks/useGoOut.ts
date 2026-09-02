import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { goOutService } from '@/services/goOut.service'
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

/** Live demand moves fast; poll rather than leaving stale counts on screen. */
export const GO_OUT_POLL_MS = 30_000

function unwrap<T>(res: { data: ApiEnvelope<T> }, fallback: string): T {
  const body = res.data
  if (!body.success || body.data === undefined) {
    throw new Error(body.error?.message || fallback)
  }
  return body.data
}

function errorMessage(error: unknown, fallback: string) {
  const res = (error as { response?: { data?: { error?: { message?: string } } } })
    ?.response
  return res?.data?.error?.message || (error as Error)?.message || fallback
}

export const goOutKeys = {
  intent: ['go-out', 'my-intent'] as const,
  offers: ['go-out', 'my-offers'] as const,
  demand: (radius: number) => ['go-out', 'active-demand', radius] as const,
  sentOffers: ['go-out', 'sent-offers'] as const,
}

// --- User ---

/** The caller's live intent + an aggregate count of other hands up nearby. */
export const useMyIntent = () =>
  useQuery<MyIntentResponse>({
    queryKey: goOutKeys.intent,
    queryFn: async () => unwrap(await goOutService.myIntent(), 'Failed to load your intent'),
    refetchInterval: GO_OUT_POLL_MS,
    staleTime: 10_000,
  })

/** Offers waiting on the caller. Only polls while a hand is actually up. */
export const useMyOffers = (enabled: boolean) =>
  useQuery<MyOffersResponse>({
    queryKey: goOutKeys.offers,
    queryFn: async () => unwrap(await goOutService.myOffers(), 'Failed to load offers'),
    enabled,
    refetchInterval: enabled ? GO_OUT_POLL_MS : false,
    staleTime: 10_000,
  })

export const useRaiseHand = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RaiseHandInput) =>
      unwrap(await goOutService.raiseHand(input), 'Failed to raise your hand'),
    onSuccess: (intent: GoOutIntent) => {
      queryClient.setQueryData<MyIntentResponse>(goOutKeys.intent, (prev) => ({
        intent,
        nearbyCount: prev?.nearbyCount ?? 0,
      }))
      queryClient.invalidateQueries({ queryKey: goOutKeys.intent })
      queryClient.invalidateQueries({ queryKey: goOutKeys.offers })
      toast.success('Your hand is up — venues nearby can see you now')
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not raise your hand')),
  })
}

export const useLowerHand = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      unwrap(await goOutService.lowerHand(), 'Failed to lower your hand'),
    onSuccess: () => {
      queryClient.setQueryData<MyIntentResponse>(goOutKeys.intent, {
        intent: null,
        nearbyCount: 0,
      })
      queryClient.setQueryData<MyOffersResponse>(goOutKeys.offers, {
        intentId: null,
        offers: [],
      })
      queryClient.invalidateQueries({ queryKey: goOutKeys.intent })
      toast.success('Hand down — you are no longer broadcasting')
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not lower your hand')),
  })
}

export const useRespondToOffer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { offerId: string; action: 'ACCEPT' | 'DECLINE' }) =>
      unwrap(
        await goOutService.respondToOffer(vars.offerId, vars.action),
        'Failed to respond to the offer'
      ),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: goOutKeys.offers })
      queryClient.invalidateQueries({ queryKey: goOutKeys.intent })
      if (vars.action === 'DECLINE') toast.success('Offer declined')
      // The accept path shows its own celebration, so stay quiet there.
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not send your response')),
  })
}

// --- Business ---

/** Aggregated demand near the venue. Never contains individual users. */
export const useActiveDemand = (radius: number, enabled = true) =>
  useQuery<ActiveDemand>({
    queryKey: goOutKeys.demand(radius),
    queryFn: async () =>
      unwrap(await goOutService.activeDemand(radius), 'Failed to load demand'),
    enabled,
    refetchInterval: enabled ? GO_OUT_POLL_MS : false,
    staleTime: 10_000,
  })

export const useSentOffers = (enabled = true) =>
  useQuery<{ offers: BusinessOffer[] }>({
    queryKey: goOutKeys.sentOffers,
    queryFn: async () =>
      unwrap(await goOutService.sentOffers(), 'Failed to load sent offers'),
    enabled,
    refetchInterval: enabled ? GO_OUT_POLL_MS : false,
    staleTime: 10_000,
  })

export const useSendOffer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SendOfferInput) =>
      unwrap(await goOutService.sendOffer(input), 'Failed to send the offer'),
    onSuccess: (result: SendOfferResult) => {
      queryClient.invalidateQueries({ queryKey: ['go-out', 'active-demand'] })
      queryClient.invalidateQueries({ queryKey: goOutKeys.sentOffers })

      if (result.broadcast) {
        toast.success('Wave offer broadcast to everyone nearby')
      } else if (result.offersCreated === 0) {
        toast.info(
          result.matchedIntents > 0
            ? 'Everyone matching already has a pending offer from you'
            : 'No one nearby matches that yet'
        )
      } else {
        toast.success(
          `Wave offer sent to ${result.offersCreated} ${
            result.offersCreated === 1 ? 'person' : 'people'
          }`
        )
      }
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not send the offer')),
  })
}
