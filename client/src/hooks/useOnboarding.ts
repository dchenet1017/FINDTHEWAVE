import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { onboardingService } from '@/services/onboarding.service'
import { useAuthStore } from '@/store/authStore'
import {
  TOTAL_STEPS,
  type OnboardingState,
  type OnboardingUpdate,
} from '@/types/onboarding'

/** Used until the server responds, so the wizard renders immediately */
const emptyState: OnboardingState = {
  firstName: null,
  lastName: null,
  completed: false,
  completedAt: null,
  step: 1,
  interests: [],
  experienceGoal: null,
  nightVibe: 50,
  maxDistanceMiles: 5,
  notificationsEnabled: true,
  locationSharingEnabled: false,
  location: null,
}

const clampStep = (step: number) => Math.min(Math.max(step, 1), TOTAL_STEPS)

export function useOnboarding() {
  const queryClient = useQueryClient()
  const { user, setUser } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding'],
    queryFn: async () => {
      const { data } = await onboardingService.getState()
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to load onboarding')
      }
      return data.data
    },
    retry: false,
    staleTime: Infinity,
  })

  // Only what the user has actually touched this session. Everything else is
  // derived from the server state, so no effect is needed to hydrate.
  const [edits, setEdits] = useState<Partial<OnboardingState>>({})
  const [stepOverride, setStepOverride] = useState<number | null>(null)

  const draft = useMemo<OnboardingState>(() => {
    const base = { ...emptyState, ...(data ?? {}) }
    return {
      ...base,
      // Fall back to the name already on the account.
      firstName: base.firstName || user?.firstName || null,
      lastName: base.lastName || user?.lastName || null,
      ...edits,
    }
  }, [data, edits, user])

  // Resume an abandoned wizard where it left off until the user navigates.
  const step = stepOverride ?? (data ? clampStep(data.step) : 1)

  const patch = useCallback((changes: Partial<OnboardingState>) => {
    setEdits((prev) => ({ ...prev, ...changes }))
  }, [])

  const saveMutation = useMutation({
    mutationFn: (update: OnboardingUpdate) => onboardingService.update(update),
    onError: () => {
      // Answers stay in the draft and are re-sent by the final complete call,
      // so a dropped save is not fatal - just tell the user it did not stick.
      toast.error('Could not save your answer. It will be retried at the end.')
    },
  })

  const completeMutation = useMutation({
    mutationFn: async (update: OnboardingUpdate) => {
      const { data } = await onboardingService.complete(update)
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to finish onboarding')
      }
      return data.data
    },
    onSuccess: (state) => {
      queryClient.setQueryData(['onboarding'], state)
      // Keep the cached auth user in step so route guards stop sending the
      // user back into the wizard.
      if (user) setUser({ ...user, onboardingCompleted: true })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error?.message ||
          error?.message ||
          'Could not finish setting up your account'
      )
    },
  })

  const { mutate: save } = saveMutation

  /** Advance a step, persisting whatever that step collected. */
  const next = useCallback(
    (update: OnboardingUpdate = {}) => {
      const target = clampStep(step + 1)
      setStepOverride(target)
      save({ ...update, step: target })
    },
    [step, save]
  )

  const back = useCallback(() => {
    setStepOverride(clampStep(step - 1))
  }, [step])

  /** The whole draft, so a failed intermediate PATCH still lands at the end. */
  const fullPayload = useMemo(
    (): OnboardingUpdate => ({
      firstName: draft.firstName || undefined,
      lastName: draft.lastName ?? undefined,
      interests: draft.interests,
      experienceGoal: draft.experienceGoal ?? undefined,
      nightVibe: draft.nightVibe,
      maxDistanceMiles: draft.maxDistanceMiles,
      notificationsEnabled: draft.notificationsEnabled,
      locationSharingEnabled: draft.locationSharingEnabled,
      locationLat: draft.location?.lat ?? null,
      locationLng: draft.location?.lng ?? null,
      locationLabel: draft.location?.label ?? null,
    }),
    [draft]
  )

  const { mutateAsync: runComplete } = completeMutation

  const complete = useCallback(
    () => runComplete(fullPayload),
    [runComplete, fullPayload]
  )

  return {
    draft,
    patch,
    step,
    next,
    back,
    complete,
    isLoading,
    isSaving: saveMutation.isPending,
    isCompleting: completeMutation.isPending,
    alreadyCompleted: data?.completed ?? false,
  }
}
