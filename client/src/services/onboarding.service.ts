import api from '@/lib/axios'
import type { OnboardingState, OnboardingUpdate } from '@/types/onboarding'

interface OnboardingResponse {
  success: boolean
  data?: OnboardingState
  error?: {
    code: string
    message: string
  }
}

export const onboardingService = {
  getState: () => api.get<OnboardingResponse>('/users/me/onboarding'),

  /** Partial save after each step */
  update: (data: OnboardingUpdate) =>
    api.patch<OnboardingResponse>('/users/me/onboarding', data),

  /** Marks onboardingCompleted and persists any last-step answers */
  complete: (data: OnboardingUpdate = {}) =>
    api.post<OnboardingResponse>('/users/me/onboarding/complete', data),
}
