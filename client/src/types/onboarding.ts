import type { LucideIcon } from 'lucide-react'
import {
  CalendarClock,
  Compass,
  Drumstick,
  Laugh,
  Music,
  PartyPopper,
  Sofa,
  Sparkles,
} from 'lucide-react'

/** Kept in sync with server/src/modules/onboarding/onboarding.schema.ts */
export type Interest =
  | 'LIVE_MUSIC'
  | 'DANCING'
  | 'COMEDY'
  | 'CHILL'
  | 'FOOD'
  | 'MORE'

export type ExperienceGoal = 'GO_OUT' | 'EXPLORE_PLACES' | 'PLAN_AHEAD'

export interface OnboardingState {
  firstName: string | null
  lastName: string | null
  completed: boolean
  completedAt: string | null
  step: number
  interests: Interest[]
  experienceGoal: ExperienceGoal | null
  nightVibe: number
  maxDistanceMiles: number
  notificationsEnabled: boolean
  locationSharingEnabled: boolean
  location: { lat: number; lng: number; label: string | null } | null
}

/** Partial save sent after each step */
export interface OnboardingUpdate {
  step?: number
  firstName?: string
  lastName?: string | null
  interests?: Interest[]
  locationLat?: number | null
  locationLng?: number | null
  locationLabel?: string | null
  experienceGoal?: ExperienceGoal
  nightVibe?: number
  maxDistanceMiles?: number
  notificationsEnabled?: boolean
  locationSharingEnabled?: boolean
}

export const INTERESTS: { value: Interest; label: string; icon: LucideIcon }[] = [
  { value: 'LIVE_MUSIC', label: 'Live Music', icon: Music },
  { value: 'DANCING', label: 'Dancing', icon: PartyPopper },
  { value: 'COMEDY', label: 'Comedy', icon: Laugh },
  { value: 'CHILL', label: 'Chill', icon: Sofa },
  { value: 'FOOD', label: 'Food', icon: Drumstick },
  { value: 'MORE', label: 'More', icon: Sparkles },
]

export const EXPERIENCES: {
  value: ExperienceGoal
  title: string
  description: string
  icon: LucideIcon
}[] = [
  {
    value: 'GO_OUT',
    title: 'I Want to Go Out',
    description: "See what's out and where the energy is",
    icon: PartyPopper,
  },
  {
    value: 'EXPLORE_PLACES',
    title: 'Explore Places',
    description: 'Discover venues and happenings near you',
    icon: Compass,
  },
  {
    value: 'PLAN_AHEAD',
    title: 'Plan Ahead',
    description: 'Save spots and plan your next move',
    icon: CalendarClock,
  },
]

export const TOTAL_STEPS = 6

/** Slider stops for "Near me" .. "15+ miles" */
export const MIN_DISTANCE_MILES = 1
export const MAX_DISTANCE_MILES = 15

export function formatDistanceLabel(miles: number): string {
  if (miles <= MIN_DISTANCE_MILES) return 'Near me'
  if (miles >= MAX_DISTANCE_MILES) return '15+ miles'
  return `${miles} miles`
}

export function formatNightVibeLabel(vibe: number): string {
  if (vibe < 20) return 'Chill'
  if (vibe < 40) return 'Laid back'
  if (vibe < 60) return 'Balanced'
  if (vibe < 80) return 'Lively'
  return 'Turnt'
}
