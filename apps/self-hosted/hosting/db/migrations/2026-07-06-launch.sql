-- Blog hosting launch migration (idempotent).
-- init.sql only runs on a fresh Postgres volume, so apply this to the existing
-- deployed `hosting` database before enabling card payments:
--   docker exec -i ecency-hosting-postgres psql -U postgres -d hosting < db/migrations/2026-07-06-launch.sql

-- Stripe order/intent ids can exceed 64 chars; a too-narrow column would reject the
-- activation AFTER the card is charged, leaving the tenant uncredited.
ALTER TABLE payments ALTER COLUMN trx_id TYPE VARCHAR(255);

-- Split revenue by currency so on-chain HBD and card USD are never summed together.
CREATE OR REPLACE VIEW payment_stats AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_payments,
    SUM(amount) FILTER (WHERE currency = 'HBD') as total_hbd,
    SUM(amount) FILTER (WHERE currency = 'USD') as total_usd,
    SUM(months_credited) as total_months_credited
FROM payments
WHERE status = 'processed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
