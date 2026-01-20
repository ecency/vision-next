-- Ecency Hosting Platform Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table - stores blog instance configurations
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL UNIQUE,  -- Hive username (also subdomain)
    
    -- Subscription
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'inactive', -- active, inactive, expired, suspended
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'standard',   -- standard, pro
    subscription_started_at TIMESTAMPTZ,
    subscription_expires_at TIMESTAMPTZ,
    
    -- Custom domain (Pro plan)
    custom_domain VARCHAR(255) UNIQUE,
    custom_domain_verified BOOLEAN DEFAULT FALSE,
    custom_domain_verified_at TIMESTAMPTZ,
    
    -- Configuration (stored as JSONB for flexibility)
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_tenants_username ON tenants(username);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX idx_tenants_expires ON tenants(subscription_expires_at) WHERE subscription_status = 'active';

-- Payments table - tracks HBD payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Hive transaction details
    trx_id VARCHAR(64) NOT NULL UNIQUE,
    block_num BIGINT NOT NULL,
    from_account VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 3) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'HBD',
    memo TEXT,
    
    -- Payment processing
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processed, failed, refunded
    processed_at TIMESTAMPTZ,
    
    -- Subscription extension
    months_credited INTEGER DEFAULT 0,
    subscription_extended_to TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_trx_id ON payments(trx_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_from_account ON payments(from_account);
CREATE INDEX idx_payments_status ON payments(status);

-- Domain verification tokens
CREATE TABLE domain_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    verification_token VARCHAR(255) NOT NULL,
    verification_method VARCHAR(50) NOT NULL DEFAULT 'cname', -- cname, txt
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domain_verifications_tenant ON domain_verifications(tenant_id);
CREATE INDEX idx_domain_verifications_domain ON domain_verifications(domain);

-- Audit log for important events
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check and expire subscriptions
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE tenants
    SET subscription_status = 'expired'
    WHERE subscription_status = 'active'
      AND subscription_expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- View for active subscriptions summary
CREATE VIEW active_subscriptions AS
SELECT 
    t.username,
    t.subscription_plan,
    t.subscription_expires_at,
    t.custom_domain,
    t.custom_domain_verified,
    EXTRACT(DAY FROM t.subscription_expires_at - NOW()) as days_remaining
FROM tenants t
WHERE t.subscription_status = 'active'
ORDER BY t.subscription_expires_at ASC;

-- View for payment statistics
CREATE VIEW payment_stats AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_payments,
    SUM(amount) as total_hbd,
    SUM(months_credited) as total_months_credited
FROM payments
WHERE status = 'processed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- System configuration table (for payment listener state, etc.)
CREATE TABLE system_config (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default values
INSERT INTO system_config (key, value) VALUES
    ('payment_listener.last_block', '0')
ON CONFLICT (key) DO NOTHING;
