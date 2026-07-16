/**
 * Ecency Hosting API
 * 
 * Manages multi-tenant blog hosting subscriptions
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { tenantRoutes } from './routes/tenants';
import { domainRoutes } from './routes/domains';
import { paymentRoutes } from './routes/payments';
import { authRoutes } from './routes/auth';
import { internalRoutes } from './routes/internal';
import { db } from './db/client';
import { TenantService } from './services/tenant-service';
import { ConfigService } from './services/config-service';
import {
  isVerifiedDomainOrigin,
  refreshVerifiedDomainOrigins,
  startVerifiedDomainRefresh,
} from './utils/cors-domains';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', secureHeaders());
const baseDomain = process.env.BASE_DOMAIN || 'blogs.ecency.com';
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'https://ecency.com',
      'https://alpha.ecency.com',
      `https://${baseDomain}`,
      'http://localhost:3000',
    ];
    if (allowed.includes(origin)) return origin;
    // Allow any subdomain of the base domain (tenant blogs)
    if (origin.endsWith(`.${baseDomain}`) && origin.startsWith('https://')) return origin;
    // Verified custom domains are tenant sites too (cached set, refreshed from the DB)
    if (origin.startsWith('https://') && isVerifiedDomainOrigin(origin)) return origin;
    return null;
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-payment'],
  exposeHeaders: ['x-payment', 'x-payment-response'],
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.route('/v1/tenants', tenantRoutes);
app.route('/v1/domains', domainRoutes);
app.route('/v1/payments', paymentRoutes);
app.route('/v1/auth', authRoutes);
// Service-to-service only (shared-secret guarded); mounted at its own /v1/internal prefix.
app.route('/v1/internal', internalRoutes);

// Error handling
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Start server
const port = parseInt(process.env.PORT || '3001', 10);

console.log(`Ecency Hosting API starting on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};

// Warm the verified custom-domain CORS set before accepting requests, so a restart can't
// briefly deny valid custom-domain origins. Bounded: a slow or down DB must not block
// startup (health checks would loop the container); the periodic refresh catches up.
await Promise.race([
  refreshVerifiedDomainOrigins(),
  new Promise((resolve) => setTimeout(resolve, 3000)),
]);

// For node environments
if (typeof (globalThis as any).Bun === 'undefined') {
  const { serve } = await import('@hono/node-server');
  serve({ fetch: app.fetch, port });
  console.log(`Ecency Hosting API running on http://localhost:${port}`);
}

// Keep the verified custom-domain CORS set fresh.
startVerifiedDomainRefresh();

// Regenerate every active tenant's served config file at startup so config-shape changes
// (e.g. the injected managed flag) roll out on deploy without waiting for a tenant update.
// Non-fatal: a failed sync must not take the API down.
void (async () => {
  try {
    const tenants = await TenantService.getActiveTenants();
    await ConfigService.syncAllConfigs(tenants);
  } catch (e) {
    console.error('[Startup] config sync failed:', (e as Error).message);
  }
})();
