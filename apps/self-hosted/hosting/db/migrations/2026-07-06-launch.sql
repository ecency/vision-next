-- Blog hosting launch migration (idempotent).
-- init.sql only runs on a fresh Postgres volume, so apply this to the existing
-- deployed `hosting` database before enabling card payments:
--   docker exec -i ecency-hosting-postgres psql -U postgres -d hosting < db/migrations/2026-07-06-launch.sql

-- Stripe Checkout Session ids (cs_...) can exceed 64 chars; a too-narrow column
-- would reject the webhook AFTER the card is charged, leaving the tenant uncredited.
ALTER TABLE payments ALTER COLUMN trx_id TYPE VARCHAR(255);
