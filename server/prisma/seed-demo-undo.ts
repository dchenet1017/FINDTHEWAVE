/**
 * Removes the rows created by seed-demo.ts.
 *
 * Dry run by default - it prints what it would delete and changes nothing.
 * Pass --yes to actually delete.
 *
 *   npm run db:seed:demo:undo            # report only
 *   npm run db:seed:demo:undo -- --yes   # delete
 *
 * IMPORTANT - what this CANNOT undo:
 *
 *  1. seed-demo.ts starts with `businessOffer.deleteMany()` and
 *     `goOutIntent.deleteMany()`, both unfiltered, which empty those tables
 *     entirely. Rows destroyed that way are gone; nothing here brings them
 *     back. Only a database backup can.
 *
 *  2. It overwrites user@wavefinder.com's onboarding profile in place
 *     (onboardingCompleted/Step/CompletedAt, interests, experienceGoal). The
 *     previous values are not recorded anywhere, so this script leaves that
 *     account alone rather than guessing. Fix it by hand if it mattered.
 *
 *  3. Broadcast offers (intentId = null) carry no marker distinguishing them
 *     from real ones - BusinessOffer has no such column - so they are reported
 *     for manual review, never deleted automatically.
 */
import { PrismaClient } from '@prisma/client'

/** Same guard as seed-demo.ts: refuse a non-local database unless opted in. */
function assertNotProduction() {
  const url = process.env.DATABASE_URL ?? ''
  const optedIn = process.env.ALLOW_DEMO_SEED === 'yes'

  const isLocal = /@(localhost|127\.0\.0\.1|host\.docker\.internal|postgres)[:/]/.test(url)
  const reasons: string[] = []

  if (process.env.NODE_ENV === 'production') reasons.push('NODE_ENV=production')
  if (url && !isLocal) reasons.push('DATABASE_URL does not point at localhost')

  if (reasons.length && !optedIn) {
    console.error('\n⛔ Refusing to touch this database.')
    for (const r of reasons) console.error(`   - ${r}`)
    console.error('\n   Re-run with ALLOW_DEMO_SEED=yes if you really mean it.\n')
    process.exit(1)
  }

  if (reasons.length && optedIn) {
    console.warn('⚠️  Non-local database, continuing because ALLOW_DEMO_SEED=yes')
  }
}

assertNotProduction()

const prisma = new PrismaClient()
const DEMO_DOMAIN = '@demo.wavefinder.com'
const apply = process.argv.includes('--yes')

async function main() {
  console.log(`\n=== Demo seed cleanup (${apply ? 'APPLYING' : 'dry run'}) ===\n`)

  const demoUsers = await prisma.user.findMany({
    where: { email: { endsWith: DEMO_DOMAIN } },
    select: { id: true, email: true },
  })
  const demoUserIds = demoUsers.map((u) => u.id)

  const intents = await prisma.goOutIntent.findMany({
    where: { userId: { in: demoUserIds } },
    select: { id: true },
  })
  const intentIds = intents.map((i) => i.id)

  const targetedOffers = await prisma.businessOffer.count({
    where: { intentId: { in: intentIds } },
  })

  console.log(`Demo users (${DEMO_DOMAIN}):        ${demoUsers.length}`)
  console.log(`  their go-out intents:              ${intents.length}`)
  console.log(`  offers targeted at those intents:  ${targetedOffers}`)

  // Deleting the user cascades to GoOutIntent, which cascades to BusinessOffer,
  // so one delete clears all three. See onDelete: Cascade in schema.prisma.
  if (apply) {
    const removed = await prisma.user.deleteMany({
      where: { email: { endsWith: DEMO_DOMAIN } },
    })
    console.log(`\n🧹 Deleted ${removed.count} demo users (intents and their offers cascaded).`)
  } else {
    console.log('\n(dry run - nothing deleted; re-run with --yes)')
  }

  // Broadcast offers cannot be attributed to the seed, so only report them.
  const broadcast = await prisma.businessOffer.findMany({
    where: { intentId: null },
    select: { id: true, message: true, businessId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  if (broadcast.length) {
    console.log(
      `\n⚠️  ${broadcast.length} broadcast offer(s) (intentId = null) need manual review.` +
        '\n   These are indistinguishable from real ones. seed-demo.ts creates them with' +
        '\n   these messages:' +
        '\n     - "Quiet early crowd tonight - come claim the good seats."'
    )
    for (const o of broadcast) {
      console.log(
        `   ${o.id}  ${o.createdAt.toISOString()}  business=${o.businessId}  "${o.message.slice(0, 60)}"`
      )
    }
  }

  const testUser = await prisma.user.findUnique({
    where: { email: 'user@wavefinder.com' },
    select: { onboardingCompleted: true, onboardingStep: true, interests: true },
  })
  if (testUser) {
    console.log(
      '\nℹ️  user@wavefinder.com was modified in place by the seed and is NOT reset here:' +
        `\n   onboardingCompleted=${testUser.onboardingCompleted} step=${testUser.onboardingStep} ` +
        `interests=[${testUser.interests.join(', ')}]`
    )
  }

  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
