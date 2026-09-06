/**
 * Additive demo data for onboarding + the go-out queue.
 *
 * Unlike seed-demo.ts, this is safe to run against a database that holds real
 * data. The differences that matter:
 *
 *   seed-demo.ts                          this script
 *   ------------------------------------  ------------------------------------
 *   businessOffer.deleteMany()  (ALL)     deletes only rows it owns
 *   goOutIntent.deleteMany()    (ALL)     deletes only rows it owns
 *   overwrites user@wavefinder.com        never touches a non-demo account
 *   offers sent from REAL venues          offers sent from its own demo venue
 *   password hardcoded 'Demo123!'         random per run, or $DEMO_PASSWORD
 *
 * Everything it creates hangs off accounts under @demo.wavefinder.com, so
 * `npm run db:seed:demo:undo -- --yes` removes all of it by deleting those
 * users and letting the cascades do the rest.
 *
 *   npm run db:seed:demo:safe                        # local
 *   ALLOW_DEMO_SEED=yes npm run db:seed:demo:safe    # anywhere else
 *
 * Optional env:
 *   DEMO_PASSWORD      use this instead of generating one
 *   DEMO_CENTER_LAT    where to place the demo venue and the crowd
 *   DEMO_CENTER_LNG    (defaults to Montauk, far from the real venues)
 */
import { PrismaClient } from '@prisma/client'
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
      '\n   This script only adds rows under @demo.wavefinder.com and deletes' +
        '\n   nothing else, but confirm the target anyway:' +
        '\n   re-run with ALLOW_DEMO_SEED=yes\n'
    )
    process.exit(1)
  }
  if (reasons.length && optedIn) {
    console.warn('⚠️  Non-local database, continuing because ALLOW_DEMO_SEED=yes\n')
  }
}

assertNotProduction()

const prisma = new PrismaClient()

const DEMO_DOMAIN = '@demo.wavefinder.com'
const MINUTE = 60 * 1000
const minutesFromNow = (m: number) => new Date(Date.now() + m * MINUTE)

/**
 * Montauk, at the far end of Long Island - deliberately NOT Midtown.
 *
 * The demo crowd spreads up to 2.1 miles from this point, and a real venue can
 * set its demand radius as high as 50 (activeDemandQuerySchema). Seeding near
 * the real venues would therefore put fake hands in every real operator's
 * demand panel, and invite real offers aimed at accounts nobody reads. Montauk
 * sits ~108 miles from the Midtown cluster, which no radius setting can bridge.
 */
const CENTER_LAT = Number(process.env.DEMO_CENTER_LAT ?? 41.0359)
const CENTER_LNG = Number(process.env.DEMO_CENTER_LNG ?? -71.9545)

const MILES_PER_DEG_LAT = 69
function offset(lat: number, lng: number, miles: number, bearingDeg: number) {
  const rad = (bearingDeg * Math.PI) / 180
  const dLat = (miles * Math.cos(rad)) / MILES_PER_DEG_LAT
  const dLng =
    (miles * Math.sin(rad)) / (MILES_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180))
  return { latitude: lat + dLat, longitude: lng + dLng }
}

/**
 * Random, mixed-class, and printed once at the end. The old defaults
 * (Demo123! / User123!) are in internal docs, so they are not reused here.
 */
function generatePassword() {
  const raw = randomBytes(12).toString('base64url').replace(/[-_]/g, '')
  return `Wv${raw}7!`
}

interface DemoPerson {
  key: string
  email: string
  firstName: string
  lastName: string
  note: string
  onboarding: {
    completed: boolean
    step: number
    interests?: string[]
    experienceGoal?: string | null
    nightVibe?: number
    maxDistanceMiles?: number
  }
  intent?: {
    vibes: string[]
    partySize: number
    miles: number
    bearing: number
    expiresInMinutes: number
    claimed?: boolean
  }
}

const PEOPLE: DemoPerson[] = [
  {
    key: 'inbox',
    email: `inbox${DEMO_DOMAIN}`,
    firstName: 'Ivy',
    lastName: 'Nolan',
    note: 'Offers inbox - 2 live offers waiting',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['LIVE_MUSIC', 'FOOD'],
      experienceGoal: 'GO_OUT',
      nightVibe: 72,
      maxDistanceMiles: 8,
    },
    intent: { vibes: ['ROOFTOP', 'DRINKS'], partySize: 3, miles: 0.35, bearing: 20, expiresInMinutes: 90 },
  },
  {
    key: 'accepted',
    email: `accepted${DEMO_DOMAIN}`,
    firstName: 'Cleo',
    lastName: 'Barrett',
    note: 'Accepted offer + door code revealed',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['DANCING'],
      experienceGoal: 'GO_OUT',
      nightVibe: 88,
      maxDistanceMiles: 5,
    },
    intent: { vibes: ['DANCING'], partySize: 2, miles: 0.5, bearing: 210, expiresInMinutes: 70, claimed: true },
  },
  {
    key: 'resume',
    email: `resume${DEMO_DOMAIN}`,
    firstName: 'Sam',
    lastName: 'Ortega',
    note: 'Onboarding wizard resumes at step 3',
    onboarding: { completed: false, step: 3, interests: ['FOOD'], experienceGoal: 'GO_OUT' },
  },
  {
    key: 'fresh',
    email: `fresh${DEMO_DOMAIN}`,
    firstName: 'Riley',
    lastName: 'Chan',
    note: 'Onboarding wizard from step 1',
    onboarding: { completed: false, step: 1 },
  },
  // Background crowd, so the demand panel shows a real spread of vibes.
  { key: 'c1', email: `maya${DEMO_DOMAIN}`, firstName: 'Maya', lastName: 'Reed', note: 'crowd',
    onboarding: { completed: true, step: 6, interests: ['LIVE_MUSIC'], experienceGoal: 'GO_OUT' },
    intent: { vibes: ['LIVE_MUSIC'], partySize: 4, miles: 0.9, bearing: 75, expiresInMinutes: 60 } },
  { key: 'c2', email: `jordan${DEMO_DOMAIN}`, firstName: 'Jordan', lastName: 'Vega', note: 'crowd',
    onboarding: { completed: true, step: 6, interests: ['DRINKS'], experienceGoal: 'GO_OUT' },
    intent: { vibes: ['DRINKS', 'CHILL'], partySize: 2, miles: 1.4, bearing: 130, expiresInMinutes: 45 } },
  { key: 'c3', email: `priya${DEMO_DOMAIN}`, firstName: 'Priya', lastName: 'Shah', note: 'crowd',
    onboarding: { completed: true, step: 6, interests: ['ROOFTOP'], experienceGoal: 'GO_OUT' },
    intent: { vibes: ['ROOFTOP'], partySize: 5, miles: 0.6, bearing: 300, expiresInMinutes: 110 } },
  { key: 'c4', email: `andre${DEMO_DOMAIN}`, firstName: 'Andre', lastName: 'Diaz', note: 'crowd',
    onboarding: { completed: true, step: 6, interests: ['DANCING'], experienceGoal: 'GO_OUT' },
    intent: { vibes: ['DANCING', 'DRINKS'], partySize: 3, miles: 2.1, bearing: 15, expiresInMinutes: 80 } },
  { key: 'c5', email: `lena${DEMO_DOMAIN}`, firstName: 'Lena', lastName: 'Novak', note: 'crowd',
    onboarding: { completed: true, step: 6, interests: ['FOOD'], experienceGoal: 'GO_OUT' },
    intent: { vibes: ['FOOD'], partySize: 2, miles: 1.1, bearing: 240, expiresInMinutes: 55 } },
  { key: 'c6', email: `tomas${DEMO_DOMAIN}`, firstName: 'Tomas', lastName: 'Lund', note: 'crowd',
    onboarding: { completed: true, step: 6, interests: ['ROOFTOP'], experienceGoal: 'GO_OUT' },
    intent: { vibes: ['ROOFTOP', 'LIVE_MUSIC'], partySize: 4, miles: 1.8, bearing: 190, expiresInMinutes: 95 } },
  { key: 'c7', email: `devon${DEMO_DOMAIN}`, firstName: 'Devon', lastName: 'Price', note: 'crowd',
    onboarding: { completed: true, step: 6, interests: ['COMEDY'], experienceGoal: 'GO_OUT' },
    intent: { vibes: ['COMEDY'], partySize: 1, miles: 0.75, bearing: 340, expiresInMinutes: 40 } },
]

async function main() {
  console.log('🌊 Additive demo seed (onboarding + go-out)\n')
  console.log(`   centre: ${CENTER_LAT}, ${CENTER_LNG}`)

  const explicit = process.env.DEMO_PASSWORD
  const credentials: { email: string; password: string; note: string }[] = []

  // --- Remove any previous run of THIS script (demo domain only) ------------
  const priorUsers = await prisma.user.findMany({
    where: { email: { endsWith: DEMO_DOMAIN } },
    select: { id: true },
  })
  if (priorUsers.length) {
    const removed = await prisma.user.deleteMany({
      where: { email: { endsWith: DEMO_DOMAIN } },
    })
    console.log(`   removed ${removed.count} demo account(s) from a previous run`)
  }

  // --- Demo venue: offers come from here, never from a real business --------
  const venuePassword = explicit ?? generatePassword()
  const venueEmail = `venue${DEMO_DOMAIN}`
  const venueUser = await prisma.user.create({
    data: {
      email: venueEmail,
      password: await bcrypt.hash(venuePassword, 10),
      firstName: 'Wave',
      lastName: 'Demo Venue',
      role: 'BUSINESS',
      isVerified: true,
      isActive: true,
      onboardingCompleted: true,
      onboardingStep: 6,
    },
  })

  const venue = await prisma.business.create({
    data: {
      userId: venueUser.id,
      name: 'Wave Demo Rooftop',
      description:
        'Demo venue used for product walkthroughs. Not a real bar - safe to ignore.',
      type: 'BAR',
      address: '1 Demo Plaza',
      city: 'New York',
      state: 'NY',
      zipCode: '10018',
      latitude: CENTER_LAT,
      longitude: CENTER_LNG,
      isVerified: true,
      isActive: true,
      approvalStatus: 'APPROVED',
    },
  })
  credentials.push({
    email: venueEmail,
    password: venuePassword,
    note: 'Business demand panel (owns "Wave Demo Rooftop")',
  })
  console.log(`   venue: ${venue.name}`)

  // --- People + their raised hands -----------------------------------------
  const intentByKey = new Map<string, string>()

  for (const person of PEOPLE) {
    const password = explicit ?? generatePassword()
    const home = person.intent
      ? offset(CENTER_LAT, CENTER_LNG, person.intent.miles, person.intent.bearing)
      : offset(CENTER_LAT, CENTER_LNG, 0.8, 60)

    const user = await prisma.user.create({
      data: {
        email: person.email,
        password: await bcrypt.hash(password, 10),
        firstName: person.firstName,
        lastName: person.lastName,
        role: 'USER',
        isVerified: true,
        isActive: true,
        onboardingCompleted: person.onboarding.completed,
        onboardingCompletedAt: person.onboarding.completed ? minutesFromNow(-60 * 24 * 3) : null,
        onboardingStep: person.onboarding.step,
        interests: person.onboarding.interests ?? [],
        experienceGoal: person.onboarding.experienceGoal ?? null,
        nightVibe: person.onboarding.nightVibe ?? 50,
        maxDistanceMiles: person.onboarding.maxDistanceMiles ?? 5,
        locationLat: person.onboarding.completed ? home.latitude : null,
        locationLng: person.onboarding.completed ? home.longitude : null,
        locationLabel: person.onboarding.completed ? 'Midtown, New York' : null,
      },
    })

    if (person.intent) {
      const intent = await prisma.goOutIntent.create({
        data: {
          userId: user.id,
          status: person.intent.claimed ? 'CLAIMED' : 'ACTIVE',
          vibes: person.intent.vibes,
          partySize: person.intent.partySize,
          latitude: home.latitude,
          longitude: home.longitude,
          createdAt: minutesFromNow(-25),
          expiresAt: minutesFromNow(person.intent.expiresInMinutes),
        },
      })
      intentByKey.set(person.key, intent.id)
    }

    if (person.note !== 'crowd') {
      credentials.push({ email: person.email, password, note: person.note })
    }
  }
  console.log(`   ${PEOPLE.length} people, ${intentByKey.size} raised hands`)

  // --- Offers, all sent by the demo venue ----------------------------------
  const offers: {
    intentId: string | null
    message: string
    perkDescription: string
    doorCode?: string | null
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
    createdAtMinutes: number
    expiresAtMinutes: number
    respondedAtMinutes?: number
  }[] = []

  const inboxIntent = intentByKey.get('inbox')
  if (inboxIntent) {
    offers.push(
      {
        intentId: inboxIntent,
        message: 'The rooftop is warming up and we saved you a spot. Come through.',
        perkDescription: '2-for-1 craft drafts until midnight',
        doorCode: 'WAVE-42',
        status: 'PENDING',
        createdAtMinutes: -12,
        expiresAtMinutes: 75,
      },
      {
        intentId: inboxIntent,
        message: 'Table by the window just opened up if you want it.',
        perkDescription: 'Free starter for the table',
        doorCode: 'WAVE-88',
        status: 'PENDING',
        createdAtMinutes: -6,
        expiresAtMinutes: 60,
      }
    )
  }

  const acceptedIntent = intentByKey.get('accepted')
  if (acceptedIntent) {
    offers.push({
      intentId: acceptedIntent,
      message: 'Floor is packed and the DJ just started. Skip the line.',
      perkDescription: 'Skip the line + first round on us',
      doorCode: 'WAVE-DANCE',
      status: 'ACCEPTED',
      createdAtMinutes: -40,
      expiresAtMinutes: 50,
      respondedAtMinutes: -32,
    })
  }

  for (const key of ['c1', 'c3', 'c5']) {
    const id = intentByKey.get(key)
    if (!id) continue
    offers.push({
      intentId: id,
      message: 'Good crowd in tonight - come say hello.',
      perkDescription: '20% off the whole tab',
      status: 'PENDING',
      createdAtMinutes: -18,
      expiresAtMinutes: 65,
    })
  }

  for (const offer of offers) {
    await prisma.businessOffer.create({
      data: {
        businessId: venue.id,
        intentId: offer.intentId,
        message: offer.message,
        perkDescription: offer.perkDescription,
        doorCode: offer.doorCode ?? null,
        status: offer.status,
        createdAt: minutesFromNow(offer.createdAtMinutes),
        expiresAt: minutesFromNow(offer.expiresAtMinutes),
        respondedAt:
          offer.respondedAtMinutes != null ? minutesFromNow(offer.respondedAtMinutes) : null,
      },
    })
  }
  console.log(`   ${offers.length} offers, all from "${venue.name}"`)

  // --- Summary --------------------------------------------------------------
  console.log('\n✨ Demo data ready\n')
  console.log('┌─ Accounts ' + '─'.repeat(76))
  for (const c of credentials) {
    console.log(`│ ${c.email.padEnd(32)} ${c.password.padEnd(24)} ${c.note}`)
  }
  console.log(
    `│ ${`<name>${DEMO_DOMAIN}`.padEnd(32)} ${'(see above)'.padEnd(24)} background crowd, 7 more`
  )
  console.log('└' + '─'.repeat(87))
  if (explicit) {
    console.log('\n(using $DEMO_PASSWORD for every account)')
  } else {
    console.log('\n⚠️  These passwords are shown ONCE. Save them now - they are hashed in the DB.')
  }
  console.log('\nTo remove all of it:  npm run db:seed:demo:undo -- --yes\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
