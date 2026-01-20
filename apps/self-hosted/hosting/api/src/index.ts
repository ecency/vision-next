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
import { db } from './db/client';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: ['https://ecency.com', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.route('/v1/tenants', tenantRoutes);
app.route('/v1/domains', domainRoutes);
app.route('/v1/payments', paymentRoutes);
app.route('/v1/auth', authRoutes);

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

// For node environments
if (typeof Bun === 'undefined') {
  const { serve } = await import('@hono/node-server');
  serve({ fetch: app.fetch, port });
  console.log(`Ecency Hosting API running on http://localhost:${port}`);
}
