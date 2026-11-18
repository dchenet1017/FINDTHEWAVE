import { cn } from '@/lib/utils'

interface ListingBadgesProps {
  business: { isClaimed?: boolean | null; isExampleData?: boolean | null }
  className?: string
}

/**
 * Tells people what kind of listing they're looking at:
 *  - "Example data": a sample venue used for demos. Its activity is illustrative.
 *  - "Unclaimed": a real place imported from a public directory that hasn't
 *    joined WaveFinder yet, so it has no owner, offers or reviews.
 * Renders nothing for an ordinary, owner-run venue.
 */
export function ListingBadges({ business, className }: ListingBadgesProps) {
  if (business.isExampleData) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300',
          className
        )}
        title="Sample venue for demos. Not a real business; its activity is illustrative."
      >
        Example data
      </span>
    )
  }
  if (business.isClaimed === false) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-gray-300',
          className
        )}
        title="Listed from a public directory. This business hasn't joined WaveFinder yet."
      >
        Unclaimed
      </span>
    )
  }
  return null
}
