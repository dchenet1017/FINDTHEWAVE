/**
 * Empties the database for a clean pilot launch: every user, venue, event,
 * crawl, booking, check-in, offer and notification goes. Admin accounts are
 * kept so the team can still sign in, and community categories are kept with
 * their member counts zeroed.
 *
 * Dry run by default - it prints what it would delete and changes nothing.
 *
 *   npm run db:reset:pilot              # report only
 *   npm run db:reset:pilot -- --yes     # delete
 *
 * A non-local database is refused unless ALLOW_PILOT_RESET=yes is set. Take a
 * backup first: nothing this deletes can be brought back.
 */
import { PrismaClient } from '@prisma/client'

function assertSafeTarget() {
  const url = process.env.DATABASE_URL ?? ''
  const optedIn = process.env.ALLOW_PILOT_RESET === 'yes'
  const isLocal = /@(localhost|127\.0\.0\.1|host\.docker\.internal|postgres)[:/]/.test(url)

  const reasons: string[] = []
  if (process.env.NODE_ENV === 'production') reasons.push('NODE_ENV=production')
  if (url && !isLocal) reasons.push('DATABASE_URL does not point at localhost')

  if (reasons.length && !optedIn) {
    console.error('\n⛔ Refusing to reset this database.')
    for (const r of reasons) console.error(`   - ${r}`)
    console.error('\n   Back it up, then re-run with ALLOW_PILOT_RESET=yes if you really mean it.\n')
    process.exit(1)
  }
  if (reasons.length && optedIn) {
    console.warn('⚠️  Non-local database, continuing because ALLOW_PILOT_RESET=yes')
  }
}

assertSafeTarget()

const prisma = new PrismaClient()
const apply = process.argv.includes('--yes')

type Db = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

/**
 * Children before parents. Several relations (CheckIn -> User/Business,
 * Partnership) have no cascade, so the order matters, not just the result.
 * Each step takes the client so the same list drives the dry-run counts and
 * the transactional delete.
 */
const nonAdmin = { role: { not: 'ADMIN' as const } }
const steps: { label: string; count: (db: Db) => Promise<number>; remove: (db: Db) => Promise<unknown> }[] = [
  { label: 'Business offers', count: (db) => db.businessOffer.count(), remove: (db) => db.businessOffer.deleteMany() },
  { label: 'Go-out intents', count: (db) => db.goOutIntent.count(), remove: (db) => db.goOutIntent.deleteMany() },
  { label: 'Business invites', count: (db) => db.businessInvite.count(), remove: (db) => db.businessInvite.deleteMany() },
  { label: 'Go-out statuses (legacy)', count: (db) => db.goOutStatus.count(), remove: (db) => db.goOutStatus.deleteMany() },
  { label: 'Crawl stop check-ins', count: (db) => db.crawlStopCheckIn.count(), remove: (db) => db.crawlStopCheckIn.deleteMany() },
  { label: 'Crawl attendees', count: (db) => db.crawlAttendee.count(), remove: (db) => db.crawlAttendee.deleteMany() },
  { label: 'Crawl stops', count: (db) => db.crawlStop.count(), remove: (db) => db.crawlStop.deleteMany() },
  { label: 'Crawls', count: (db) => db.crawl.count(), remove: (db) => db.crawl.deleteMany() },
  { label: 'Event check-ins', count: (db) => db.eventCheckIn.count(), remove: (db) => db.eventCheckIn.deleteMany() },
  { label: 'Event attendees', count: (db) => db.eventAttendee.count(), remove: (db) => db.eventAttendee.deleteMany() },
  { label: 'Events', count: (db) => db.event.count(), remove: (db) => db.event.deleteMany() },
  { label: 'Check-ins', count: (db) => db.checkIn.count(), remove: (db) => db.checkIn.deleteMany() },
  { label: 'Favorites', count: (db) => db.favorite.count(), remove: (db) => db.favorite.deleteMany() },
  { label: 'Bookings', count: (db) => db.booking.count(), remove: (db) => db.booking.deleteMany() },
  { label: 'Community leader assignments', count: (db) => db.communityWaveLeader.count(), remove: (db) => db.communityWaveLeader.deleteMany() },
  { label: 'Community memberships', count: (db) => db.communityMembership.count(), remove: (db) => db.communityMembership.deleteMany() },
  { label: 'Advertisements', count: (db) => db.advertisement.count(), remove: (db) => db.advertisement.deleteMany() },
  { label: 'Promotions', count: (db) => db.promotion.count(), remove: (db) => db.promotion.deleteMany() },
  { label: 'Partnerships', count: (db) => db.partnership.count(), remove: (db) => db.partnership.deleteMany() },
  { label: 'Wave leader profiles', count: (db) => db.waveLeader.count(), remove: (db) => db.waveLeader.deleteMany() },
  { label: 'Businesses', count: (db) => db.business.count(), remove: (db) => db.business.deleteMany() },
  { label: 'Notifications', count: (db) => db.notification.count(), remove: (db) => db.notification.deleteMany() },
  { label: 'Reward balances', count: (db) => db.userReward.count(), remove: (db) => db.userReward.deleteMany() },
  {
    label: 'Sessions (non-admin)',
    count: (db) => db.refreshToken.count({ where: { user: nonAdmin } }),
    remove: (db) => db.refreshToken.deleteMany({ where: { user: nonAdmin } }),
  },
  { label: 'Users (non-admin)', count: (db) => db.user.count({ where: nonAdmin }), remove: (db) => db.user.deleteMany({ where: nonAdmin }) },
]

async function main() {
  console.log(`\n=== Pilot reset (${apply ? 'APPLYING' : 'dry run'}) ===\n`)

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } })
  if (admins.length === 0) {
    console.error('⛔ No ADMIN account exists - resetting would lock everyone out. Create one first.')
    process.exit(1)
  }

  for (const step of steps) {
    console.log(`  ${step.label.padEnd(30)} ${await step.count(prisma)}`)
  }
  console.log(`\n  Kept: ${admins.length} admin account(s): ${admins.map((a) => a.email).join(', ')}`)
  console.log('  Kept: community categories (member counts reset to 0)')

  if (!apply) {
    console.log('\nDry run - nothing changed. Re-run with --yes to delete.\n')
    return
  }

  // All of it or none of it
  await prisma.$transaction(
    async (tx) => {
      for (const step of steps) await step.remove(tx)
      await tx.community.updateMany({ data: { totalMembers: 0 } })
    },
    { timeout: 120_000 }
  )

  console.log('\n✅ Done. The database is empty apart from admin accounts and community categories.\n')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
