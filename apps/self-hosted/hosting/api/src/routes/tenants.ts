/**
 * Tenant Management Routes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client';
import { TenantService } from '../services/tenant-service';
import { mapTenantFromDb } from '../types';
import { ConfigService } from '../services/config-service';
import { authMiddleware } from '../middleware/auth';
import { subscriptionPaywall, proUpgradePaywall } from '../middleware/x402-paywall';
import { AuditService, parseClientIp } from '../services/audit-service';

export const tenantRoutes = new Hono();

// Validation schemas
const createTenantSchema = z.object({
  username: z.string().min(3).max(16).regex(/^[a-z][a-z0-9.-]*$/),
  config: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    styleTemplate: z.enum(['medium', 'minimal', 'magazine', 'developer', 'modern-gradient']).optional(),
    type: z.enum(['blog', 'community']).optional(),
    communityId: z.string().optional(),
    title: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
  }).optional(),
});

const updateTenantSchema = z.object({
  config: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    styleTemplate: z.enum(['medium', 'minimal', 'magazine', 'developer', 'modern-gradient']).optional(),
    title: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    listType: z.enum(['list', 'grid']).optional(),
    sidebarPlacement: z.enum(['left', 'right']).optional(),
  }).optional(),
});

// GET /v1/tenants/:username - Get tenant info
tenantRoutes.get('/:username', async (c) => {
  const username = c.req.param('username');
  
  const tenant = await TenantService.getByUsername(username);
  
  if (!tenant) {
    return c.json({ error: 'Tenant not found' }, 404);
  }
  
  return c.json({
    username: tenant.username,
    subscriptionStatus: tenant.subscriptionStatus,
    subscriptionPlan: tenant.subscriptionPlan,
    subscriptionExpiresAt: tenant.subscriptionExpiresAt,
    customDomain: tenant.customDomain,
    customDomainVerified: tenant.customDomainVerified,
    blogUrl: TenantService.getBlogUrl(tenant),
    createdAt: tenant.createdAt,
  });
});

// GET /v1/tenants/:username/config - Get tenant config (for blog app)
tenantRoutes.get('/:username/config', async (c) => {
  const username = c.req.param('username');
  
  const tenant = await TenantService.getByUsername(username);
  
  if (!tenant) {
    return c.json({ error: 'Tenant not found' }, 404);
  }
  
  // Check subscription is active
  if (tenant.subscriptionStatus !== 'active') {
    return c.json({ error: 'Subscription inactive' }, 402);
  }
  
  return c.json(tenant.config);
});

// POST /v1/tenants - Create new tenant (requires payment)
tenantRoutes.post('/', zValidator('json', createTenantSchema), async (c) => {
  const body = c.req.valid('json');
  
  // Check if username already exists
  const existing = await TenantService.getByUsername(body.username);
  if (existing) {
    return c.json({ error: 'Username already registered' }, 409);
  }
  
  // Verify the Hive account exists
  const hiveAccountExists = await TenantService.verifyHiveAccount(body.username);
  if (!hiveAccountExists) {
    return c.json({ error: 'Hive account not found' }, 400);
  }
  
  // Create tenant (inactive until payment)
  const tenant = await TenantService.create(body.username, body.config);
  
  // Generate config file (will be served after payment)
  await ConfigService.generateConfigFile(tenant);
  
  const baseDomain = process.env.BASE_DOMAIN || 'blogs.ecency.com';
  const paymentAccount = process.env.PAYMENT_ACCOUNT || 'ecency.hosting';
  const monthlyPrice = process.env.MONTHLY_PRICE_HBD || '0.100';
  
  void AuditService.log({
    tenantId: tenant.id,
    eventType: 'tenant.created',
    eventData: { username: body.username },
    ipAddress: parseClientIp(c.req.header('x-forwarded-for')),
    userAgent: c.req.header('user-agent'),
  });

  return c.json({
    tenant: {
      username: tenant.username,
      subscriptionStatus: tenant.subscriptionStatus,
      blogUrl: `https://${tenant.username}.${baseDomain}`,
    },
    paymentInstructions: {
      to: paymentAccount,
      amount: `${monthlyPrice} HBD`,
      memo: `blog:${tenant.username}`,
      note: 'Send this exact memo to activate your blog',
    },
  }, 201);
});

// POST /v1/tenants/subscribe - Create tenant via x402 payment
// Validation runs before paywall so we don't settle payment for invalid requests
tenantRoutes.post('/subscribe',
  zValidator('json', createTenantSchema),
  async (c, next) => {
    const body = c.req.valid('json');
    const existing = await TenantService.getByUsername(body.username);
    if (existing) {
      return c.json({ error: 'Username already registered' }, 409);
    }
    const hiveAccountExists = await TenantService.verifyHiveAccount(body.username);
    if (!hiveAccountExists) {
      return c.json({ error: 'Hive account not found' }, 400);
    }
    await next();
  },
  subscriptionPaywall,
  async (c) => {
    const body = c.req.valid('json');
    const payer = c.get('payer');
    const txId = c.get('txId');

    if (!payer || typeof payer !== 'string' || !txId || typeof txId !== 'string') {
      return c.json({ error: 'Missing or invalid payer/txId from payment settlement' }, 502);
    }

    // Prepare config before entering the DB transaction (pure, no I/O)
    const tenantConfig = await TenantService.buildConfig(body.username, body.config);
    const blockNum = c.get('blockNum');
    if (!Number.isInteger(blockNum) || blockNum <= 0) {
      return c.json({ error: 'Missing or invalid block number from payment settlement' }, 502);
    }

    // All mutations inside a DB transaction to prevent orphan tenants
    const result = await db.transaction(async (client) => {
      // Create tenant — ON CONFLICT handles race with concurrent requests
      const tenantRow = await client.query(
        `INSERT INTO tenants (username, config, subscription_status, subscription_plan)
         VALUES ($1, $2, 'inactive', 'standard')
         ON CONFLICT (username) DO NOTHING
         RETURNING *`,
        [body.username.toLowerCase(), JSON.stringify(tenantConfig)]
      );
      if (tenantRow.rowCount === 0) {
        throw Object.assign(new Error('Username already registered'), { isConflict: true });
      }
      const tenantId = tenantRow.rows[0].id;

      // Claim payment — if already claimed, rollback (duplicate)
      const paymentResult = await client.query(
        `INSERT INTO payments (id, tenant_id, trx_id, block_num, from_account, amount, currency, memo, status, months_credited, processed_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'HBD', $6, 'processed', 1, NOW())
         ON CONFLICT (trx_id) DO NOTHING`,
        [
          tenantId,
          txId,
          blockNum,
          payer,
          parseFloat(process.env.MONTHLY_PRICE_HBD || '0.100'),
          `x402:subscribe:${body.username}`,
        ]
      );

      if (paymentResult.rowCount === 0) {
        throw Object.assign(new Error('Payment already processed'), { isDuplicate: true });
      }

      // Activate subscription (use SQL INTERVAL for correct month arithmetic)
      const activatedRow = await client.query(
        `UPDATE tenants
         SET subscription_status = 'active',
             subscription_started_at = NOW(),
             subscription_expires_at = NOW() + INTERVAL '1 month',
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [tenantId]
      );

      return activatedRow.rows[0];
    }).catch((err) => {
      if (err.isDuplicate) return null;
      if (err.isConflict) return 'conflict';
      throw err;
    });

    if (result === 'conflict') {
      return c.json({ error: 'Username already registered' }, 409);
    }

    if (!result) {
      return c.json({ error: 'Payment already processed' }, 409);
    }

    // Generate config outside the transaction (non-critical)
    const activatedTenant = mapTenantFromDb(result);
    try {
      await ConfigService.generateConfigFile(activatedTenant);
    } catch (err) {
      console.error(`Failed to generate config for ${body.username}:`, err);
    }

    void AuditService.log({
      tenantId: activatedTenant.id,
      eventType: 'tenant.subscribed',
      eventData: { username: body.username, payer, txId },
      ipAddress: parseClientIp(c.req.header('x-forwarded-for')),
      userAgent: c.req.header('user-agent'),
    });

    return c.json({
      tenant: {
        username: activatedTenant.username,
        subscriptionStatus: activatedTenant.subscriptionStatus,
        subscriptionExpiresAt: activatedTenant.subscriptionExpiresAt,
        blogUrl: TenantService.getBlogUrl(activatedTenant),
      },
      payment: { payer, txId },
    }, 201);
  }
);

// POST /v1/tenants/:username/upgrade - Upgrade to Pro via x402 payment
// Validation runs before paywall so we don't settle payment for invalid requests
tenantRoutes.post('/:username/upgrade',
  async (c, next) => {
    const username = c.req.param('username')!;
    const tenant = await TenantService.getByUsername(username);
    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    if (tenant.subscriptionStatus !== 'active') {
      return c.json({ error: 'Subscription must be active to upgrade' }, 400);
    }
    if (tenant.subscriptionPlan === 'pro') {
      return c.json({ error: 'Already on Pro plan' }, 409);
    }
    await next();
  },
  proUpgradePaywall,
  async (c) => {
    const username = c.req.param('username')!;
    const payer = c.get('payer');
    const txId = c.get('txId');

    if (!payer || typeof payer !== 'string' || !txId || typeof txId !== 'string') {
      return c.json({ error: 'Missing or invalid payer/txId from payment settlement' }, 502);
    }

    const blockNum = c.get('blockNum');
    if (!Number.isInteger(blockNum) || blockNum <= 0) {
      return c.json({ error: 'Missing or invalid block number from payment settlement' }, 502);
    }

    // Payment claim + upgrade inside a DB transaction with row lock
    const result = await db.transaction(async (client) => {
      // Re-check eligibility with row lock to prevent concurrent upgrades
      const tenantRow = await client.query(
        `SELECT id, subscription_status, subscription_plan FROM tenants WHERE username = $1 FOR UPDATE`,
        [username.toLowerCase()]
      );
      if (tenantRow.rowCount === 0) {
        throw Object.assign(new Error('Tenant not found'), { isNotFound: true });
      }
      const tenant = tenantRow.rows[0];
      if (tenant.subscription_status !== 'active') {
        throw Object.assign(new Error('Subscription must be active to upgrade'), { isInactive: true });
      }
      if (tenant.subscription_plan === 'pro') {
        throw Object.assign(new Error('Already on Pro plan'), { isAlreadyPro: true });
      }

      const paymentResult = await client.query(
        `INSERT INTO payments (id, tenant_id, trx_id, block_num, from_account, amount, currency, memo, status, months_credited, processed_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'HBD', $6, 'processed', 0, NOW())
         ON CONFLICT (trx_id) DO NOTHING`,
        [
          tenant.id,
          txId,
          blockNum,
          payer,
          parseFloat(process.env.PRO_UPGRADE_PRICE_HBD || '0.500'),
          `x402:upgrade:${username}`,
        ]
      );

      if (paymentResult.rowCount === 0) {
        throw Object.assign(new Error('Payment already processed'), { isDuplicate: true });
      }

      const upgradedRow = await client.query(
        `UPDATE tenants
         SET subscription_plan = 'pro', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [tenant.id]
      );

      return upgradedRow.rows[0];
    }).catch((err) => {
      if (err.isDuplicate) return 'duplicate';
      if (err.isNotFound) return 'not_found';
      if (err.isInactive) return 'inactive';
      if (err.isAlreadyPro) return 'already_pro';
      throw err;
    });

    if (result === 'not_found') {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    if (result === 'inactive') {
      return c.json({ error: 'Subscription must be active to upgrade' }, 400);
    }
    if (result === 'already_pro') {
      return c.json({ error: 'Already on Pro plan' }, 409);
    }
    if (result === 'duplicate') {
      return c.json({ error: 'Payment already processed' }, 409);
    }

    if (!result) {
      return c.json({ error: 'Payment already processed' }, 409);
    }

    const upgradedTenant = mapTenantFromDb(result);

    void AuditService.log({
      tenantId: upgradedTenant.id,
      eventType: 'tenant.upgraded',
      eventData: { username, plan: 'pro', payer, txId },
      ipAddress: parseClientIp(c.req.header('x-forwarded-for')),
      userAgent: c.req.header('user-agent'),
    });

    return c.json({
      tenant: {
        username: upgradedTenant.username,
        subscriptionPlan: upgradedTenant.subscriptionPlan,
        blogUrl: TenantService.getBlogUrl(upgradedTenant),
      },
      payment: { payer, txId },
    });
  }
);

// PATCH /v1/tenants/:username - Update tenant config (requires auth)
tenantRoutes.patch('/:username', authMiddleware, zValidator('json', updateTenantSchema), async (c) => {
  const username = c.req.param('username');
  const body = c.req.valid('json');
  const authUser = c.get('user');
  
  // Verify user owns this tenant
  if (authUser.username !== username) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  const tenant = await TenantService.getByUsername(username);
  if (!tenant) {
    return c.json({ error: 'Tenant not found' }, 404);
  }
  
  // Update config
  const updatedTenant = await TenantService.updateConfig(username, body.config);
  
  // Regenerate config file
  await ConfigService.generateConfigFile(updatedTenant);
  
  void AuditService.log({
    tenantId: updatedTenant.id,
    eventType: 'tenant.config_updated',
    eventData: { username },
    ipAddress: parseClientIp(c.req.header('x-forwarded-for')),
    userAgent: c.req.header('user-agent'),
  });

  return c.json({
    username: updatedTenant.username,
    config: updatedTenant.config,
    message: 'Configuration updated',
  });
});

// GET /v1/tenants/:username/status - Quick status check
tenantRoutes.get('/:username/status', async (c) => {
  const username = c.req.param('username');
  
  const tenant = await TenantService.getByUsername(username);
  
  if (!tenant) {
    return c.json({ 
      exists: false,
      subscriptionStatus: 'none',
    });
  }
  
  const now = new Date();
  const expiresAt = tenant.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt) : null;
  const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return c.json({
    exists: true,
    subscriptionStatus: tenant.subscriptionStatus,
    subscriptionPlan: tenant.subscriptionPlan,
    daysRemaining,
    customDomain: tenant.customDomain,
    customDomainVerified: tenant.customDomainVerified,
    blogUrl: TenantService.getBlogUrl(tenant),
  });
});

// DELETE /v1/tenants/:username - Delete tenant (requires auth)
tenantRoutes.delete('/:username', authMiddleware, async (c) => {
  const username = c.req.param('username');
  const authUser = c.get('user');

  // Verify user owns this tenant
  if (authUser.username !== username) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Capture tenant ID before deletion for audit trail
  const tenant = await TenantService.getByUsername(username);
  if (!tenant) {
    return c.json({ error: 'Tenant not found' }, 404);
  }

  await TenantService.delete(username);
  await ConfigService.deleteConfigFile(username);

  void AuditService.log({
    tenantId: tenant.id,
    eventType: 'tenant.deleted',
    eventData: { username },
    ipAddress: parseClientIp(c.req.header('x-forwarded-for')),
    userAgent: c.req.header('user-agent'),
  });

  return c.json({ message: 'Tenant deleted' });
});

export default tenantRoutes;
