/**
 * End-to-end smoke test for the onboarding wizard and the go-out demand queue.
 * Drives the real HTTP API, so it covers routing, auth, zod validation and the
 * services together. Run against a local server only.
 */
const BASE = process.env.E2E_BASE ?? 'http://localhost:3002'

let pass = 0
let fail = 0
const failures: string[] = []

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    pass++
    console.log(`  PASS  ${name}`)
  } else {
    fail++
    failures.push(name)
    console.log(`  FAIL  ${name}  ${detail}`)
  }
}

async function api(
  method: string,
  path: string,
  opts: { token?: string; body?: any } = {}
) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
  })
  let json: any = null
  try {
    json = await res.json()
  } catch {
    /* empty body */
  }
  return { status: res.status, json }
}

/** The API wraps payloads in { success, data } - unwrap when present. */
const unwrap = (j: any) => (j && typeof j === 'object' && 'data' in j ? j.data : j)

function tokenOf(j: any): string {
  const d = unwrap(j) ?? {}
  return d.accessToken ?? d.token ?? j?.accessToken ?? j?.token ?? ''
}

async function main() {
  console.log(`\n=== E2E against ${BASE} ===\n`)

  // ---------------------------------------------------------------- ONBOARDING
  console.log('--- Onboarding wizard (fresh account) ---')
  const email = `e2e_${Date.now()}@demo.wavefinder.com`
  const reg = await api('POST', '/api/auth/register', {
    body: { email, password: 'E2etest123', firstName: 'Eve', lastName: 'Tester' },
  })
  check('register new user', reg.status === 200 || reg.status === 201, `HTTP ${reg.status} ${JSON.stringify(reg.json).slice(0, 160)}`)
  const token = tokenOf(reg.json)
  check('register returns a token', !!token, JSON.stringify(reg.json).slice(0, 160))
  if (!token) return

  const s0 = await api('GET', '/api/users/me/onboarding', { token })
  const st0 = unwrap(s0.json)
  check('GET onboarding state', s0.status === 200, `HTTP ${s0.status}`)
  check('new user starts incomplete at step 1', st0?.completed === false && st0?.step === 1, JSON.stringify(st0))

  const s2 = await api('PATCH', '/api/users/me/onboarding', {
    token,
    body: {
      step: 2,
      firstName: 'Eve',
      interests: ['LIVE_MUSIC', 'DANCING'],
      locationLat: 40.7484,
      locationLng: -73.9857,
      locationLabel: 'Midtown, New York',
    },
  })
  const st2 = unwrap(s2.json)
  check('step 2 saves interests + location', s2.status === 200 && st2?.interests?.length === 2, `HTTP ${s2.status} ${JSON.stringify(st2).slice(0, 200)}`)

  const s3 = await api('PATCH', '/api/users/me/onboarding', {
    token,
    body: { step: 3, experienceGoal: 'GO_OUT' },
  })
  check('step 3 saves experience goal', unwrap(s3.json)?.experienceGoal === 'GO_OUT', JSON.stringify(unwrap(s3.json)).slice(0, 160))

  const s4 = await api('PATCH', '/api/users/me/onboarding', {
    token,
    body: { step: 4, nightVibe: 77, maxDistanceMiles: 8, notificationsEnabled: true },
  })
  const st4 = unwrap(s4.json)
  check('step 4 saves preferences', st4?.nightVibe === 77 && st4?.maxDistanceMiles === 8, JSON.stringify(st4).slice(0, 160))

  // Going back to an earlier step must not rewind the resume point.
  const back = await api('PATCH', '/api/users/me/onboarding', {
    token,
    body: { step: 2, firstName: 'Eve' },
  })
  check('step only moves forward (resume point kept)', unwrap(back.json)?.step === 4, `step=${unwrap(back.json)?.step}`)

  const bad = await api('PATCH', '/api/users/me/onboarding', {
    token,
    body: { nightVibe: 500 },
  })
  check('rejects out-of-range nightVibe', bad.status >= 400, `HTTP ${bad.status}`)

  const badField = await api('PATCH', '/api/users/me/onboarding', {
    token,
    body: { notARealField: true },
  })
  check('rejects unknown field (strict schema)', badField.status >= 400, `HTTP ${badField.status}`)

  const done = await api('POST', '/api/users/me/onboarding/complete', {
    token,
    body: { locationSharingEnabled: true },
  })
  const stDone = unwrap(done.json)
  check('complete marks onboarding done', done.status === 200 && stDone?.completed === true, `HTTP ${done.status} ${JSON.stringify(stDone).slice(0, 200)}`)
  check('completedAt is set', !!stDone?.completedAt, JSON.stringify(stDone?.completedAt))

  const noAuth = await api('GET', '/api/users/me/onboarding')
  check('onboarding requires auth', noAuth.status === 401, `HTTP ${noAuth.status}`)

  // ------------------------------------------------------------------- GO OUT
  console.log('\n--- Go-out demand queue ---')
  const userLogin = await api('POST', '/api/auth/login', {
    body: { email: 'user@wavefinder.com', password: 'User123!' },
  })
  const userToken = tokenOf(userLogin.json)
  check('login as seeded user', !!userToken, `HTTP ${userLogin.status}`)

  const bizLogin = await api('POST', '/api/auth/login', {
    body: { email: 'business@wavefinder.com', password: 'Business123!' },
  })
  const bizToken = tokenOf(bizLogin.json)
  check('login as seeded business', !!bizToken, `HTTP ${bizLogin.status}`)
  if (!userToken || !bizToken) return

  const venues = await api('GET', '/api/go-out/active-venues')
  const venueData = unwrap(venues.json)
  check('active-venues is public (no auth)', venues.status === 200, `HTTP ${venues.status}`)
  check('active-venues returns ids only', Array.isArray(venueData?.businessIds) && !JSON.stringify(venueData).includes('userId'), JSON.stringify(venueData).slice(0, 160))

  // Re-raise so this run owns a fresh intent regardless of prior state.
  await api('DELETE', '/api/go-out/lower-hand', { token: userToken })
  const raise = await api('POST', '/api/go-out/raise-hand', {
    token: userToken,
    body: {
      vibes: ['DRINKS', 'LIVE_MUSIC'],
      partySize: 2,
      latitude: 40.753472,
      longitude: -73.9857,
    },
  })
  check('raise hand', raise.status === 200 || raise.status === 201, `HTTP ${raise.status} ${JSON.stringify(raise.json).slice(0, 200)}`)

  const mine = await api('GET', '/api/go-out/my-intent', { token: userToken })
  const mineData = unwrap(mine.json)
  check('my-intent returns the active hand', mineData?.intent?.status === 'ACTIVE', JSON.stringify(mineData).slice(0, 200))

  const badRaise = await api('POST', '/api/go-out/raise-hand', {
    token: userToken,
    body: { vibes: [], partySize: 99, latitude: 40.75, longitude: -73.98 },
  })
  check('rejects empty vibes / oversized party', badRaise.status >= 400, `HTTP ${badRaise.status}`)

  const demand = await api('GET', '/api/go-out/active-demand?radius=5', { token: bizToken })
  const dem = unwrap(demand.json)
  check('business sees aggregate demand', demand.status === 200 && dem?.totalIntents > 0, `HTTP ${demand.status} ${JSON.stringify(dem).slice(0, 160)}`)
  const demandStr = JSON.stringify(dem)
  check('demand leaks no identity or coordinates', !/userId|email|latitude|longitude|firstName/.test(demandStr), demandStr.slice(0, 200))

  const userSeesDemand = await api('GET', '/api/go-out/active-demand?radius=5', { token: userToken })
  check('plain user is blocked from active-demand', userSeesDemand.status === 403, `HTTP ${userSeesDemand.status}`)

  const userSendsOffer = await api('POST', '/api/go-out/send-offer', {
    token: userToken,
    body: { message: 'nope', perkDescription: 'nope', radiusMiles: 5, broadcast: false },
  })
  check('plain user is blocked from send-offer', userSendsOffer.status === 403, `HTTP ${userSendsOffer.status}`)

  const offerMsg = `E2E offer ${Date.now()}`
  const send = await api('POST', '/api/go-out/send-offer', {
    token: bizToken,
    body: {
      message: offerMsg,
      perkDescription: 'E2E free round',
      doorCode: 'E2E-CODE',
      radiusMiles: 5,
      vibes: ['DRINKS'],
      broadcast: false,
    },
  })
  check('business sends targeted offer', send.status === 200 || send.status === 201, `HTTP ${send.status} ${JSON.stringify(send.json).slice(0, 200)}`)

  const inbox = await api('GET', '/api/go-out/my-offers', { token: userToken })
  const inboxData = unwrap(inbox.json)
  const mineOffer = (inboxData?.offers ?? []).find((o: any) => o.message === offerMsg)
  check('offer reaches the user inbox', !!mineOffer, `got ${inboxData?.offers?.length ?? 0} offers`)
  if (!mineOffer) return

  check('door code hidden while PENDING', mineOffer.status === 'PENDING' && mineOffer.doorCode === null, JSON.stringify(mineOffer).slice(0, 200))

  const accept = await api('POST', `/api/go-out/respond-offer/${mineOffer.id}`, {
    token: userToken,
    body: { action: 'ACCEPT' },
  })
  const acc = unwrap(accept.json)
  check('accept offer', accept.status === 200, `HTTP ${accept.status} ${JSON.stringify(acc).slice(0, 200)}`)
  check('door code revealed on accept', acc?.offer?.doorCode === 'E2E-CODE', JSON.stringify(acc?.offer).slice(0, 200))
  check('intent becomes CLAIMED', acc?.intent?.status === 'CLAIMED', JSON.stringify(acc?.intent).slice(0, 160))

  const reAccept = await api('POST', `/api/go-out/respond-offer/${mineOffer.id}`, {
    token: userToken,
    body: { action: 'ACCEPT' },
  })
  check('cannot accept the same offer twice', reAccept.status >= 400, `HTTP ${reAccept.status}`)

  const sent = await api('GET', '/api/go-out/sent-offers', { token: bizToken })
  const sentData = unwrap(sent.json)
  check('business sees its sent offers', sent.status === 200 && (sentData?.offers?.length ?? 0) > 0, `HTTP ${sent.status}`)

  await regressions(bizToken)

  console.log(`\n=== ${pass} passed, ${fail} failed ===`)
  if (fail) {
    console.log('Failed:')
    for (const f of failures) console.log(`  - ${f}`)
    process.exit(1)
  }
}

/** Registers a throwaway consumer account and returns its token. */
async function freshUser(label: string): Promise<string> {
  const reg = await api('POST', '/api/auth/register', {
    body: {
      email: `e2e_${label}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@demo.wavefinder.com`,
      password: 'E2etest123',
    },
  })
  return tokenOf(reg.json)
}

/** Fixes for the pilot-readiness review. Each check names the bug it guards. */
async function regressions(bizToken: string) {
  const myBiz = unwrap((await api('GET', '/api/businesses/my/business', { token: bizToken })).json)
  const venueLat = Number(myBiz?.latitude)
  const venueLng = Number(myBiz?.longitude)
  check('business account has a venue on file', !!myBiz?.id, JSON.stringify(myBiz).slice(0, 120))
  if (!myBiz?.id) return

  // ------------------------------------------------------------- CHECK-INS
  console.log('\n--- Check-ins ---')
  const checker = await freshUser('checkin')

  const noLoc = await api('POST', `/api/checkins/${myBiz.id}`, { token: checker, body: {} })
  check('check-in without a location is refused', noLoc.status === 400, `HTTP ${noLoc.status}`)

  const far = await api('POST', `/api/checkins/${myBiz.id}`, {
    token: checker,
    body: { latitude: venueLat + 0.05, longitude: venueLng },
  })
  check('check-in from far away is refused', far.status === 400, `HTTP ${far.status}`)

  // Five simultaneous taps at the venue: exactly one may succeed.
  const burst = await Promise.all(
    Array.from({ length: 5 }, () =>
      api('POST', `/api/checkins/${myBiz.id}`, {
        token: checker,
        body: { latitude: venueLat, longitude: venueLng },
      })
    )
  )
  const ok = burst.filter((r) => r.status === 200)
  check('simultaneous check-ins: exactly one succeeds', ok.length === 1, `statuses ${burst.map((r) => r.status).join(',')}`)

  const history = await api('GET', '/api/checkins', { token: checker })
  check('check-in history loads', history.status === 200 && unwrap(history.json)?.length === 1, `HTTP ${history.status} ${JSON.stringify(history.json).slice(0, 160)}`)

  const stats = unwrap((await api('GET', '/api/users/me/stats', { token: checker })).json)
  const points = stats?.rewardPoints
  check('points awarded once, not per attempt', points === unwrap(ok[0]?.json)?.pointsEarned, `points=${points} stats=${JSON.stringify(stats).slice(0, 160)}`)

  // ---------------------------------------------------- BUSINESS APPROVAL
  console.log('\n--- Business approval ---')
  const selfApprove = await api('PATCH', `/api/businesses/${myBiz.id}`, {
    token: bizToken,
    body: { approvalStatus: 'PENDING', isVerified: false },
  })
  const afterPatch = unwrap((await api('GET', '/api/businesses/my/business', { token: bizToken })).json)
  check(
    'owner cannot change approval or verification',
    selfApprove.status === 200 && afterPatch?.approvalStatus === myBiz.approvalStatus && afterPatch?.isVerified === myBiz.isVerified,
    `HTTP ${selfApprove.status} status=${afterPatch?.approvalStatus} verified=${afterPatch?.isVerified}`
  )

  const withEmail = await api('PATCH', `/api/businesses/${myBiz.id}`, {
    token: bizToken,
    body: { email: 'venue@example.com' },
  })
  check('updating with an email field does not 500', withEmail.status === 200, `HTTP ${withEmail.status}`)

  const pendingOwner = await freshUser('pending')
  const pendingName = `E2E Pending Venue ${Date.now()}`
  const created = await api('POST', '/api/businesses', {
    token: pendingOwner,
    body: {
      name: pendingName,
      description: 'Pending venue created by the e2e suite',
      type: 'BAR',
      address: '1 Test St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      latitude: venueLat,
      longitude: venueLng,
    },
  })
  const pendingId = unwrap(created.json)?.id
  check('new business is created as PENDING', unwrap(created.json)?.approvalStatus === 'PENDING', `HTTP ${created.status}`)

  const pendingDetail = await api('GET', `/api/businesses/${pendingId}`)
  check('pending business has no public page', pendingDetail.status === 404, `HTTP ${pendingDetail.status}`)

  const search = unwrap((await api('GET', `/api/businesses/search?q=${encodeURIComponent(pendingName)}`)).json) ?? []
  const nearby = unwrap((await api('GET', `/api/businesses/nearby?lat=${venueLat}&lng=${venueLng}&radius=1`)).json) ?? []
  const list = unwrap((await api('GET', '/api/businesses?limit=100')).json)?.items ?? []
  check(
    'pending business is hidden from search, nearby and list',
    ![...search, ...nearby, ...list].some((b: any) => b.id === pendingId),
    `search=${search.length} nearby=${nearby.length} list=${list.length}`
  )
  check('public listing does not expose owner emails', !JSON.stringify(list).includes('@'), 'found an @ in the public list')

  // ---------------------------------------------------------------- GO-OUT
  console.log('\n--- Go-out privacy and broadcasts ---')
  const probe = await api('GET', `/api/go-out/active-demand?radius=0.5&lat=${venueLat + 0.02}&lng=${venueLng}`, { token: bizToken })
  check('business cannot centre demand on an arbitrary point', probe.status === 403, `HTTP ${probe.status}`)

  const [a, b, c] = await Promise.all([freshUser('a'), freshUser('b'), freshUser('c')])
  for (const t of [a, b, c]) {
    await api('POST', '/api/go-out/raise-hand', {
      token: t,
      body: { vibes: ['DRINKS'], partySize: 1, latitude: venueLat, longitude: venueLng },
    })
  }

  const castMsg = `E2E broadcast ${Date.now()}`
  await api('POST', '/api/go-out/send-offer', {
    token: bizToken,
    body: { message: castMsg, perkDescription: 'E2E broadcast perk', doorCode: 'CAST', radiusMiles: 5, broadcast: true },
  })
  const findCast = async (t: string) =>
    (unwrap((await api('GET', '/api/go-out/my-offers', { token: t })).json)?.offers ?? []).find(
      (o: any) => o.message === castMsg
    )

  const castForA = await findCast(a)
  check('broadcast reaches nearby users', castForA?.status === 'PENDING', JSON.stringify(castForA).slice(0, 120))
  if (!castForA) return

  const decline = await api('POST', `/api/go-out/respond-offer/${castForA.id}`, { token: a, body: { action: 'DECLINE' } })
  check('declining a broadcast succeeds', decline.status === 200, `HTTP ${decline.status}`)
  const castForAAfter = await findCast(a)
  check('declined broadcast no longer offered to that user', !castForAAfter || castForAAfter.status === 'DECLINED', JSON.stringify(castForAAfter).slice(0, 120))
  const castForB = await findCast(b)
  check('one decline leaves the broadcast open for others', castForB?.status === 'PENDING' && castForB.id === castForA.id, JSON.stringify(castForB).slice(0, 120))

  // B and C race for the same broadcast: one wins, one is told it is gone.
  const race = await Promise.all(
    [b, c].map((t) => api('POST', `/api/go-out/respond-offer/${castForA.id}`, { token: t, body: { action: 'ACCEPT' } }))
  )
  const winners = race.filter((r) => r.status === 200)
  check('two users racing for one broadcast: exactly one wins', winners.length === 1, `statuses ${race.map((r) => r.status).join(',')}`)

  // The winner already has an outing; a second offer must be refused.
  const winnerToken = race[0].status === 200 ? b : c
  await api('POST', '/api/go-out/send-offer', {
    token: bizToken,
    body: { message: `${castMsg} #2`, perkDescription: 'Second perk', radiusMiles: 5, broadcast: true },
  })
  const second = (unwrap((await api('GET', '/api/go-out/my-offers', { token: winnerToken })).json)?.offers ?? []).find(
    (o: any) => o.message === `${castMsg} #2`
  )
  if (second) {
    const again = await api('POST', `/api/go-out/respond-offer/${second.id}`, { token: winnerToken, body: { action: 'ACCEPT' } })
    check('cannot accept a second offer after claiming one', again.status === 400, `HTTP ${again.status}`)
  } else {
    check('second broadcast visible to the winner', false, 'not found in inbox')
  }

  for (const t of [a, b, c]) await api('DELETE', '/api/go-out/lower-hand', { token: t })

  // ------------------------------------------------- PENDING VENUE + ADMIN
  console.log('\n--- Pending venues and admin oversight ---')
  // The pending owner's token predates their switch to BUSINESS; log in again
  const pendingEmail = `e2e_pendingvenue_${Date.now()}@demo.wavefinder.com`
  const pendingReg = tokenOf((await api('POST', '/api/auth/register', { body: { email: pendingEmail, password: 'E2etest123' } })).json)
  await api('POST', '/api/businesses', {
    token: pendingReg,
    body: {
      name: `E2E Unapproved ${Date.now()}`,
      description: 'Venue that has not been reviewed yet',
      type: 'BAR',
      address: '2 Test St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      latitude: venueLat,
      longitude: venueLng,
    },
  })
  const pendingBiz = tokenOf((await api('POST', '/api/auth/login', { body: { email: pendingEmail, password: 'E2etest123' } })).json)
  const pendingSend = await api('POST', '/api/go-out/send-offer', {
    token: pendingBiz,
    body: { message: 'Not yet', perkDescription: 'Nope', radiusMiles: 5, broadcast: true },
  })
  check('unapproved venue cannot send offers', pendingSend.status === 403, `HTTP ${pendingSend.status}`)

  const adminToken = tokenOf((await api('POST', '/api/auth/login', { body: { email: 'admin@wavefinder.com', password: 'Admin123!' } })).json)
  const adminList = await api('GET', '/api/admin/businesses?search=&status=&page=1&limit=10', { token: adminToken })
  check('admin business list loads with empty filters', adminList.status === 200, `HTTP ${adminList.status}`)

  const overview = await api('GET', '/api/admin/go-out', { token: adminToken })
  const ov = unwrap(overview.json)
  check('admin go-out overview loads', overview.status === 200 && typeof ov?.live?.handsRaised === 'number', `HTTP ${overview.status}`)
  const exactCoords = (ov?.recentIntents ?? []).some(
    (i: any) =>
      Number(i.approxLatitude.toFixed(2)) !== i.approxLatitude ||
      Number(i.approxLongitude.toFixed(2)) !== i.approxLongitude ||
      'latitude' in i ||
      'userId' in i
  )
  check('admin overview rounds locations and hides user ids', !exactCoords, JSON.stringify(ov?.recentIntents?.[0]).slice(0, 160))

  const userBlocked = await api('GET', '/api/admin/go-out', { token: a })
  check('non-admin is blocked from go-out overview', userBlocked.status === 403, `HTTP ${userBlocked.status}`)

  const live = (ov?.recentOffers ?? []).find((o: any) => o.status === 'PENDING')
  if (live) {
    const withdraw = await api('POST', `/api/admin/go-out/offers/${live.id}/withdraw`, { token: adminToken })
    check('admin can withdraw a live offer', withdraw.status === 200, `HTTP ${withdraw.status} ${JSON.stringify(withdraw.json)} ${JSON.stringify(live).slice(0, 200)}`)
    const again = await api('POST', `/api/admin/go-out/offers/${live.id}/withdraw`, { token: adminToken })
    check('withdrawing twice is refused', again.status === 400, `HTTP ${again.status}`)
  }

  // ------------------------------------------------------------ HARDENING
  console.log('\n--- Hardening ---')
  const malformed = await fetch(`${BASE}/api/go-out/raise-hand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${a}` },
    body: '{not json',
  })
  check('malformed JSON is a 400, not a 500', malformed.status === 400, `HTTP ${malformed.status}`)
}

main().catch((e) => {
  console.error('E2E crashed:', e)
  process.exit(1)
})
