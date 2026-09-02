import { markerColors } from '@/lib/mapbox'

/**
 * Builds the DOM elements Mapbox GL renders as custom markers.
 *
 * Plain DOM rather than React: Mapbox owns these nodes, and going through a
 * React root per marker costs a reconciler for every pin on screen.
 *
 * Each venue category gets its own small SVG whose parts are animated by CSS
 * keyframes in styles/map.css. Motion is deliberately slow and small - the
 * point is "this place is alive", not a light show. All of it is disabled
 * under prefers-reduced-motion.
 */

export type VenueMarkerType =
  | 'BAR'
  | 'RESTAURANT'
  | 'ENTERTAINMENT'
  | 'FITNESS'
  | 'WELLNESS'
  | 'HOTEL'
  | 'OTHER'
  | 'WAVELEADER'
  | 'USER'

export interface VenueMarkerOptions {
  /** Draws the 🕺 badge for a venue with a live Go Out offer */
  hasActiveOffer?: boolean
  isSelected?: boolean
  /** Kept from the old marker: a ring for promoted venues */
  isSponsored?: boolean
  /** Accessible name, e.g. the venue name */
  label?: string
}

/**
 * Category art. Every `class="wf-anim-*"` node is driven by a keyframe in
 * map.css; the rest is static scenery.
 *
 * Drawn on a 24x24 grid with a common ground line at y=19 so the different
 * scenes sit at the same height inside the marker chip.
 */
const ART: Record<string, string> = {
  // Two people seated at a table - heads bob, steam drifts up from the plate.
  RESTAURANT: `
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <path d="M4 19v-3" class="wf-anim-sit-a" />
      <circle cx="4" cy="12.5" r="2" class="wf-anim-sit-a" />
      <path d="M20 19v-3" class="wf-anim-sit-b" />
      <circle cx="20" cy="12.5" r="2" class="wf-anim-sit-b" />
      <path d="M7.5 19h9" stroke-width="1.8" />
      <path d="M12 19v-2.5" />
      <path d="M9 16.5h6" stroke-width="1.8" />
      <path d="M12 13.5v-2" class="wf-anim-steam" opacity="0.85" />
    </g>`,

  // Two people standing at a bar counter - one raises a glass.
  BAR: `
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <path d="M3.5 19v-5" />
      <circle cx="3.5" cy="11" r="2" />
      <path d="M3.5 15.5l3-1.5" class="wf-anim-cheers-a" />
      <path d="M20.5 19v-5" />
      <circle cx="20.5" cy="11" r="2" />
      <path d="M20.5 15.5l-3-1.5" class="wf-anim-cheers-b" />
      <path d="M8 19h8" stroke-width="1.8" />
      <path d="M9.5 19v-6h5v6" />
      <path d="M12 11.5V9" class="wf-anim-fizz" opacity="0.85" />
    </g>`,

  // Bouncing note over an equaliser - the closest fit for a music venue.
  ENTERTAINMENT: `
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <g class="wf-anim-note">
        <path d="M11 12V5l6-1.5V10" />
        <circle cx="9.2" cy="12.4" r="1.9" fill="currentColor" stroke="none" />
        <circle cx="15.2" cy="10.4" r="1.9" fill="currentColor" stroke="none" />
      </g>
      <path d="M4 19v-3" class="wf-anim-eq-a" stroke-width="2" />
      <path d="M8 19v-5" class="wf-anim-eq-b" stroke-width="2" />
      <path d="M16 19v-4" class="wf-anim-eq-c" stroke-width="2" />
      <path d="M20 19v-6" class="wf-anim-eq-a" stroke-width="2" />
    </g>`,

  // A dumbbell being pressed up and down.
  FITNESS: `
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <g class="wf-anim-lift">
        <path d="M8 12h8" stroke-width="2" />
        <path d="M5.5 9.5v5" stroke-width="2.4" />
        <path d="M18.5 9.5v5" stroke-width="2.4" />
        <path d="M3.5 11v2" stroke-width="1.8" />
        <path d="M20.5 11v2" stroke-width="1.8" />
      </g>
      <path d="M6 19h12" stroke-width="1.8" opacity="0.6" />
    </g>`,

  // Everything else: a quiet breathing dot with one slow ring. Deliberately
  // not the old ping - it settles instead of hammering outward.
  DEFAULT: `
    <g fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" class="wf-anim-breathe" />
      <circle cx="12" cy="12" r="7" stroke-width="1.4" class="wf-anim-ring" opacity="0.5" />
    </g>`,
}

/** Which art each BusinessType gets. */
const TYPE_TO_ART: Record<string, keyof typeof ART> = {
  RESTAURANT: 'RESTAURANT',
  BAR: 'BAR',
  ENTERTAINMENT: 'ENTERTAINMENT',
  FITNESS: 'FITNESS',
  // No music-venue type exists in the BusinessType enum, so ENTERTAINMENT
  // carries concerts and live music. WELLNESS/HOTEL/OTHER fall through.
  WELLNESS: 'DEFAULT',
  HOTEL: 'DEFAULT',
  OTHER: 'DEFAULT',
  WAVELEADER: 'DEFAULT',
  USER: 'DEFAULT',
}

const TYPE_LABEL: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  BAR: 'Bar',
  ENTERTAINMENT: 'Music venue',
  FITNESS: 'Gym',
  WELLNESS: 'Wellness',
  HOTEL: 'Hotel',
  OTHER: 'Venue',
  WAVELEADER: 'Wave leader',
  USER: 'You',
}

export function artKeyForType(type: string): string {
  return TYPE_TO_ART[type] ?? 'DEFAULT'
}

/**
 * Creates the marker element. The caller owns it and should remove the marker
 * (which detaches this node) when done.
 */
export function createVenueMarkerElement(
  type: VenueMarkerType | string,
  options: VenueMarkerOptions = {}
): HTMLDivElement {
  const { hasActiveOffer = false, isSelected = false, isSponsored = false, label } = options

  const color = markerColors[type] || markerColors.OTHER
  const artKey = artKeyForType(type)

  const root = document.createElement('div')
  root.className = 'wf-venue-marker'
  root.dataset.type = type
  root.style.setProperty('--wf-marker-color', color)

  const typeName = TYPE_LABEL[type] ?? 'Venue'
  root.setAttribute('role', 'button')
  root.setAttribute('tabindex', '0')
  root.setAttribute(
    'aria-label',
    [label, typeName, hasActiveOffer ? 'has a live offer' : null]
      .filter(Boolean)
      .join(' — ')
  )

  const chip = document.createElement('div')
  chip.className = 'wf-venue-marker__chip'
  chip.innerHTML = `<svg viewBox="0 0 24 24" class="wf-venue-marker__art" aria-hidden="true" focusable="false">${ART[artKey]}</svg>`
  root.appendChild(chip)

  if (isSponsored) {
    const ring = document.createElement('span')
    ring.className = 'wf-venue-marker__sponsor-ring'
    root.appendChild(ring)
  }

  if (hasActiveOffer) {
    root.appendChild(createOfferBadge())
  }

  setVenueMarkerSelected(root, isSelected)

  return root
}

function createOfferBadge(): HTMLSpanElement {
  const badge = document.createElement('span')
  badge.className = 'wf-venue-marker__badge'
  badge.textContent = '🕺'
  badge.title = 'Running a live offer right now'
  return badge
}

/** Toggle selection without rebuilding the element. */
export function setVenueMarkerSelected(el: HTMLElement, isSelected: boolean) {
  el.classList.toggle('wf-venue-marker--selected', isSelected)
}

/**
 * Add or remove the 🕺 badge in place, so an offer going live does not force a
 * marker teardown (which would restart every animation on the map).
 */
export function setVenueMarkerOffer(el: HTMLElement, hasActiveOffer: boolean) {
  const existing = el.querySelector('.wf-venue-marker__badge')
  if (hasActiveOffer && !existing) {
    el.appendChild(createOfferBadge())
  } else if (!hasActiveOffer && existing) {
    existing.remove()
  }
}
