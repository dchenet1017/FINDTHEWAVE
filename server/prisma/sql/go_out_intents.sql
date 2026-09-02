-- "I Want to Go Out" rollout notes. Run AFTER `npm run db:push` in server/.
--
-- db:push creates GoOutIntent + BusinessOffer and the two new enums. Nothing
-- needs backfilling: both tables start empty.
--
-- The demand queries use PostGIS (ST_DWithin / ST_MakePoint(...)::geography).
-- go-out.service.ts issues CREATE EXTENSION IF NOT EXISTS postgis on first use
-- and falls back to a bounding box + haversine if that fails, so this is only
-- needed if the app role cannot create extensions:
CREATE EXTENSION IF NOT EXISTS postgis;

-- The old GoOutStatus / BusinessInvite tables are intentionally left in place.
-- GoOutStatus is no longer read or written by any code path; BusinessInvite is
-- still used by the general /api/invites module (promotions), so do not drop it.
--
-- Once you are satisfied nothing depends on the old go-out queue, the status
-- table can go:
--   DROP TABLE "GoOutStatus";
-- Check first:
--   SELECT count(*) FROM "GoOutStatus";
