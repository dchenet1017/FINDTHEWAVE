-- Onboarding rollout, run AFTER `npm run db:push` in server/.
--
-- db:push adds the new User columns with onboardingCompleted defaulting to
-- false, which would drop every existing account back into the first-run
-- wizard on their next login. Accounts that predate the wizard have already
-- been using the app, so mark them done.
--
-- Run once, immediately after the push:
--   psql "$DATABASE_URL" -f prisma/sql/onboarding_backfill.sql

UPDATE "User"
SET "onboardingCompleted"   = true,
    "onboardingStep"        = 6,
    "onboardingCompletedAt" = COALESCE("onboardingCompletedAt", "createdAt")
WHERE "onboardingCompleted" = false;
