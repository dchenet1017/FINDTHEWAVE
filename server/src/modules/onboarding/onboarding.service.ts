import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'
import type { UpdateOnboardingInput } from './onboarding.schema'

/** Columns the wizard reads back on resume */
const onboardingSelect = {
  id: true,
  firstName: true,
  lastName: true,
  onboardingCompleted: true,
  onboardingCompletedAt: true,
  onboardingStep: true,
  interests: true,
  experienceGoal: true,
  nightVibe: true,
  maxDistanceMiles: true,
  notificationsEnabled: true,
  locationSharingEnabled: true,
  locationLat: true,
  locationLng: true,
  locationLabel: true,
} as const

type OnboardingRow = {
  [K in keyof typeof onboardingSelect]: any
}

function serialize(user: OnboardingRow) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    completed: user.onboardingCompleted,
    completedAt: user.onboardingCompletedAt
      ? new Date(user.onboardingCompletedAt).toISOString()
      : null,
    step: user.onboardingStep,
    interests: user.interests ?? [],
    experienceGoal: user.experienceGoal ?? null,
    nightVibe: user.nightVibe,
    maxDistanceMiles: user.maxDistanceMiles,
    notificationsEnabled: user.notificationsEnabled,
    locationSharingEnabled: user.locationSharingEnabled,
    location:
      user.locationLat != null && user.locationLng != null
        ? {
            lat: Number(user.locationLat),
            lng: Number(user.locationLng),
            label: user.locationLabel ?? null,
          }
        : null,
  }
}

export type OnboardingState = ReturnType<typeof serialize>

export const onboardingService = {
  /**
   * Current wizard state. Non-USER roles (business, wave leader, admin) have
   * their own sign-up flows, so the consumer wizard never applies to them.
   */
  async getState(userId: string): Promise<OnboardingState> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: onboardingSelect,
    })

    if (!user) throw new NotFoundError('User not found')

    return serialize(user)
  },

  /**
   * Partial save after each step. `step` only ever moves forward so going back
   * to edit an earlier answer does not rewind the resume point.
   */
  async update(userId: string, input: UpdateOnboardingInput): Promise<OnboardingState> {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingStep: true },
    })

    if (!current) throw new NotFoundError('User not found')

    const { step, ...answers } = input

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...answers,
        ...(step != null && step > current.onboardingStep
          ? { onboardingStep: step }
          : {}),
      },
      select: onboardingSelect,
    })

    return serialize(user)
  },

  /**
   * Final step. Idempotent: re-posting keeps the original completedAt so a
   * double-submit or a browser back-button replay cannot rewrite history.
   */
  async complete(userId: string, input: UpdateOnboardingInput): Promise<OnboardingState> {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true, onboardingCompletedAt: true },
    })

    if (!current) throw new NotFoundError('User not found')

    const { step: _step, ...answers } = input

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...answers,
        onboardingCompleted: true,
        onboardingStep: 6,
        onboardingCompletedAt: current.onboardingCompletedAt ?? new Date(),
      },
      select: onboardingSelect,
    })

    return serialize(user)
  },
}
