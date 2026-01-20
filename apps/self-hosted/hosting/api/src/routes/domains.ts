/**
 * Domain Management Routes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { TenantService } from '../services/tenant-service';
import { DomainService } from '../services/domain-service';
import { authMiddleware } from '../middleware/auth';

export const domainRoutes = new Hono();

// Validation schemas
const addDomainSchema = z.object({
  domain: z.string()
    .min(4)
    .max(255)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i, 'Invalid domain format'),
});

// POST /v1/domains - Add custom domain to tenant
domainRoutes.post('/', authMiddleware, zValidator('json', addDomainSchema), async (c) => {
  const { domain } = c.req.valid('json');
  const authUser = c.get('user');
  const username = authUser.username;

  // Get tenant
  const tenant = await TenantService.getByUsername(username);
  if (!tenant) {
    return c.json({ error: 'Tenant not found' }, 404);
  }

  // Check if Pro plan
  if (tenant.subscription_plan !== 'pro') {
    return c.json({ error: 'Custom domains require Pro plan' }, 402);
  }

  // Check if domain is already in use
  const existingTenant = await TenantService.getByDomain(domain);
  if (existingTenant && existingTenant.username !== username) {
    return c.json({ error: 'Domain already in use' }, 409);
  }

  // Set domain and generate verification
  await TenantService.setCustomDomain(username, domain);
  const verification = await DomainService.createVerification(username, domain);

  return c.json({
    domain,
    verification: {
      method: verification.verification_method,
      type: 'CNAME',
      name: verification.verification_token,
      value: username + '.' + (process.env.BASE_DOMAIN || 'blogs.ecency.com'),
      instructions: `Add a CNAME record pointing ${domain} to ${username}.${process.env.BASE_DOMAIN || 'blogs.ecency.com'}`,
      expiresAt: verification.expires_at,
    },
  }, 201);
});

// POST /v1/domains/verify - Verify domain ownership
domainRoutes.post('/verify', authMiddleware, async (c) => {
  const authUser = c.get('user');
  const username = authUser.username;

  // Get tenant
  const tenant = await TenantService.getByUsername(username);
  if (!tenant) {
    return c.json({ error: 'Tenant not found' }, 404);
  }

  if (!tenant.custom_domain) {
    return c.json({ error: 'No custom domain configured' }, 400);
  }

  // Check DNS
  const isVerified = await DomainService.verifyDomain(tenant.custom_domain, username);

  if (!isVerified) {
    return c.json({
      verified: false,
      domain: tenant.custom_domain,
      message: 'DNS verification failed. Please check your CNAME record.',
    });
  }

  // Mark as verified
  await TenantService.verifyCustomDomain(username);
  await DomainService.markVerified(username, tenant.custom_domain);

  return c.json({
    verified: true,
    domain: tenant.custom_domain,
    message: 'Domain verified successfully!',
  });
});

// DELETE /v1/domains - Remove custom domain
domainRoutes.delete('/', authMiddleware, async (c) => {
  const authUser = c.get('user');
  const username = authUser.username;

  try {
    await TenantService.removeCustomDomain(username);
    return c.json({ message: 'Custom domain removed' });
  } catch (error: any) {
    if (error.message === 'Tenant not found') {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    console.error('[Domains] Error removing custom domain:', error);
    return c.json({ error: 'Failed to remove custom domain' }, 500);
  }
});

// GET /v1/domains/check/:domain - Check domain availability
domainRoutes.get('/check/:domain', async (c) => {
  const domain = c.req.param('domain');

  const tenant = await TenantService.getByDomain(domain);

  return c.json({
    domain,
    available: !tenant,
    registeredTo: tenant ? tenant.username : null,
  });
});

export default domainRoutes;
