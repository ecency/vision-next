/**
 * Tenant Management Routes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client';
import { TenantService } from '../services/tenant-service';
import { ConfigService } from '../services/config-service';
import { authMiddleware } from '../middleware/auth';

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
    subscriptionStatus: tenant.subscription_status,
    subscriptionPlan: tenant.subscription_plan,
    subscriptionExpiresAt: tenant.subscription_expires_at,
    customDomain: tenant.custom_domain,
    customDomainVerified: tenant.custom_domain_verified,
    blogUrl: TenantService.getBlogUrl(tenant),
    createdAt: tenant.created_at,
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
  if (tenant.subscription_status !== 'active') {
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
  const monthlyPrice = process.env.MONTHLY_PRICE_HBD || '1.000';
  
  return c.json({
    tenant: {
      username: tenant.username,
      subscriptionStatus: tenant.subscription_status,
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
  const expiresAt = tenant.subscription_expires_at ? new Date(tenant.subscription_expires_at) : null;
  const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  
  return c.json({
    exists: true,
    subscriptionStatus: tenant.subscription_status,
    subscriptionPlan: tenant.subscription_plan,
    daysRemaining,
    customDomain: tenant.custom_domain,
    customDomainVerified: tenant.custom_domain_verified,
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
  
  await TenantService.delete(username);
  await ConfigService.deleteConfigFile(username);
  
  return c.json({ message: 'Tenant deleted' });
});

export default tenantRoutes;
