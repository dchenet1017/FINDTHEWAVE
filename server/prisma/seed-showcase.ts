/**
 * Example data for the Brooklyn pilot demo video.
 *
 * Real places come from the directory import (prisma/import/), as unclaimed
 * listings with no activity. Everything this script adds is SAMPLE activity,
 * and all of it is fenced into one demo venue plus demo people:
 *
 *   - one business account, "WaveFinder Example Venue", flagged isExampleData
 *     and labelled "Example data" wherever it appears
 *   - demo people (also isExampleData) whose check-ins, offers, points and
 *     event sign-ups all happen at that venue only
 *
 * Nothing here references a real listing: no check-ins, favourites, reviews,
 * offers, events or partnerships at a real business. The server keeps the two
 * worlds apart too - example hands never reach real venues' demand panels or
 * the public hotspot pulse, and the example venue can't offer anything to a
 * real person (see go-out.service.ts findNearbyIntents).
 *
 * Logins it prints:
 *   newuser@showcase.wavefinder.com   onboarding from step 1
 *   maya@showcase.wavefinder.com      user dashboard with sample history
 *   owner@showcase.wavefinder.com     business dashboard for the example venue
 *
 *   npm run db:seed:showcase                         # local
 *   ALLOW_DEMO_SEED=yes npm run db:seed:showcase     # any other DB
 *   npm run db:seed:showcase -- --undo               # remove all of it
 *
 * Each run first removes the previous one, so re-running refreshes it (e.g.
 * after the onboarding account has been walked through).
 *
 * Optional env:
 *   DEMO_PASSWORD    one password for the three logins (else random, printed once)
 *   SHOWCASE_HOURS   how long hands and offers stay live (default 48)
 *   SHOWCASE_LAT/LNG where to put the example venue (default: Fort Greene Park's
 *                    north edge, inside the pilot area but not on a real address)
 */
import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

function assertNotProduction() {
  const url = process.env.DATABASE_URL ?? ''
  const optedIn = process.env.ALLOW_DEMO_SEED === 'yes'
  const isLocal = /@(localhost|127\.0\.0\.1|host\.docker\.internal|postgres)[:/]/.test(url)
  const reasons: string[] = []
  if (process.env.NODE_ENV === 'production') reasons.push('NODE_ENV=production')
  if (url && !isLocal) reasons.push('DATABASE_URL does not point at localhost')
  if (reasons.length && !optedIn) {
    console.error('\n⛔ Refusing to seed.')
    for (const r of reasons) console.error(`   - ${r}`)
    console.error(
      '\n   This only adds/removes rows owned by @showcase.wavefinder.com accounts,' +
        '\n   but confirm the target anyway: re-run with ALLOW_DEMO_SEED=yes\n'
    )
    process.exit(1)
  }
  if (reasons.length) console.warn('⚠️  Non-local database, continuing because ALLOW_DEMO_SEED=yes\n')
}

assertNotProduction()

const prisma = new PrismaClient()
const DOMAIN = '@showcase.wavefinder.com'
const UNDO = process.argv.includes('--undo')
const LIVE_HOURS = Number(process.env.SHOWCASE_HOURS ?? 48)
if (!Number.isFinite(LIVE_HOURS) || LIVE_HOURS <= 0) {
  console.error(`SHOWCASE_HOURS must be a positive number, got "${process.env.SHOWCASE_HOURS}"`)
  process.exit(1)
}
const VENUE_LAT = Number(process.env.SHOWCASE_LAT ?? 40.69255)
const VENUE_LNG = Number(process.env.SHOWCASE_LNG ?? -73.97515)
const EXAMPLE = 'Example data'

// --- Time helpers -----------------------------------------------------------
// The pilot is in Brooklyn, so wall-clock times are New York times regardless
// of where this script runs. (The server should run with TZ=America/New_York
// so its peak-hours chart and "today" agree - see render.yaml.)
const TZ = 'America/New_York'
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const now = new Date()
const fromNow = (ms: number) => new Date(now.getTime() + ms)

function nyParts(d: Date) {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(d)
  const get = (t: string) => Number(p.find((x) => x.type === t)!.value)
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour'), min: get('minute'), s: get('second') }
}

/** The instant that is `hour:minute` New York time, `daysFromToday` days from today (NY). */
function nyAt(daysFromToday: number, hour: number, minute = 0): Date {
  const today = nyParts(now)
  const guess = Date.UTC(today.y, today.m - 1, today.d + daysFromToday, hour, minute)
  const p = nyParts(new Date(guess))
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s)
  return new Date(guess - (asUtc - guess))
}
const nyHourNow = nyParts(now).h
const nyWeekday = (daysFromToday: number) => nyAt(daysFromToday, 12).getUTCDay()

// Deterministic randomness, so every run produces the same-looking charts.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261117)
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
const between = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))

function generatePassword() {
  return `Wv${randomBytes(12).toString('base64url').replace(/[-_]/g, '')}7!`
}

// --- Cleanup (also the whole of --undo) -------------------------------------
async function removePreviousRun() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: DOMAIN } },
    select: { id: true, business: { select: { id: true } } },
  })
  if (!users.length) return 0
  const userIds = users.map((u) => u.id)
  const businessIds = users.flatMap((u) => (u.business ? [u.business.id] : []))

  await prisma.$transaction([
    // CheckIn and Partnership have no cascade from User/Business.
    prisma.checkIn.deleteMany({
      where: { OR: [{ userId: { in: userIds } }, { businessId: { in: businessIds } }] },
    }),
    prisma.partnership.deleteMany({
      where: { OR: [{ businessId: { in: businessIds } }, { partnerId: { in: businessIds } }] },
    }),
    // Crawl.hostBusiness is SetNull, so hosted crawls would otherwise be orphaned.
    prisma.crawl.deleteMany({
      where: { OR: [{ hostBusinessId: { in: businessIds } }, { createdByUserId: { in: userIds } }] },
    }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ])
  return users.length
}

const FIRST = ['Callum', 'Jordan', 'Priya', 'Andre', 'Lena', 'Tomas', 'Devon', 'Ava', 'Ben', 'Zoe', 'Omar',
  'Chloe', 'Malik', 'Sofia', 'Ethan', 'Nadia', 'Leo', 'Imani', 'Caleb', 'Hana', 'Rafael', 'Tessa',
  'Isaac', 'Mira', 'Jonah', 'Keisha', 'Arjun', 'Lily', 'Diego', 'Noor', 'Felix', 'Ruby', 'Samir',
  'Grace', 'Theo', 'Elena', 'Kai', 'Amara', 'Owen', 'Jade']
const LAST = ['Reed', 'Vega', 'Shah', 'Diaz', 'Novak', 'Lund', 'Price', 'Kerr', 'Ito', 'Hart', 'Faris',
  'Moreau', 'Grant', 'Rossi', 'Wells', 'Haddad', 'Brandt', 'Owens', 'Fischer', 'Sato', 'Cruz', 'Lowe',
  'Baptiste', 'Kapoor', 'Stone', 'Morgan', 'Iyer', 'Chen', 'Ortiz', 'Aziz', 'Weber', 'Quinn', 'Nasser',
  'Holt', 'Brooks', 'Petrov', 'Tanaka', 'Eze', 'Byrne', 'Lam']
const CROWD_SIZE = 40
const VIBES = ['ROOFTOP', 'DRINKS', 'LIVE_MUSIC', 'DANCING', 'FOOD', 'CHILL', 'COMEDY'] as const

/** NY-time hour weights: lunch bump, big evening peak. */
const HOUR_WEIGHTS: [number, number][] = [
  [8, 2], [9, 3], [10, 3], [11, 4], [12, 7], [13, 7], [14, 4], [15, 3], [16, 4],
  [17, 7], [18, 10], [19, 13], [20, 14], [21, 12], [22, 9], [23, 5], [0, 2],
]
function weightedHour(): number {
  const total = HOUR_WEIGHTS.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [h, w] of HOUR_WEIGHTS) if ((r -= w) <= 0) return h
  return 20
}

async function main() {
  console.log(`\n🧪 Example data for the demo${UNDO ? ' (undo)' : ''}\n`)
  const removed = await removePreviousRun()
  if (removed) console.log(`   removed ${removed} example account(s) from a previous run`)
  if (UNDO) {
    console.log('\n🧹 Example data removed.\n')
    return
  }

  const explicit = process.env.DEMO_PASSWORD
  const loginPassword = explicit ?? generatePassword()
  const loginHash = await bcrypt.hash(loginPassword, 10)
  // Accounts nobody logs into get an unknown password.
  const lockedHash = await bcrypt.hash(generatePassword(), 10)

  // --- The example venue -------------------------------------------------------
  const owner = await prisma.user.create({
    include: { business: { select: { id: true } } },
    data: {
      email: `owner${DOMAIN}`,
      password: loginHash,
      firstName: 'Example',
      lastName: 'Owner',
      role: 'BUSINESS',
      isExampleData: true,
      isVerified: true,
      isActive: true,
      onboardingCompleted: true,
      onboardingCompletedAt: fromNow(-75 * DAY),
      onboardingStep: 6,
      createdAt: fromNow(-80 * DAY),
      business: {
        create: {
          name: 'WaveFinder Example Venue',
          description:
            `${EXAMPLE}: a sample venue used to demonstrate the WaveFinder business tools. ` +
            'It is not a real business, and its check-ins, offers and events are illustrative.',
          type: 'RESTAURANT',
          address: `${EXAMPLE} – not a real venue`,
          city: 'Brooklyn',
          state: 'NY',
          zipCode: '11205',
          latitude: VENUE_LAT,
          longitude: VENUE_LNG,
          images: [],
          isVerified: false,
          isActive: true,
          isClaimed: true,
          isExampleData: true,
          approvalStatus: 'APPROVED',
          createdAt: fromNow(-78 * DAY),
        },
      },
    },
  })
  const venueId = owner.business!.id

  // --- Example people ------------------------------------------------------------
  const maya = await prisma.user.create({
    data: {
      email: `maya${DOMAIN}`,
      password: loginHash,
      firstName: 'Maya',
      lastName: 'Brooks',
      role: 'USER',
      isExampleData: true,
      isVerified: true,
      isActive: true,
      onboardingCompleted: true,
      onboardingCompletedAt: fromNow(-62 * DAY),
      onboardingStep: 6,
      interests: ['LIVE_MUSIC', 'FOOD', 'DRINKS', 'ROOFTOP'],
      experienceGoal: 'GO_OUT',
      nightVibe: 70,
      maxDistanceMiles: 3,
      locationSharingEnabled: true,
      locationLat: 40.6912,
      locationLng: -73.9718,
      locationLabel: 'Fort Greene, Brooklyn',
      createdAt: fromNow(-63 * DAY),
    },
  })

  await prisma.user.create({
    data: {
      email: `newuser${DOMAIN}`,
      password: loginHash,
      firstName: 'Jamie',
      lastName: 'Rivera',
      role: 'USER',
      isExampleData: true,
      isVerified: true,
      isActive: true,
      onboardingCompleted: false,
      onboardingStep: 1,
    },
  })

  await prisma.user.createMany({
    data: Array.from({ length: CROWD_SIZE }, (_, i) => ({
      email: `guest${i + 1}${DOMAIN}`,
      password: lockedHash,
      firstName: FIRST[i % FIRST.length],
      lastName: LAST[(i * 7) % LAST.length],
      role: 'USER' as const,
      isExampleData: true,
      isVerified: true,
      isActive: true,
      onboardingCompleted: true,
      onboardingCompletedAt: fromNow(-between(5, 70) * DAY),
      onboardingStep: 6,
      interests: [pick(VIBES), pick(VIBES)].filter((v, j, a) => a.indexOf(v) === j),
      experienceGoal: 'GO_OUT' as const,
      nightVibe: between(30, 95),
      locationLat: 40.6895 + (rand() - 0.5) * 0.014,
      locationLng: -73.9760 + (rand() - 0.5) * 0.018,
      locationLabel: 'Brooklyn, NY',
      createdAt: fromNow(-between(10, 75) * DAY),
    })),
  })
  const crowd = await prisma.user.findMany({
    where: { email: { startsWith: 'guest', endsWith: DOMAIN } },
    select: { id: true, email: true, locationLat: true, locationLng: true },
  })
  crowd.sort((a, b) => Number(a.email.match(/\d+/)![0]) - Number(b.email.match(/\d+/)![0]))

  // --- Check-ins, all at the example venue ------------------------------------------
  // Zipf-ish loyalty so "Top customers" reads naturally.
  const seen = new Set<string>()
  const checkIns: Prisma.CheckInCreateManyInput[] = []
  const methods = ['QR_CODE', 'QR_CODE', 'GEOFENCE', 'GEOFENCE', 'MANUAL'] as const
  function addCheckIn(userId: string, daysAgo: number, hour: number, minute: number) {
    if (daysAgo === 0 && (hour > nyHourNow || hour < 6)) return false
    const dedupe = `${userId}|${daysAgo}`
    if (seen.has(dedupe)) return false
    // Hours after midnight belong to the following calendar day.
    const at = nyAt(hour < 6 ? -daysAgo + 1 : -daysAgo, hour, minute)
    if (at > now) return false
    seen.add(dedupe)
    checkIns.push({ userId, businessId: venueId, method: pick(methods), points: 10, createdAt: at })
    return true
  }
  const crowdPick = () => crowd[Math.min(crowd.length - 1, Math.floor(crowd.length * rand() ** 1.8))]

  for (let d = 60; d >= 0; d--) {
    const wd = nyWeekday(-d)
    const weekend = wd === 5 || wd === 6
    const growth = 0.75 + 0.5 * (1 - d / 60)
    const n = Math.max(0, Math.round(6 * (weekend ? 1.7 : wd === 0 ? 1.2 : 1) * growth + (rand() - 0.5) * 6))
    for (let k = 0; k < n; k++) addCheckIn(crowdPick().id, d, weightedHour(), between(0, 59))
  }
  for (let k = 0; k < 6; k++) addCheckIn(crowdPick().id, 0, Math.max(8, nyHourNow - between(0, 4)), between(0, 59))

  let mayaCount = 0
  for (let k = 0; k < 14; k++) {
    if (addCheckIn(maya.id, between(2, 58), pick([12, 18, 19, 20, 21]), between(0, 59))) mayaCount++
  }
  if (addCheckIn(maya.id, 1, 19, 12)) mayaCount++

  await prisma.checkIn.createMany({ data: checkIns })

  const mayaPoints = mayaCount * 10 + 30
  await prisma.userReward.create({
    data: { userId: maya.id, points: mayaPoints, totalEarned: mayaPoints, level: 2 },
  })
  const crowdTotals = new Map<string, number>()
  for (const c of checkIns) if (c.userId !== maya.id) crowdTotals.set(c.userId, (crowdTotals.get(c.userId) ?? 0) + 10)
  await prisma.userReward.createMany({
    data: [...crowdTotals].map(([userId, pts]) => ({
      userId, points: pts, totalEarned: pts, level: pts >= 300 ? 3 : pts >= 100 ? 2 : 1,
    })),
  })
  await prisma.favorite.createMany({
    data: [maya, ...crowd.slice(0, 18)].map((u) => ({ userId: u.id, businessId: venueId })),
  })

  // --- Promotions + ads -------------------------------------------------------
  await prisma.promotion.createMany({
    data: [
      { businessId: venueId, title: 'Happy Hour (example)', description: 'Sample promotion: half-price drinks 5–7pm.',
        discount: '50% off drinks', startDate: fromNow(-14 * DAY), endDate: fromNow(21 * DAY), createdAt: fromNow(-15 * DAY) },
      { businessId: venueId, title: 'First Visit Perk (example)', description: 'Sample promotion: first drink free for new WaveFinder guests.',
        discount: 'Free first drink', startDate: fromNow(-30 * DAY), endDate: fromNow(30 * DAY), createdAt: fromNow(-31 * DAY) },
      { businessId: venueId, title: 'Late Night Menu (example)', description: 'Sample scheduled promotion.',
        discount: '$25 tasting', startDate: nyAt(8, 17), endDate: nyAt(9, 1), createdAt: fromNow(-2 * DAY) },
      { businessId: venueId, title: 'Autumn Special (example)', description: 'Sample ended promotion.',
        discount: '$18 box', startDate: fromNow(-25 * DAY), endDate: fromNow(-17 * DAY), isActive: false, createdAt: fromNow(-26 * DAY) },
    ],
  })
  await prisma.advertisement.createMany({
    data: [
      { businessId: venueId, title: 'Happy Hour is back (example)', description: 'Sample ad shown to people nearby during peak hours.',
        ctaText: 'Get directions', targetRadius: 2, peakHoursOnly: true, dailyBudget: 15, totalBudget: 300, spent: 187.5,
        startDate: fromNow(-14 * DAY), endDate: fromNow(6 * DAY), status: 'ACTIVE', impressions: 8420, clicks: 512, conversions: 96 },
      { businessId: venueId, title: 'Weekend Brunch (example)', description: 'Sample paused ad.', ctaText: 'See menu',
        targetRadius: 3, dailyBudget: 10, totalBudget: 200, spent: 64, startDate: fromNow(-10 * DAY), endDate: fromNow(20 * DAY),
        status: 'PAUSED', impressions: 2950, clicks: 141, conversions: 22 },
    ],
  })

  // --- Events at the example venue only -----------------------------------------------
  const EVENTS = [
    { title: 'Example: Wine Tasting Night', category: 'FOOD_DRINK' as const, start: nyAt(2, 19), end: nyAt(2, 22),
      max: 40, price: 35, going: 26, featured: true },
    { title: 'Example: Live Music Friday', category: 'MUSIC' as const, start: nyAt(4, 21), end: nyAt(5, 1),
      max: 120, price: null, going: 31, featured: false },
    { title: 'Example: Latte Art Throwdown', category: 'FOOD_DRINK' as const, start: nyAt(-9, 18), end: nyAt(-9, 20),
      max: 50, price: null, going: 24, featured: false, past: true },
  ]
  for (const e of EVENTS) {
    const goingIds = [maya, ...crowd].slice(0, e.going).map((u) => u.id)
    const ev = await prisma.event.create({
      data: {
        businessId: venueId,
        title: e.title,
        description: `${EXAMPLE}: a sample event at the WaveFinder Example Venue, used to show how events work.`,
        category: e.category,
        tags: ['example'],
        venueName: 'WaveFinder Example Venue',
        address: `${EXAMPLE} – not a real venue`,
        latitude: VENUE_LAT,
        longitude: VENUE_LNG,
        startDate: e.start,
        endDate: e.end,
        maxAttendees: e.max,
        ticketPrice: e.price,
        isFeatured: e.featured,
        status: e.past ? 'COMPLETED' : 'PUBLISHED',
        isPublished: true,
        currentAttendees: goingIds.length,
        registrations: goingIds.length,
        views: goingIds.length * 8,
        checkIns: e.past ? Math.round(goingIds.length * 0.8) : 0,
        createdAt: fromNow(-between(6, 20) * DAY),
      },
    })
    await prisma.eventAttendee.createMany({
      data: goingIds.map((userId, i) => ({
        eventId: ev.id,
        userId,
        status: e.past ? (i % 5 === 4 ? 'NO_SHOW' : 'ATTENDED') : 'REGISTERED',
        checkedIn: !!e.past && i % 5 !== 4,
        checkedInAt: e.past && i % 5 !== 4 ? new Date(e.start.getTime() + between(5, 40) * MIN) : null,
        totalPaid: e.price,
        registeredAt: fromNow(-between(1, 6) * DAY),
      })),
    })
  }

  // --- Live demand + offers -------------------------------------------------------------
  // Only the example venue can see these hands, and only it sends offers to them.
  const liveUntil = (extraMin: number) => fromNow(LIVE_HOURS * HOUR + extraMin * MIN)
  const mayaIntent = await prisma.goOutIntent.create({
    data: { userId: maya.id, vibes: ['LIVE_MUSIC', 'DRINKS'], partySize: 3,
      latitude: 40.6912, longitude: -73.9718, createdAt: fromNow(-20 * MIN), expiresAt: liveUntil(0) },
  })
  const hands: string[] = []
  for (const [i, u] of crowd.slice(20, 34).entries()) {
    const intent = await prisma.goOutIntent.create({
      data: {
        userId: u.id,
        vibes: [VIBES[i % VIBES.length], VIBES[(i + 3) % VIBES.length]],
        partySize: between(1, 5),
        latitude: (u.locationLat ?? VENUE_LAT) + (rand() - 0.5) * 0.002,
        longitude: (u.locationLng ?? VENUE_LNG) + (rand() - 0.5) * 0.002,
        status: i === 2 ? 'CLAIMED' : 'ACTIVE',
        createdAt: fromNow(-between(5, 45) * MIN),
        expiresAt: liveUntil(between(-30, 60)),
      },
    })
    hands.push(intent.id)
  }
  await prisma.businessOffer.createMany({
    data: [
      { businessId: venueId, intentId: mayaIntent.id, message: 'Example offer: live set starts at 9 and we saved a table for 3.',
        perkDescription: 'First round at happy-hour price (example)', doorCode: 'EXAMPLE-27', status: 'PENDING',
        createdAt: fromNow(-6 * MIN), expiresAt: liveUntil(0) },
      ...hands.slice(0, 5).map((intentId, i) => ({
        businessId: venueId, intentId,
        message: 'Example offer: room for your group tonight.',
        perkDescription: i % 2 ? 'Free first drink (example)' : 'Half-price drinks (example)',
        doorCode: i === 2 ? 'EXAMPLE-OK' : null,
        status: (i === 2 ? 'ACCEPTED' : i === 4 ? 'DECLINED' : 'PENDING') as 'ACCEPTED' | 'DECLINED' | 'PENDING',
        createdAt: fromNow(-between(10, 30) * MIN),
        respondedAt: i === 2 || i === 4 ? fromNow(-5 * MIN) : null,
        expiresAt: liveUntil(30),
      })),
    ],
  })

  await prisma.notification.createMany({
    data: [
      { userId: maya.id, type: 'go_out_offer', title: 'WaveFinder Example Venue answered your hand',
        message: 'Example offer: live set at 9, table for 3.', createdAt: fromNow(-6 * MIN) },
      { userId: maya.id, type: 'reward', title: 'Level 2 unlocked',
        message: 'Example notification: keep checking in to earn perks.', isRead: true, createdAt: fromNow(-6 * DAY) },
      { userId: maya.id, type: 'event_reminder', title: 'Wine Tasting Night is in 2 days',
        message: 'Example event at the WaveFinder Example Venue.', createdAt: fromNow(-1 * HOUR) },
    ],
  })

  console.log(`   example venue + ${crowd.length + 2} example people`)
  console.log(`   ${checkIns.length} check-ins over 60 days (${mayaCount} by Maya), all at the example venue`)
  console.log(`   ${EVENTS.length} example events, 4 promotions, 2 ads, ${hands.length + 1} live hands`)

  // --- Summary ----------------------------------------------------------------
  const logins = [
    [`newuser${DOMAIN}`, 'Onboarding from step 1 (re-run the seed to reset)'],
    [`maya${DOMAIN}`, 'User dashboard with sample history'],
    [`owner${DOMAIN}`, 'Business dashboard for WaveFinder Example Venue'],
  ]
  console.log('\n✨ Example data ready\n')
  console.log('┌─ Logins ' + '─'.repeat(78))
  for (const [email, note] of logins) console.log(`│ ${email.padEnd(34)} ${note}`)
  console.log('└' + '─'.repeat(87))
  if (explicit) console.log('\nPassword: $DEMO_PASSWORD (same for all three)')
  else console.log(`\nPassword for all three: ${loginPassword}\n⚠️  Shown once - it is only stored hashed.`)
  console.log(`Hands and offers stay live for ~${LIVE_HOURS}h. Re-run any time to refresh.`)
  console.log('Remove everything:  npm run db:seed:showcase -- --undo\n')
}

main()
  .catch((e) => {
    console.error('❌ Example seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
