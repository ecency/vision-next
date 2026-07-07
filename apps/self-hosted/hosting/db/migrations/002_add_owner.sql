-- Add tenant owner (idempotent).
-- Decouples the controlling Hive account (owner) from the showcased account (username).
-- For a personal blog owner equals username; for a community the owner is the creating
-- user and username is the community account (hive-NNNNN).
--
-- init.sql only runs on a fresh Postgres volume, so apply this to the existing deployed
-- `hosting` database before this release ships:
--   docker exec -i ecency-hosting-postgres psql -U postgres -d hosting < db/migrations/002_add_owner.sql

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner VARCHAR(255);
UPDATE tenants SET owner = username WHERE owner IS NULL;
ALTER TABLE tenants ALTER COLUMN owner SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner);
