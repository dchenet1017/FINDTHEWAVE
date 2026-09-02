import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

/**
 * Demo data for the onboarding wizard and the "I want to go out" demand queue.
 *
 * Additive on purpose: it leaves the businesses, events and communities from
 * seed.ts alone and only rebuilds what the new features need. Run seed.ts first
 * for the venues, then this as often as you like - it is idempotent.
 *
 *   npm run db:seed        # base data (destructive, wipes everything)
 *   npm run db:seed:demo   # this file
 */

const prisma = new PrismaClient()

const DEMO_DOMAIN = '@demo.wavefinder.com'
const DEMO_PASSWORD = 'Demo123!'

const MINUTE = 60 * 1000
const minutesFromNow = (m: number) => new Date(Date.now() + m * MINUTE)

/** Rough planar offset - fine at city scale and keeps the fixtures readable. */
const MILES_PER_DEG_LAT = 69
function offset(lat: number, lng: number, miles: number, bearingDeg: number) {
  const rad = (bearingDeg * Math.PI) / 180
  const dLat = (miles * Math.cos(rad)) / MILES_PER_DEG_LAT
  const dLng =
    (miles * Math.sin(rad)) / (MILES_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180))
  return {
    latitude: Number((lat + dLat).toFixed(6)),
    longitude: Number((lng + dLng).toFixed(6)),
  }
}

type DemoUser = {
  key: string
  email: string
  firstName: string
  lastName: string
  onboarding: {
    completed: boolean
    step: number
    interests?: string[]
    experienceGoal?: 'GO_OUT' | 'EXPLORE_PLACES' | 'PLAN_AHEAD'
    nightVibe?: number
    maxDistanceMiles?: number
    notificationsEnabled?: boolean
    locationSharingEnabled?: boolean
  }
  /** Omit to leave this account without a raised hand */
  intent?: {
    vibes: string[]
    partySize: number
    /** Distance and bearing from the anchor venue */
    miles: number
    bearing: number
    expiresInMinutes: number
    claimed?: boolean
  }
}

/**
 * Distances are spread across the four buckets the business demand panel
 * renders (under 1 / 1-3 / 3-5 / 5+ mi) so none of them come back empty.
 */
const DEMO_USERS: DemoUser[] = [
  {
    key: 'maya',
    email: `maya${DEMO_DOMAIN}`,
    firstName: 'Maya',
    lastName: 'Rivera',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['DANCING', 'LIVE_MUSIC'],
      experienceGoal: 'GO_OUT',
      nightVibe: 82,
      maxDistanceMiles: 5,
      notificationsEnabled: true,
      locationSharingEnabled: true,
    },
    intent: {
      vibes: ['DANCING', 'LIVE_MUSIC'],
      partySize: 3,
      miles: 0.4,
      bearing: 20,
      expiresInMinutes: 95,
    },
  },
  {
    key: 'jordan',
    email: `jordan${DEMO_DOMAIN}`,
    firstName: 'Jordan',
    lastName: 'Blake',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['FOOD', 'CHILL'],
      experienceGoal: 'GO_OUT',
      nightVibe: 35,
      maxDistanceMiles: 3,
      notificationsEnabled: true,
      locationSharingEnabled: true,
    },
    intent: {
      vibes: ['FOOD', 'DRINKS'],
      partySize: 2,
      miles: 0.7,
      bearing: 140,
      expiresInMinutes: 60,
    },
  },
  {
    key: 'priya',
    email: `priya${DEMO_DOMAIN}`,
    firstName: 'Priya',
    lastName: 'Nair',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['LIVE_MUSIC', 'COMEDY'],
      experienceGoal: 'EXPLORE_PLACES',
      nightVibe: 60,
      maxDistanceMiles: 10,
      notificationsEnabled: true,
      locationSharingEnabled: false,
    },
    intent: {
      vibes: ['COMEDY'],
      partySize: 4,
      miles: 0.9,
      bearing: 250,
      expiresInMinutes: 140,
    },
  },
  {
    key: 'andre',
    email: `andre${DEMO_DOMAIN}`,
    firstName: 'Andre',
    lastName: 'Okafor',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['DANCING', 'MORE'],
      experienceGoal: 'GO_OUT',
      nightVibe: 95,
      maxDistanceMiles: 15,
      notificationsEnabled: true,
      locationSharingEnabled: true,
    },
    intent: {
      vibes: ['ROOFTOP', 'DANCING'],
      partySize: 5,
      miles: 0.6,
      bearing: 310,
      expiresInMinutes: 110,
    },
  },
  {
    key: 'lena',
    email: `lena${DEMO_DOMAIN}`,
    firstName: 'Lena',
    lastName: 'Costa',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['CHILL', 'FOOD'],
      experienceGoal: 'PLAN_AHEAD',
      nightVibe: 25,
      maxDistanceMiles: 2,
      notificationsEnabled: false,
      locationSharingEnabled: false,
    },
    intent: {
      vibes: ['CHILL'],
      partySize: 1,
      miles: 1.6,
      bearing: 45,
      expiresInMinutes: 80,
    },
  },
  {
    key: 'tomas',
    email: `tomas${DEMO_DOMAIN}`,
    firstName: 'Tomas',
    lastName: 'Ruiz',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['LIVE_MUSIC'],
      experienceGoal: 'GO_OUT',
      nightVibe: 70,
      maxDistanceMiles: 5,
      notificationsEnabled: true,
      locationSharingEnabled: true,
    },
    intent: {
      vibes: ['LIVE_MUSIC', 'DRINKS'],
      partySize: 2,
      miles: 2.4,
      bearing: 200,
      expiresInMinutes: 55,
    },
  },
  {
    key: 'sasha',
    email: `sasha${DEMO_DOMAIN}`,
    firstName: 'Sasha',
    lastName: 'Kim',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['DANCING', 'COMEDY'],
      experienceGoal: 'GO_OUT',
      nightVibe: 88,
      maxDistanceMiles: 8,
      notificationsEnabled: true,
      locationSharingEnabled: true,
    },
    intent: {
      vibes: ['DANCING', 'WHATEVER'],
      partySize: 5,
      miles: 2.9,
      bearing: 100,
      expiresInMinutes: 100,
    },
  },
  {
    key: 'devon',
    email: `devon${DEMO_DOMAIN}`,
    firstName: 'Devon',
    lastName: 'Carter',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['FOOD', 'MORE'],
      experienceGoal: 'EXPLORE_PLACES',
      nightVibe: 50,
      maxDistanceMiles: 5,
      notificationsEnabled: true,
      locationSharingEnabled: false,
    },
    intent: {
      vibes: ['FOOD', 'ROOFTOP'],
      partySize: 2,
      miles: 4.2,
      bearing: 15,
      expiresInMinutes: 130,
    },
  },
  {
    key: 'nina',
    email: `nina${DEMO_DOMAIN}`,
    firstName: 'Nina',
    lastName: 'Patel',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['CHILL'],
      experienceGoal: 'GO_OUT',
      nightVibe: 45,
      maxDistanceMiles: 5,
      notificationsEnabled: true,
      locationSharingEnabled: true,
    },
    intent: {
      vibes: ['CHILL', 'DRINKS'],
      partySize: 1,
      miles: 4.8,
      bearing: 330,
      expiresInMinutes: 70,
    },
  },
  {
    key: 'omar',
    email: `omar${DEMO_DOMAIN}`,
    firstName: 'Omar',
    lastName: 'Haddad',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['DANCING'],
      experienceGoal: 'GO_OUT',
      nightVibe: 75,
      maxDistanceMiles: 15,
      notificationsEnabled: true,
      locationSharingEnabled: true,
    },
    // Outside a 5 mi radius: proves the radius filter actually excludes people.
    intent: {
      vibes: ['DANCING'],
      partySize: 3,
      miles: 6.5,
      bearing: 180,
      expiresInMinutes: 120,
    },
  },
  {
    key: 'chloe',
    email: `chloe${DEMO_DOMAIN}`,
    firstName: 'Chloe',
    lastName: 'Wren',
    onboarding: {
      completed: true,
      step: 6,
      interests: ['LIVE_MUSIC', 'FOOD'],
      experienceGoal: 'GO_OUT',
      nightVibe: 65,
      maxDistanceMiles: 5,
      notificationsEnabled: true,
      locationSharingEnabled: true,
    },
    // Already accepted an offer - the claimed / door-code-revealed state.
    intent: {
      vibes: ['ROOFTOP', 'DRINKS'],
      partySize: 2,
      miles: 0.5,
      bearing: 80,
      expiresInMinutes: 85,
      claimed: true,
    },
  },
  {
    key: 'sam',
    email: `sam${DEMO_DOMAIN}`,
    firstName: 'Sam',
    lastName: 'Ellis',
    // Dropped out mid-wizard: logging in should resume at step 3.
    onboarding: {
      completed: false,
      step: 3,
      interests: ['LIVE_MUSIC'],
      nightVibe: 50,
      maxDistanceMiles: 5,
      notificationsEnabled: true,
      locationSharingEnabled: false,
    },
  },
  {
    key: 'riley',
    email: `riley${DEMO_DOMAIN}`,
    firstName: 'Riley',
    lastName: 'Fox',
    // Untouched account for walking the wizard from step 1.
    onboarding: { completed: false, step: 1 },
  },
]

async function main() {
  console.log('🌊 Seeding onboarding + go-out demo data...')

  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  if (businesses.length < 3) {
    throw new Error(
      'Fewer than 3 active businesses found. Run `npm run db:seed` first - this script builds on those venues.'
    )
  }

  // Anchor everything on the first venue so the business login sees the crowd.
  const anchor = businesses[0]
  const anchorLat = Number(anchor.latitude)
  const anchorLng = Number(anchor.longitude)
  const venue = (i: number) => businesses[i % businesses.length]

  console.log(`📍 Anchor venue: ${anchor.name} (${anchorLat}, ${anchorLng})`)

  // --- Reset only what this script owns -------------------------------------
  console.log('🧹 Clearing previous go-out demo data...')
  const clearedOffers = await prisma.businessOffer.deleteMany()
  const clearedIntents = await prisma.goOutIntent.deleteMany()
  const clearedUsers = await prisma.user.deleteMany({
    where: { email: { endsWith: DEMO_DOMAIN } },
  })
  console.log(
    `   removed ${clearedOffers.count} offers, ${clearedIntents.count} intents, ${clearedUsers.count} demo users`
  )

  // --- Demo users -----------------------------------------------------------
  console.log('👥 Creating demo users...')
  const password = await bcrypt.hash(DEMO_PASSWORD, 10)
  const intentByKey = new Map<string, { id: string; latitude: number; longitude: number }>()

  for (const demo of DEMO_USERS) {
    const home = demo.intent
      ? offset(anchorLat, anchorLng, demo.intent.miles, demo.intent.bearing)
      : offset(anchorLat, anchorLng, 0.8, 60)

    const user = await prisma.user.create({
      data: {
        email: demo.email,
        password,
        firstName: demo.firstName,
        lastName: demo.lastName,
        role: 'USER',
        isVerified: true,
        isActive: true,
        onboardingCompleted: demo.onboarding.completed,
        onboardingCompletedAt: demo.onboarding.completed
          ? minutesFromNow(-60 * 24 * 3)
          : null,
        onboardingStep: demo.onboarding.step,
        interests: demo.onboarding.interests ?? [],
        experienceGoal: demo.onboarding.experienceGoal ?? null,
        nightVibe: demo.onboarding.nightVibe ?? 50,
        maxDistanceMiles: demo.onboarding.maxDistanceMiles ?? 5,
        notificationsEnabled: demo.onboarding.notificationsEnabled ?? true,
        locationSharingEnabled: demo.onboarding.locationSharingEnabled ?? false,
        // Only users who finished the wizard have a location on file.
        locationLat: demo.onboarding.completed ? home.latitude : null,
        locationLng: demo.onboarding.completed ? home.longitude : null,
        locationLabel: demo.onboarding.completed ? 'Midtown, New York' : null,
      },
    })

    if (demo.intent) {
      const intent = await prisma.goOutIntent.create({
        data: {
          userId: user.id,
          status: demo.intent.claimed ? 'CLAIMED' : 'ACTIVE',
          vibes: demo.intent.vibes,
          partySize: demo.intent.partySize,
          latitude: home.latitude,
          longitude: home.longitude,
          createdAt: minutesFromNow(-25),
          expiresAt: minutesFromNow(demo.intent.expiresInMinutes),
        },
      })
      intentByKey.set(demo.key, {
        id: intent.id,
        latitude: home.latitude,
        longitude: home.longitude,
      })
    }
  }
  console.log(`✅ ${DEMO_USERS.length} demo users, ${intentByKey.size} raised hands`)

  // --- The standard test account gets the fullest inbox ---------------------
  const testUser = await prisma.user.findUnique({
    where: { email: 'user@wavefinder.com' },
  })

  let testIntentId: string | null = null

  if (testUser) {
    const home = offset(anchorLat, anchorLng, 0.35, 0)

    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: minutesFromNow(-60 * 24 * 7),
        onboardingStep: 6,
        interests: ['LIVE_MUSIC', 'FOOD'],
        experienceGoal: 'GO_OUT',
        nightVibe: 68,
        maxDistanceMiles: 5,
        notificationsEnabled: true,
        locationSharingEnabled: true,
        locationLat: home.latitude,
        locationLng: home.longitude,
        locationLabel: 'Midtown, New York',
      },
    })

    const intent = await prisma.goOutIntent.create({
      data: {
        userId: testUser.id,
        status: 'ACTIVE',
        vibes: ['DRINKS', 'LIVE_MUSIC'],
        partySize: 2,
        latitude: home.latitude,
        longitude: home.longitude,
        createdAt: minutesFromNow(-15),
        expiresAt: minutesFromNow(105),
      },
    })
    testIntentId = intent.id
    console.log('✅ user@wavefinder.com onboarded with a live raised hand')
  } else {
    console.log('⚠️  user@wavefinder.com not found - skipping its inbox fixtures')
  }

  // --- Offers ---------------------------------------------------------------
  console.log('🎁 Creating business offers...')

  type OfferSeed = {
    businessId: string
    intentId: string | null
    message: string
    perkDescription: string
    doorCode?: string | null
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
    createdAtMinutes: number
    expiresAtMinutes: number
    respondedAtMinutes?: number
  }

  const offers: OfferSeed[] = []

  if (testIntentId) {
    // Two live offers to choose between, plus one of each resolved state.
    offers.push(
      {
        businessId: venue(0).id,
        intentId: testIntentId,
        message: 'The bar is warming up and we saved you a spot. Come through.',
        perkDescription: '2-for-1 craft drafts until midnight',
        doorCode: 'WAVE-42',
        status: 'PENDING',
        createdAtMinutes: -12,
        expiresAtMinutes: 75,
      },
      {
        businessId: venue(1).id,
        intentId: testIntentId,
        message: 'Rooftop just opened up. Skip the line, we will take care of you.',
        perkDescription: 'Line skip + welcome shot for the table',
        doorCode: 'SKY-09',
        status: 'PENDING',
        createdAtMinutes: -6,
        expiresAtMinutes: 50,
      },
      {
        businessId: venue(3).id,
        intentId: testIntentId,
        message: 'Late night menu is on until 2am if you are still deciding.',
        perkDescription: 'Free appetizer with any entree',
        doorCode: null,
        status: 'DECLINED',
        createdAtMinutes: -40,
        expiresAtMinutes: 30,
        respondedAtMinutes: -20,
      },
      {
        businessId: venue(4).id,
        intentId: testIntentId,
        message: 'Happy hour ends soon, wanted to give you first shot at it.',
        perkDescription: 'Half price cocktails',
        doorCode: null,
        status: 'EXPIRED',
        createdAtMinutes: -120,
        expiresAtMinutes: -30,
      }
    )
  }

  // A claimed offer: Chloe accepted, so her door code is unlocked.
  const chloeIntent = intentByKey.get('chloe')
  if (chloeIntent) {
    offers.push({
      businessId: venue(1).id,
      intentId: chloeIntent.id,
      message: 'Table by the window is yours. Give the host this code.',
      perkDescription: 'Reserved rooftop table for 2',
      doorCode: 'CHLOE-77',
      status: 'ACCEPTED',
      createdAtMinutes: -35,
      expiresAtMinutes: 60,
      respondedAtMinutes: -10,
    })
  }

  // Targeted offers to other raised hands, so the venue's sent-offer history
  // and the map's "actively competing" badges have something to show.
  const targeted: Array<[string, number, string, string]> = [
    ['maya', 0, 'DJ starts at 11. Room is filling up fast.', 'No cover before midnight'],
    ['andre', 1, 'Rooftop has space for five right now.', 'Priority entry for your group'],
    ['priya', 2, 'Comedy set at 9:30, front row is open.', 'Two free tickets'],
    ['tomas', 5, 'Live band on in 30 minutes.', 'First round on the house'],
    ['sasha', 6, 'Dance floor just opened downstairs.', 'Free coat check + line skip'],
  ]

  for (const [key, venueIndex, message, perk] of targeted) {
    const intent = intentByKey.get(key)
    if (!intent) continue
    offers.push({
      businessId: venue(venueIndex).id,
      intentId: intent.id,
      message,
      perkDescription: perk,
      doorCode: null,
      status: 'PENDING',
      createdAtMinutes: -8,
      expiresAtMinutes: 65,
    })
  }

  // Open broadcasts - no intentId, claimable by the first nearby user.
  offers.push(
    {
      businessId: venue(2).id,
      intentId: null,
      message: 'Open table for the next group that walks in. First come, first served.',
      perkDescription: 'Free round for the first table of 4',
      doorCode: 'OPEN-15',
      status: 'PENDING',
      createdAtMinutes: -10,
      expiresAtMinutes: 60,
    },
    {
      businessId: venue(5).id,
      intentId: null,
      message: 'Quiet early crowd tonight - come claim the good seats.',
      perkDescription: '20% off the whole tab',
      doorCode: null,
      status: 'PENDING',
      createdAtMinutes: -4,
      expiresAtMinutes: 40,
    }
  )

  for (const offer of offers) {
    await prisma.businessOffer.create({
      data: {
        businessId: offer.businessId,
        intentId: offer.intentId,
        message: offer.message,
        perkDescription: offer.perkDescription,
        doorCode: offer.doorCode ?? null,
        status: offer.status,
        createdAt: minutesFromNow(offer.createdAtMinutes),
        expiresAt: minutesFromNow(offer.expiresAtMinutes),
        respondedAt:
          offer.respondedAtMinutes != null
            ? minutesFromNow(offer.respondedAtMinutes)
            : null,
      },
    })
  }
  console.log(`✅ ${offers.length} offers created`)

  // --- Summary --------------------------------------------------------------
  const activeIntents = await prisma.goOutIntent.count({ where: { status: 'ACTIVE' } })
  const pendingOffers = await prisma.businessOffer.count({ where: { status: 'PENDING' } })

  console.log('\n✨ Demo data ready')
  console.log(`   Active intents: ${activeIntents}`)
  console.log(`   Pending offers: ${pendingOffers}`)
  console.log('\n📝 Try these logins:')
  console.log('   Offers inbox (2 live offers):  user@wavefinder.com / User123!')
  console.log('   Business demand panel:         business@wavefinder.com / Business123!')
  console.log(`   Accepted offer + door code:    chloe${DEMO_DOMAIN} / ${DEMO_PASSWORD}`)
  console.log(`   Resume wizard at step 3:       sam${DEMO_DOMAIN} / ${DEMO_PASSWORD}`)
  console.log(`   Fresh wizard from step 1:      riley${DEMO_DOMAIN} / ${DEMO_PASSWORD}`)
  console.log(`   Other demo users:              <name>${DEMO_DOMAIN} / ${DEMO_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error('❌ Demo seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
