/**
 * Step 1 of the Brooklyn pilot import: download public listings into a
 * snapshot file. Nothing touches the database here.
 *
 *   npm run import:brooklyn:fetch      -> prisma/data/brooklyn-snapshot.json
 *   npm run import:brooklyn            -> loads that snapshot (step 2)
 *
 * Splitting the two means the snapshot can be reviewed (and committed) before
 * anything is written, and the load is repeatable without re-crawling.
 *
 * Sources, both reached through NYC SBS "Shop Your City" Brooklyn
 * (shopyourcity.cityofnewyork.us/syc-brooklyn), which hands each district off
 * to its own business-improvement-district directory:
 *
 *   DTBK_DIRECTORY    downtownbrooklyn.com/directory - Downtown Brooklyn Partnership
 *   MYRTLE_DIRECTORY  myrtleavenue.org - Myrtle Avenue Brooklyn Partnership
 *   DTBK_EVENTS       downtownbrooklyn.com/calendar iCal feed + event pages
 *
 * Only places people go out to are kept (food, drink, culture, entertainment,
 * fitness, hotels) - not banks, schools, clinics or shops. What is copied is
 * factual: name, address, coordinates, phone, website, category. No reviews,
 * photos or marketing copy are taken from the directories.
 *
 * Both sites' robots.txt allow this. Requests are sequential with a pause
 * between them. ZIP codes come from NYC Planning Labs GeoSearch (public, no key).
 *
 * Downloaded pages are treated strictly as data: parsed with regexes and
 * JSON.parse only, never evaluated.
 */
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'

const OUT = resolve(process.cwd(), 'prisma/data/brooklyn-snapshot.json')
const UA = 'Mozilla/5.0 (compatible; WaveFinderImport/1.0)'
const PAUSE_MS = 1200

/**
 * Downtown Brooklyn + the Myrtle Ave corridor (Flatbush Ave Ext to Classon
 * Ave). Anything a directory lists outside this box is dropped.
 */
const BOUNDS = { minLat: 40.6800, maxLat: 40.7010, minLng: -73.9960, maxLng: -73.9550 }
const inBounds = (lat: number, lng: number) =>
  lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lng >= BOUNDS.minLng && lng <= BOUNDS.maxLng

type BusinessType = 'BAR' | 'RESTAURANT' | 'ENTERTAINMENT' | 'FITNESS' | 'WELLNESS' | 'HOTEL' | 'OTHER'
type EventCategory =
  | 'MUSIC' | 'SPORTS' | 'FOOD_DRINK' | 'WELLNESS' | 'NETWORKING'
  | 'EDUCATION' | 'ART' | 'NIGHTLIFE' | 'COMMUNITY' | 'OTHER'

export interface SnapshotListing {
  source: 'DTBK_DIRECTORY' | 'MYRTLE_DIRECTORY' | 'DTBK_EVENTS'
  sourceId: string
  sourceUrl: string
  district: 'Downtown Brooklyn' | 'Myrtle Avenue'
  name: string
  type: BusinessType
  categories: string[]
  address: string
  zipCode: string
  latitude: number
  longitude: number
  phone: string | null
  website: string | null
}

export interface SnapshotEvent {
  source: 'DTBK_EVENTS'
  sourceId: string
  sourceUrl: string
  title: string
  description: string
  category: EventCategory
  tags: string[]
  isFree: boolean
  startDate: string
  endDate: string
  venueName: string
  venueAddress: string
  /** The listing this event is hosted at (source + sourceId) */
  venue: { source: SnapshotListing['source']; sourceId: string }
}

export interface Snapshot {
  fetchedAt: string
  via: string
  sources: Record<string, string>
  bounds: typeof BOUNDS
  listings: SnapshotListing[]
  events: SnapshotEvent[]
}

// --- Plumbing ----------------------------------------------------------------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function getText(url: string, tries = 3): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (err) {
      if (attempt >= tries) throw new Error(`GET ${url} failed: ${(err as Error).message}`)
      await sleep(PAUSE_MS * attempt * 2)
    }
  }
}

const NAMED: Record<string, string> = {
  amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', eacute: 'é', ntilde: 'ñ',
}
function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m)
}
const stripTags = (s: string) => decode(s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ' ')).replace(/[ \t]+/g, ' ').trim()
const tidy = (s: string) => s.replace(/\s+/g, ' ').trim()
const norm = (s: string) =>
  decode(s).toLowerCase().replace(/&/g, 'and').replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '')

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`))
  return m ? decode(m[1]) : null
}

function cleanUrl(u: string | null): string | null {
  if (!u) return null
  const t = u.trim()
  if (!/^https?:\/\//i.test(t)) return null
  return t
}

// --- ZIP codes ----------------------------------------------------------------
const zipCache = new Map<string, string>()
async function zipFor(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
  if (zipCache.has(key)) return zipCache.get(key)!
  let zip = ''
  try {
    const j = JSON.parse(
      await getText(`https://geosearch.planninglabs.nyc/v2/reverse?point.lat=${lat}&point.lon=${lng}&size=1`)
    )
    zip = j.features?.[0]?.properties?.postalcode ?? ''
  } catch {
    /* leave blank; the loader falls back to the district's ZIP */
  }
  zipCache.set(key, zip)
  await sleep(150)
  return zip
}

async function geocode(text: string): Promise<{ lat: number; lng: number; zip: string } | null> {
  try {
    const j = JSON.parse(
      await getText(`https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(text)}&size=1`)
    )
    const f = j.features?.[0]
    if (!f) return null
    const [lng, lat] = f.geometry.coordinates
    return { lat, lng, zip: f.properties?.postalcode ?? '' }
  } catch {
    return null
  } finally {
    await sleep(150)
  }
}

// --- Downtown Brooklyn Partnership directory ---------------------------------
/** Directory categories that are somewhere to go out, and what they map to. Order = priority. */
const DTBK_TYPES: [string, BusinessType][] = [
  ['Bars', 'BAR'],
  ['Entertainment', 'ENTERTAINMENT'],
  ['Film + Theater', 'ENTERTAINMENT'],
  ['Arts + Culture', 'ENTERTAINMENT'],
  ['Full Service', 'RESTAURANT'],
  ['Fast Casual', 'RESTAURANT'],
  ['Pizza', 'RESTAURANT'],
  ['Fast Food', 'RESTAURANT'],
  ['Tea + Coffee Shops', 'RESTAURANT'],
  ['Dessert + Bakery', 'RESTAURANT'],
  ['Hotels', 'HOTEL'],
  ['Sports + Fitness', 'FITNESS'],
]

async function fetchDtbkDirectory(): Promise<SnapshotListing[]> {
  console.log('• Downtown Brooklyn Partnership directory')
  const html = await getText('https://www.downtownbrooklyn.com/directory/')

  const termNames = new Map<string, string>()
  for (const m of html.matchAll(/data-term-id="(\d+)"[^>]*>([\s\S]{0,300}?)</g)) {
    const name = tidy(stripTags(m[2]))
    if (name && !termNames.has(m[1])) termNames.set(m[1], name)
  }

  const out: SnapshotListing[] = []
  let skippedCategory = 0
  let skippedBounds = 0
  for (const m of html.matchAll(/<div class="cell business[^"]*"[^>]*data-post-id="[^"]*"[^>]*>/g)) {
    const tag = m[0]
    const id = attr(tag, 'data-post-id')!
    const lat = Number(attr(tag, 'data-latitude'))
    const lng = Number(attr(tag, 'data-longitude'))
    const categories = (attr(tag, 'data-term-ids') ?? '')
      .split(',')
      .map((t) => termNames.get(t))
      .filter((n): n is string => !!n)
    const type = DTBK_TYPES.find(([cat]) => categories.includes(cat))?.[1]
    if (!type) { skippedCategory++; continue }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inBounds(lat, lng)) { skippedBounds++; continue }

    out.push({
      source: 'DTBK_DIRECTORY',
      sourceId: id,
      sourceUrl: `https://www.downtownbrooklyn.com/?p=${id}`,
      district: 'Downtown Brooklyn',
      name: tidy(attr(tag, 'data-title') ?? ''),
      type,
      categories,
      address: tidy(attr(tag, 'data-address') ?? ''),
      zipCode: '',
      latitude: lat,
      longitude: lng,
      phone: null,
      website: cleanUrl(attr(tag, 'data-website')),
    })
  }
  console.log(`  ${out.length} kept, ${skippedCategory} not going-out categories, ${skippedBounds} outside the area`)

  for (const l of out) l.zipCode = await zipFor(l.latitude, l.longitude)
  return out
}

// --- Myrtle Avenue Brooklyn Partnership directory -----------------------------
/** Dining categories that aren't somewhere to go out */
const MYRTLE_SKIP = new Set(['delis-small-grocers', 'fish-markets'])

async function fetchMyrtle(): Promise<SnapshotListing[]> {
  console.log('• Myrtle Avenue Brooklyn Partnership directory')
  const dine = await getText('https://myrtleavenue.org/explore/dine-on-myrtle-avenue/')
  const categoryUrls = [
    ...new Set(
      [...dine.matchAll(/href="(https:\/\/myrtleavenue\.org\/explore\/myrtle-merchants\/business-category\/([a-z0-9-]+)\/)"/g)]
        .filter((m) => !MYRTLE_SKIP.has(m[2]))
        .map((m) => m[1])
    ),
  ]

  const byId = new Map<string, SnapshotListing & { _cats: Set<string> }>()
  for (const url of categoryUrls) {
    await sleep(PAUSE_MS)
    const slug = url.split('/').filter(Boolean).pop()!
    const html = await getText(url)
    for (const block of html.matchAll(/w2dc_map_markers_attrs\('[0-9a-f]+', eval\((\[\[[\s\S]*?\]\])\)/g)) {
      let markers: any[]
      try {
        markers = JSON.parse(block[1])
      } catch {
        console.warn(`  could not parse markers on ${slug}`)
        continue
      }
      for (const mk of markers) {
        const [, latS, lngS, icon, , , name, , permalink, addr, postId] = mk
        const lat = Number(latS)
        const lng = Number(lngS)
        if (!Number.isFinite(lat) || !inBounds(lat, lng)) continue
        const id = String(postId).replace('post-', '')
        const addrHtml = Array.isArray(addr) ? String(addr[1] ?? '') : ''
        const street = addrHtml.match(/streetAddress">([^<]*)</)?.[1] ?? ''
        const zip = addrHtml.match(/postalCode">([^<]*)</)?.[1] ?? ''
        const isBar = slug === 'bars-pubs' || /map-(bars|wine)/.test(String(icon))
        const existing = byId.get(id)
        if (existing) {
          existing._cats.add(slug)
          if (isBar) existing.type = 'BAR'
          continue
        }
        byId.set(id, {
          source: 'MYRTLE_DIRECTORY',
          sourceId: id,
          sourceUrl: String(permalink),
          district: 'Myrtle Avenue',
          name: tidy(decode(String(name))),
          type: isBar ? 'BAR' : 'RESTAURANT',
          categories: [],
          _cats: new Set([slug]),
          address: tidy(decode(street)),
          zipCode: tidy(zip),
          latitude: lat,
          longitude: lng,
          phone: null,
          website: null,
        })
      }
    }
  }
  console.log(`  ${byId.size} listings across ${categoryUrls.length} dining categories; reading phone + website...`)

  // Phone and website live on each listing's own page.
  for (const l of byId.values()) {
    await sleep(PAUSE_MS)
    try {
      const html = await getText(l.sourceUrl)
      // The listing's own phone field. (The page's JSON-LD is not used: it
      // describes the site and sidebar events, and carries other businesses' numbers.)
      const phone = html.match(/w2dc-fa-phone[\s\S]{0,200}?w2dc-field-content">([\s\S]*?)<\/span>/)
      const digits = phone ? tidy(stripTags(phone[1])) : ''
      if (digits.replace(/\D/g, '').length >= 10) l.phone = digits
      const site = html.match(/<a itemprop="url"\s+href="([^"]+)"/)
      if (site) l.website = cleanUrl(decode(site[1]))
    } catch (err) {
      console.warn(`  ${l.name}: ${(err as Error).message}`)
    }
  }

  return [...byId.values()].map(({ _cats, ...l }) => ({ ...l, categories: [..._cats] }))
}

// --- Downtown Brooklyn events --------------------------------------------------
function unfoldIcs(ics: string): string[] {
  return ics.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n')
}
const icsUnescape = (s: string) => s.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1')

/** "20261118T190000" in New York time -> Date */
function nyLocal(stamp: string): Date {
  const m = stamp.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?/)!
  const [y, mo, d, h = '0', mi = '0'] = m.slice(1)
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi)
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(guess))
  const g = (t: string) => Number(p.find((x) => x.type === t)!.value)
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'))
  return new Date(guess - (asUtc - guess))
}

const EVENT_CATEGORIES: [RegExp, EventCategory][] = [
  [/music|concert|dj/i, 'MUSIC'],
  [/eat|drink|food/i, 'FOOD_DRINK'],
  [/art|film|theater|theatre|dance|performance/i, 'ART'],
  [/talk|lecture|literature|poetry|class|workshop|book/i, 'EDUCATION'],
  [/fitness|yoga|wellness|health/i, 'WELLNESS'],
  [/sport|soccer|run/i, 'SPORTS'],
  [/game|trivia|nightlife|party/i, 'NIGHTLIFE'],
  [/community|family|kids|market|holiday/i, 'COMMUNITY'],
  [/network|business/i, 'NETWORKING'],
]

interface RawEvent {
  uid: string
  title: string
  description: string
  url: string
  categories: string[]
  start: Date
  end: Date
}

async function fetchDtbkEvents(
  listings: SnapshotListing[]
): Promise<{ events: SnapshotEvent[]; venues: SnapshotListing[] }> {
  console.log('• Downtown Brooklyn events calendar')
  const now = new Date()
  const horizon = new Date(now.getTime() + 75 * 86400_000)
  const months = [0, 1, 2].map((k) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + k, 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  })

  const raw = new Map<string, RawEvent>()
  for (const month of months) {
    await sleep(PAUSE_MS)
    const lines = unfoldIcs(await getText(`https://www.downtownbrooklyn.com/calendar/month/${month}/?ical=1`))
    let cur: Record<string, string> | null = null
    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') cur = {}
      else if (line === 'END:VEVENT' && cur) {
        if (cur.UID && cur.DTSTART && cur.SUMMARY) {
          const start = nyLocal(cur.DTSTART)
          const end = cur.DTEND ? nyLocal(cur.DTEND) : new Date(start.getTime() + 2 * 3600_000)
          if (end >= now && start <= horizon) {
            raw.set(cur.UID, {
              uid: cur.UID,
              title: tidy(icsUnescape(cur.SUMMARY)),
              description: icsUnescape(cur.DESCRIPTION ?? '').trim(),
              url: cur.URL ?? '',
              categories: icsUnescape(cur.CATEGORIES ?? '').split(',').map((c) => c.trim()).filter(Boolean),
              start,
              end,
            })
          }
        }
        cur = null
      } else if (cur) {
        const i = line.indexOf(':')
        if (i > 0) cur[line.slice(0, i).split(';')[0]] = line.slice(i + 1)
      }
    }
  }
  console.log(`  ${raw.size} upcoming occurrences in the next 75 days; reading venues...`)

  // One page per event series (recurring occurrences share a venue).
  const venueByPage = new Map<string, { name: string; address: string } | null>()
  for (const e of raw.values()) {
    const page = e.url.replace(/\d{4}-\d{2}-\d{2}\/?$/, '')
    if (!page || venueByPage.has(page)) continue
    await sleep(PAUSE_MS)
    try {
      const html = await getText(e.url)
      const block = html.match(/<div class="address-and-contact">\s*<p>([\s\S]*?)<\/p>/)
      if (!block) { venueByPage.set(page, null); continue }
      const [name, ...rest] = stripTags(block[1]).split('\n').map(tidy).filter(Boolean)
      venueByPage.set(page, name ? { name, address: rest.join(', ') } : null)
    } catch (err) {
      console.warn(`  ${e.title}: ${(err as Error).message}`)
      venueByPage.set(page, null)
    }
  }

  // Match each venue to an imported listing, or make an unclaimed listing for it.
  const venues: SnapshotListing[] = []
  const resolved = new Map<string, SnapshotListing | null>()
  const numberStreet = (a: string) => norm(a.match(/\d+[a-z]?\s+[^,]+/i)?.[0] ?? '')
  async function resolveVenue(v: { name: string; address: string }) {
    const key = `${norm(v.name)}|${norm(v.address)}`
    if (resolved.has(key)) return resolved.get(key)!
    const n = norm(v.name)
    const pool = [...listings, ...venues]
    // An address only identifies a venue when no one else shares it; malls
    // like City Point hold dozens of listings at one street number.
    const sameAddress = v.address
      ? pool.filter((l) => numberStreet(l.address) && numberStreet(l.address) === numberStreet(v.address))
      : []
    let match =
      pool.find((l) => norm(l.name) === n) ??
      pool.find((l) => n.length >= 6 && (norm(l.name).includes(n) || n.includes(norm(l.name))) && norm(l.name).length >= 6) ??
      (sameAddress.length === 1 ? sameAddress[0] : undefined) ??
      null
    if (match && norm(match.name) !== n) console.log(`  venue "${v.name}" matched to listing "${match.name}"`)
    if (!match && v.address) {
      const g = await geocode(`${v.address}, Brooklyn, NY`)
      if (g && inBounds(g.lat, g.lng)) {
        match = {
          source: 'DTBK_EVENTS',
          sourceId: `venue:${n}`,
          sourceUrl: 'https://www.downtownbrooklyn.com/calendar/',
          district: 'Downtown Brooklyn',
          name: v.name,
          type: 'ENTERTAINMENT',
          categories: ['Event venue'],
          address: v.address,
          zipCode: g.zip,
          latitude: g.lat,
          longitude: g.lng,
          phone: null,
          website: null,
        }
        venues.push(match)
      }
    }
    resolved.set(key, match)
    return match
  }

  const events: SnapshotEvent[] = []
  let noVenue = 0
  for (const e of raw.values()) {
    const v = venueByPage.get(e.url.replace(/\d{4}-\d{2}-\d{2}\/?$/, ''))
    const listing = v ? await resolveVenue(v) : null
    if (!v || !listing) { noVenue++; continue }
    const catText = e.categories.join(' ')
    const description =
      e.description.length > 600 ? e.description.slice(0, 600).replace(/\s+\S*$/, '') + '…' : e.description
    events.push({
      source: 'DTBK_EVENTS',
      sourceId: e.uid,
      sourceUrl: e.url,
      title: e.title,
      description: description || `${e.title} at ${v.name}.`,
      category: EVENT_CATEGORIES.find(([re]) => re.test(catText))?.[1] ?? 'OTHER',
      tags: e.categories.map((c) => c.toLowerCase()).filter((c) => c !== 'brooklyn cultural district'),
      isFree: e.categories.some((c) => /^free$/i.test(c)),
      startDate: e.start.toISOString(),
      endDate: e.end.toISOString(),
      venueName: v.name,
      venueAddress: v.address,
      venue: { source: listing.source, sourceId: listing.sourceId },
    })
  }
  console.log(`  ${events.length} events kept, ${noVenue} without a venue in the area, ${venues.length} venues added`)
  return { events, venues }
}

// --- Merge + write -------------------------------------------------------------
function metersBetween(a: SnapshotListing, b: SnapshotListing) {
  const dLat = (b.latitude - a.latitude) * 111_320
  const dLng = (b.longitude - a.longitude) * 111_320 * Math.cos((a.latitude * Math.PI) / 180)
  return Math.hypot(dLat, dLng)
}

/** A business on Myrtle at the Downtown edge can be in both directories. */
function dedupe(listings: SnapshotListing[]) {
  const kept: SnapshotListing[] = []
  for (const l of listings) {
    const twin = kept.find((k) => norm(k.name) === norm(l.name) && metersBetween(k, l) < 120)
    if (twin) {
      twin.phone ??= l.phone
      twin.website ??= l.website
      twin.zipCode ||= l.zipCode
      continue
    }
    kept.push(l)
  }
  return { kept, merged: listings.length - kept.length }
}

async function main() {
  console.log('\n📥 Fetching Brooklyn pilot listings (no database writes)\n')
  const dtbk = await fetchDtbkDirectory()
  const myrtle = await fetchMyrtle()
  const { kept, merged } = dedupe([...dtbk, ...myrtle])
  const { events, venues } = await fetchDtbkEvents(kept)
  const listings = [...kept, ...venues].filter((l) => l.name && l.address)

  const snapshot: Snapshot = {
    fetchedAt: new Date().toISOString(),
    via: 'https://shopyourcity.cityofnewyork.us/syc-brooklyn/',
    sources: {
      DTBK_DIRECTORY: 'https://www.downtownbrooklyn.com/directory/',
      MYRTLE_DIRECTORY: 'https://myrtleavenue.org/explore/dine-on-myrtle-avenue/',
      DTBK_EVENTS: 'https://www.downtownbrooklyn.com/calendar/',
    },
    bounds: BOUNDS,
    listings,
    events,
  }
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n')

  const byType = listings.reduce<Record<string, number>>((acc, l) => ((acc[l.type] = (acc[l.type] ?? 0) + 1), acc), {})
  console.log(`\n✅ ${listings.length} listings (${merged} duplicates merged), ${events.length} events`)
  console.log('   by type:', byType)
  console.log(`   written to ${OUT}\n`)
}

main().catch((e) => {
  console.error('❌ Fetch failed:', e)
  process.exit(1)
})
