/**
 * Step 2 of the Brooklyn pilot import: load prisma/data/brooklyn-snapshot.json
 * (made by fetch-brooklyn.ts) as UNCLAIMED listings and public events.
 *
 *   npm run import:brooklyn                    # load / refresh (local DB)
 *   npm run import:brooklyn -- --undo          # report what --undo --yes would remove
 *   npm run import:brooklyn -- --undo --yes    # remove imported listings + events
 *
 * Refuses any database that isn't local unless ALLOW_IMPORT=yes is set, so it
 * cannot reach the Render database by accident.
 *
 * Rules:
 *   - Listings have no owner (userId null, isClaimed false), no rating, no
 *     reviews, no photos. Description is a plain factual line, not copied text.
 *   - Re-running updates the factual fields of listings still unclaimed and
 *     never touches one that an owner has claimed.
 *   - A business that already signed up itself (same name within ~120 m) is
 *     skipped, so the import never creates a duplicate of a real account.
 *   - Imported events that dropped off the calendar are removed, unless
 *     someone has registered for them.
 */
import { PrismaClient, Prisma } from '@prisma/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Snapshot, SnapshotListing } from './fetch-brooklyn'

function assertTarget() {
  const url = process.env.DATABASE_URL ?? ''
  const isLocal = /@(localhost|127\.0\.0\.1|host\.docker\.internal|postgres)[:/]/.test(url)
  const reasons: string[] = []
  if (process.env.NODE_ENV === 'production') reasons.push('NODE_ENV=production')
  if (url && !isLocal) reasons.push('DATABASE_URL does not point at localhost')
  if (reasons.length && process.env.ALLOW_IMPORT !== 'yes') {
    console.error('\n⛔ Refusing to import into this database.')
    for (const r of reasons) console.error(`   - ${r}`)
    console.error('\n   Re-run with ALLOW_IMPORT=yes once you mean to load this target.\n')
    process.exit(1)
  }
  if (reasons.length) console.warn('⚠️  Non-local database, continuing because ALLOW_IMPORT=yes\n')
}

assertTarget()

const prisma = new PrismaClient()
const SNAPSHOT = resolve(process.cwd(), 'prisma/data/brooklyn-snapshot.json')
const SOURCES = ['DTBK_DIRECTORY', 'MYRTLE_DIRECTORY', 'DTBK_EVENTS']
const UNDO = process.argv.includes('--undo')
const YES = process.argv.includes('--yes')

const SOURCE_LABEL: Record<SnapshotListing['source'], string> = {
  DTBK_DIRECTORY: 'Downtown Brooklyn Partnership',
  MYRTLE_DIRECTORY: 'Myrtle Avenue Brooklyn Partnership',
  DTBK_EVENTS: 'Downtown Brooklyn Partnership events calendar',
}
const DISTRICT_ZIP: Record<SnapshotListing['district'], string> = {
  'Downtown Brooklyn': '11201',
  'Myrtle Avenue': '11205',
}

function describe(l: SnapshotListing) {
  const what = l.categories.filter((c) => c !== 'Event venue').slice(0, 2).join(', ') || l.type.toLowerCase()
  const where = l.district === 'Myrtle Avenue' ? 'on Myrtle Avenue' : 'in Downtown Brooklyn'
  return (
    `${what.charAt(0).toUpperCase()}${what.slice(1)} ${where}. ` +
    `Listed in the ${SOURCE_LABEL[l.source]} directory. ` +
    `This business hasn't claimed its WaveFinder listing yet.`
  )
}

const norm = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '')
const meters = (aLat: number, aLng: number, bLat: number, bLng: number) =>
  Math.hypot((bLat - aLat) * 111_320, (bLng - aLng) * 111_320 * Math.cos((aLat * Math.PI) / 180))

async function undo() {
  const listings = await prisma.business.findMany({
    where: { source: { in: SOURCES }, isClaimed: false, userId: null },
    select: { id: true },
  })
  const ids = listings.map((l) => l.id)
  const [events, checkIns, favorites] = await Promise.all([
    prisma.event.count({ where: { OR: [{ source: 'DTBK_EVENTS' }, { businessId: { in: ids } }] } }),
    prisma.checkIn.count({ where: { businessId: { in: ids } } }),
    prisma.favorite.count({ where: { businessId: { in: ids } } }),
  ])
  console.log(`Unclaimed imported listings: ${ids.length}`)
  console.log(`Events (imported or at those listings): ${events}`)
  console.log(`Check-ins / favourites people made at them: ${checkIns} / ${favorites}`)
  console.log('Claimed listings are kept regardless of source.')
  if (!YES) {
    console.log('\n(dry run - nothing removed; add --yes to apply)\n')
    return
  }
  await prisma.$transaction([
    prisma.event.deleteMany({ where: { OR: [{ source: 'DTBK_EVENTS' }, { businessId: { in: ids } }] } }),
    prisma.checkIn.deleteMany({ where: { businessId: { in: ids } } }),
    prisma.partnership.deleteMany({ where: { OR: [{ businessId: { in: ids } }, { partnerId: { in: ids } }] } }),
    prisma.crawlStop.deleteMany({ where: { businessId: { in: ids } } }),
    prisma.business.deleteMany({ where: { id: { in: ids } } }),
  ])
  console.log('\n🧹 Removed.\n')
}

async function load() {
  const snap: Snapshot = JSON.parse(readFileSync(SNAPSHOT, 'utf8'))
  console.log(`   snapshot fetched ${snap.fetchedAt}: ${snap.listings.length} listings, ${snap.events.length} events`)
  const now = new Date()

  // Businesses that signed up on their own - never duplicate one of these.
  const ownAccounts = await prisma.business.findMany({
    where: { source: null },
    select: { id: true, name: true, latitude: true, longitude: true },
  })

  const idByKey = new Map<string, string>()
  let created = 0
  let updated = 0
  let claimedKept = 0
  let alreadyOnWaveFinder = 0

  for (const l of snap.listings) {
    const key = `${l.source}|${l.sourceId}`
    const own = ownAccounts.find(
      (b) => norm(b.name) === norm(l.name) && meters(l.latitude, l.longitude, Number(b.latitude), Number(b.longitude)) < 120
    )
    if (own) {
      idByKey.set(key, own.id)
      alreadyOnWaveFinder++
      continue
    }

    const facts = {
      name: l.name,
      type: l.type,
      address: l.address,
      city: 'Brooklyn',
      state: 'NY',
      zipCode: l.zipCode || DISTRICT_ZIP[l.district],
      latitude: l.latitude,
      longitude: l.longitude,
      phone: l.phone,
      website: l.website,
      sourceUrl: l.sourceUrl,
      importedAt: now,
    }
    const existing = await prisma.business.findUnique({
      where: { source_sourceId: { source: l.source, sourceId: l.sourceId } },
      select: { id: true, isClaimed: true },
    })
    if (existing?.isClaimed) {
      idByKey.set(key, existing.id)
      claimedKept++
      continue
    }
    if (existing) {
      await prisma.business.update({ where: { id: existing.id }, data: { ...facts, description: describe(l) } })
      idByKey.set(key, existing.id)
      updated++
    } else {
      const b = await prisma.business.create({
        data: {
          ...facts,
          description: describe(l),
          source: l.source,
          sourceId: l.sourceId,
          images: [],
          isClaimed: false,
          isVerified: false,
          isActive: true,
          // Visible on the map like any listing; there is no owner to review.
          approvalStatus: 'APPROVED',
        },
      })
      idByKey.set(key, b.id)
      created++
    }
  }
  console.log(
    `   listings: ${created} new, ${updated} refreshed, ${claimedKept} claimed (left alone), ` +
      `${alreadyOnWaveFinder} already on WaveFinder as their own account`
  )

  // --- Events -------------------------------------------------------------
  let evCreated = 0
  let evUpdated = 0
  let evSkipped = 0
  for (const e of snap.events) {
    const businessId = idByKey.get(`${e.venue.source}|${e.venue.sourceId}`)
    const venue = snap.listings.find((l) => l.source === e.venue.source && l.sourceId === e.venue.sourceId)
    if (!businessId || !venue) { evSkipped++; continue }
    const data = {
      businessId,
      title: e.title,
      description: e.description,
      category: e.category,
      tags: e.isFree ? [...new Set([...e.tags, 'free'])] : e.tags,
      venueName: e.venueName,
      address: [e.venueAddress, 'Brooklyn, NY'].filter(Boolean).join(', '),
      latitude: venue.latitude,
      longitude: venue.longitude,
      startDate: new Date(e.startDate),
      endDate: new Date(e.endDate),
      requiresRegistration: false,
      ticketPrice: e.isFree ? new Prisma.Decimal(0) : null,
      status: 'PUBLISHED' as const,
      isPublished: true,
      sourceUrl: e.sourceUrl,
    }
    const existing = await prisma.event.findUnique({
      where: { source_sourceId: { source: e.source, sourceId: e.sourceId } },
      select: { id: true },
    })
    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data })
      evUpdated++
    } else {
      await prisma.event.create({ data: { ...data, source: e.source, sourceId: e.sourceId } })
      evCreated++
    }
  }
  const dropped = await prisma.event.deleteMany({
    where: {
      source: 'DTBK_EVENTS',
      sourceId: { notIn: snap.events.map((e) => e.sourceId) },
      startDate: { gt: now },
      currentAttendees: 0,
    },
  })
  console.log(
    `   events: ${evCreated} new, ${evUpdated} refreshed, ${dropped.count} no longer on the calendar removed` +
      (evSkipped ? `, ${evSkipped} skipped (venue not imported)` : '')
  )
}

async function main() {
  console.log(`\n🏙️  Brooklyn pilot import${UNDO ? ' - undo' : ''}\n`)
  if (UNDO) await undo()
  else await load()
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
