/**
 * Ecency Hosting - HBD Payment Listener
 *
 * Monitors the Hive blockchain for HBD transfers to the hosting account
 * and processes subscription payments automatically.
 *
 * NOTE: This is the standalone version. For production use with full
 * database integration, use src/payment-listener.ts instead.
 */

import { parseMemo, type HiveTransfer } from './types';

// Configuration
const CONFIG = {
  PAYMENT_ACCOUNT: process.env.PAYMENT_ACCOUNT || 'ecency.hosting',
  MONTHLY_PRICE_HBD: parseFloat(process.env.MONTHLY_PRICE_HBD || '1.000'),
  PRO_UPGRADE_PRICE_HBD: parseFloat(process.env.PRO_UPGRADE_PRICE_HBD || '3.000'),
  HIVE_API_URL: process.env.HIVE_API_URL || 'https://api.hive.blog',
  DATABASE_URL: process.env.DATABASE_URL || '',
  POLL_INTERVAL_MS: 3000, // 3 seconds (1 block)
  BACKFILL_BLOCKS: 100, // How many blocks to backfill on startup if no saved cursor
};

// Simple PostgreSQL client (use pg package)
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: CONFIG.DATABASE_URL,
  max: 5,
});

const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  queryOne: async <T = any>(text: string, params?: any[]): Promise<T | null> => {
    const result = await pool.query<T>(text, params);
    return result.rows[0] || null;
  },
  transaction: async <T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
};

/**
 * Payment Listener Service
 *
 * Flow:
 * 1. Load last processed block from DB (or start from head - N for backfill)
 * 2. Poll Hive blockchain for new blocks
 * 3. Filter transfers to PAYMENT_ACCOUNT
 * 4. Check for duplicate trx_id to avoid double-processing
 * 5. Parse memo to extract username and action
 * 6. Validate payment amount (only grant paid months, not requested)
 * 7. Process subscription (create/extend/upgrade)
 * 8. Write config file for the tenant
 * 9. Log to database
 * 10. Save last processed block
 */
class PaymentListener {
  private lastProcessedBlock: number = 0;
  private isRunning: boolean = false;

  async start() {
    console.log(`[PaymentListener] Starting...`);
    console.log(`[PaymentListener] Monitoring account: ${CONFIG.PAYMENT_ACCOUNT}`);
    console.log(`[PaymentListener] Monthly price: ${CONFIG.MONTHLY_PRICE_HBD} HBD`);

    // Load last processed block from DB
    const savedBlock = await this.getLastProcessedBlock();
    if (savedBlock !== null) {
      this.lastProcessedBlock = savedBlock;
      console.log(`[PaymentListener] Resuming from saved block: ${this.lastProcessedBlock}`);
    } else {
      // No saved cursor - start from head minus backfill window
      const headBlock = await this.getHeadBlockNumber();
      this.lastProcessedBlock = Math.max(0, headBlock - CONFIG.BACKFILL_BLOCKS);
      console.log(`[PaymentListener] No saved block, backfilling from: ${this.lastProcessedBlock}`);
    }

    this.isRunning = true;
    this.pollLoop();
  }

  async stop() {
    this.isRunning = false;
    console.log('[PaymentListener] Stopped');
  }

  private async pollLoop() {
    while (this.isRunning) {
      try {
        await this.processNewBlocks();
      } catch (error) {
        console.error('[PaymentListener] Error processing blocks:', error);
      }

      await this.sleep(CONFIG.POLL_INTERVAL_MS);
    }
  }

  private async processNewBlocks() {
    const headBlock = await this.getHeadBlockNumber();

    // Process up to 100 blocks at a time
    const maxBlocks = Math.min(headBlock - this.lastProcessedBlock, 100);

    for (let i = 0; i < maxBlocks; i++) {
      const blockNum = this.lastProcessedBlock + 1;

      try {
        const transfers = await this.getTransfersInBlock(blockNum);

        for (const transfer of transfers) {
          await this.processTransfer(transfer);
        }

        // Only update after successful processing
        this.lastProcessedBlock = blockNum;
        await this.saveLastProcessedBlock(blockNum);
      } catch (error) {
        console.error(`[PaymentListener] Error processing block ${blockNum}:`, error);
        break; // Stop and retry this block next iteration
      }
    }
  }

  private async processTransfer(transfer: HiveTransfer) {
    console.log(`[PaymentListener] Processing transfer: ${transfer.trx_id}`);

    // De-duplication: Check if already processed
    const existing = await db.queryOne(
      'SELECT id FROM payments WHERE trx_id = $1',
      [transfer.trx_id]
    );
    if (existing) {
      console.log(`[PaymentListener] Transfer already processed: ${transfer.trx_id}`);
      return;
    }

    // Parse amount
    const [amountStr, currency] = transfer.amount.split(' ');
    const amount = parseFloat(amountStr);

    // Only accept HBD
    if (currency !== 'HBD') {
      console.log(`[PaymentListener] Ignoring non-HBD transfer: ${transfer.amount}`);
      return;
    }

    // Parse memo
    const parsed = parseMemo(transfer.memo);

    if (parsed.action === 'unknown') {
      console.log(`[PaymentListener] Unknown memo format: ${transfer.memo}`);
      await this.logPayment({
        trxId: transfer.trx_id,
        blockNum: transfer.block_num,
        fromAccount: transfer.from,
        amount,
        currency: 'HBD',
        memo: transfer.memo,
        status: 'failed',
        monthsCredited: 0,
        note: 'Invalid memo format',
      });
      return;
    }

    // Calculate months based on amount - only credit what was actually paid
    const monthsFromAmount = Math.floor(amount / CONFIG.MONTHLY_PRICE_HBD);

    if (monthsFromAmount < 1) {
      console.log(`[PaymentListener] Insufficient amount: ${amount} HBD for ${parsed.username}`);
      await this.logPayment({
        trxId: transfer.trx_id,
        blockNum: transfer.block_num,
        fromAccount: transfer.from,
        amount,
        currency: 'HBD',
        memo: transfer.memo,
        status: 'failed',
        monthsCredited: 0,
        note: 'Insufficient amount',
      });
      return;
    }

    // If user requested more months than they paid for, reject
    if (parsed.months > monthsFromAmount) {
      console.log(
        `[PaymentListener] Requested months (${parsed.months}) exceed paid months (${monthsFromAmount}) for ${parsed.username}`
      );
      await this.logPayment({
        trxId: transfer.trx_id,
        blockNum: transfer.block_num,
        fromAccount: transfer.from,
        amount,
        currency: 'HBD',
        memo: transfer.memo,
        status: 'failed',
        monthsCredited: 0,
        note: `Requested ${parsed.months} months but only paid for ${monthsFromAmount}`,
      });
      return;
    }

    // Grant only the months that were paid for
    const months = monthsFromAmount;

    // Process based on action
    if (parsed.action === 'blog') {
      await this.processSubscription(transfer, parsed.username, months, amount);
    } else if (parsed.action === 'upgrade') {
      await this.processUpgrade(transfer, parsed.username, amount);
    }
  }

  private async processSubscription(
    transfer: HiveTransfer,
    username: string,
    months: number,
    amount: number
  ) {
    console.log(`[PaymentListener] Processing subscription: ${username} for ${months} months`);

    // Validate username format (Hive username rules)
    if (!this.isValidHiveUsername(username)) {
      console.log(`[PaymentListener] Invalid username format: ${username}`);
      await this.logPayment({
        trxId: transfer.trx_id,
        blockNum: transfer.block_num,
        fromAccount: transfer.from,
        amount,
        currency: 'HBD',
        memo: transfer.memo,
        status: 'failed',
        monthsCredited: 0,
        note: 'Invalid username format',
      });
      return;
    }

    try {
      // Use transaction to ensure atomicity of subscription update and payment log
      await db.transaction(async (client) => {
        // 1. Insert payment row first with status='processing' to claim the trx_id
        // This serves as dedup - if insert fails due to unique constraint, abort
        const insertResult = await client.query(
          `INSERT INTO payments
           (tenant_id, trx_id, block_num, from_account, amount, currency, memo, status, months_credited)
           VALUES (NULL, $1, $2, $3, $4, 'HBD', $5, 'processing', $6)
           ON CONFLICT (trx_id) DO NOTHING
           RETURNING id`,
          [transfer.trx_id, transfer.block_num, transfer.from, amount, transfer.memo, months]
        );

        // If no row returned, trx_id already exists (duplicate)
        if (insertResult.rows.length === 0) {
          console.log(`[PaymentListener] Duplicate transaction detected: ${transfer.trx_id}`);
          return; // Exit transaction, no error
        }

        const paymentId = insertResult.rows[0].id;

        // 2. Check if tenant exists, create if not
        let tenantResult = await client.query(
          'SELECT * FROM tenants WHERE username = $1',
          [username.toLowerCase()]
        );
        let tenant = tenantResult.rows[0];

        if (!tenant) {
          const defaultConfig = this.getDefaultConfig(username);
          const createResult = await client.query(
            `INSERT INTO tenants (username, config, subscription_status, subscription_plan)
             VALUES ($1, $2, 'inactive', 'standard')
             RETURNING *`,
            [username.toLowerCase(), JSON.stringify(defaultConfig)]
          );
          tenant = createResult.rows[0];
        }

        // 3. Calculate and update subscription
        const newExpiryDate = this.calculateNewExpiry(tenant.subscription_expires_at, months);

        await client.query(
          `UPDATE tenants
           SET subscription_status = 'active',
               subscription_expires_at = $2,
               subscription_started_at = COALESCE(subscription_started_at, NOW()),
               updated_at = NOW()
           WHERE username = $1`,
          [username.toLowerCase(), newExpiryDate]
        );

        // 4. Update payment row to 'processed' with tenant_id and subscription info
        await client.query(
          `UPDATE payments
           SET tenant_id = $2, status = 'processed', subscription_extended_to = $3
           WHERE id = $1`,
          [paymentId, tenant.id, newExpiryDate]
        );

        console.log(`[PaymentListener] Subscription activated for ${username} until ${newExpiryDate}`);

        // 5. Generate config file AFTER transaction commits (outside try block)
        // Store config for post-commit generation
        (this as any)._pendingConfigGeneration = { username, config: tenant.config };
      });

      // Generate config file after transaction commits successfully
      if ((this as any)._pendingConfigGeneration) {
        const { username: cfgUsername, config } = (this as any)._pendingConfigGeneration;
        delete (this as any)._pendingConfigGeneration;
        await this.generateConfigFile(cfgUsername, config);
      }
    } catch (error) {
      console.error(`[PaymentListener] Failed to process subscription for ${username}:`, error);
      // Log failure (may fail if trx_id already exists, which is fine)
      await this.logPayment({
        trxId: transfer.trx_id,
        blockNum: transfer.block_num,
        fromAccount: transfer.from,
        amount,
        currency: 'HBD',
        memo: transfer.memo,
        status: 'failed',
        monthsCredited: 0,
        note: String(error),
      });
    }
  }

  private async processUpgrade(transfer: HiveTransfer, username: string, amount: number) {
    console.log(`[PaymentListener] Processing upgrade: ${username}`);

    // Validate username format
    if (!this.isValidHiveUsername(username)) {
      console.log(`[PaymentListener] Invalid username format: ${username}`);
      await this.logPayment({
        trxId: transfer.trx_id,
        blockNum: transfer.block_num,
        fromAccount: transfer.from,
        amount,
        currency: 'HBD',
        memo: transfer.memo,
        status: 'failed',
        monthsCredited: 0,
        note: 'Invalid username format',
      });
      return;
    }

    if (amount < CONFIG.PRO_UPGRADE_PRICE_HBD) {
      console.log(`[PaymentListener] Insufficient amount for upgrade: ${amount} HBD`);
      await this.logPayment({
        trxId: transfer.trx_id,
        blockNum: transfer.block_num,
        fromAccount: transfer.from,
        amount,
        currency: 'HBD',
        memo: transfer.memo,
        status: 'failed',
        monthsCredited: 0,
        note: 'Insufficient amount for upgrade',
      });
      return;
    }

    try {
      // Check tenant exists before upgrading
      const tenant = await this.getTenant(username);
      if (!tenant) {
        console.log(`[PaymentListener] Tenant not found for upgrade: ${username}`);
        await this.logPayment({
          trxId: transfer.trx_id,
          blockNum: transfer.block_num,
          fromAccount: transfer.from,
          amount,
          currency: 'HBD',
          memo: transfer.memo,
          status: 'failed',
          monthsCredited: 0,
          note: 'Tenant not found - create subscription first before upgrading',
        });
        return;
      }

      // Upgrade tenant to Pro plan
      await this.updateTenantSubscription(username, {
        plan: 'pro',
      });

      await this.logPayment({
        tenantId: tenant.id,
        trxId: transfer.trx_id,
        blockNum: transfer.block_num,
        fromAccount: transfer.from,
        amount,
        currency: 'HBD',
        memo: transfer.memo,
        status: 'processed',
        monthsCredited: 0,
        note: 'Upgraded to Pro',
      });

      console.log(`[PaymentListener] Upgraded ${username} to Pro plan`);
    } catch (error) {
      console.error(`[PaymentListener] Failed to upgrade ${username}:`, error);
      await this.logPayment({
        trxId: transfer.trx_id,
        blockNum: transfer.block_num,
        fromAccount: transfer.from,
        amount,
        currency: 'HBD',
        memo: transfer.memo,
        status: 'failed',
        monthsCredited: 0,
        note: String(error),
      });
    }
  }

  private calculateNewExpiry(currentExpiry: Date | string | null, months: number): Date {
    const now = new Date();
    const expiry = currentExpiry ? new Date(currentExpiry) : now;
    const base = expiry > now ? expiry : now;
    const newExpiry = new Date(base);
    newExpiry.setMonth(newExpiry.getMonth() + months);
    return newExpiry;
  }

  // ==========================================================================
  // Hive API Methods
  // ==========================================================================

  private async getHeadBlockNumber(): Promise<number> {
    const response = await fetch(CONFIG.HIVE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'condenser_api.get_dynamic_global_properties',
        params: [],
        id: 1,
      }),
    });

    const data = await response.json();
    return data.result.head_block_number;
  }

  private async getTransfersInBlock(blockNum: number): Promise<HiveTransfer[]> {
    // Use block_api.get_block (AppBase) instead of legacy condenser_api.get_block
    const response = await fetch(CONFIG.HIVE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'block_api.get_block',
        params: { block_num: blockNum },
        id: 1,
      }),
    });

    const data = await response.json();

    // AppBase wraps the block in data.result.block
    const block = data.result?.block;

    // Defensive checks for the new response shape
    if (!block) {
      console.log(`[PaymentListener] No block returned for block ${blockNum}`);
      return [];
    }

    if (!block.transactions || !Array.isArray(block.transactions)) {
      return [];
    }

    if (!block.transaction_ids || !Array.isArray(block.transaction_ids)) {
      console.log(`[PaymentListener] No transaction_ids in block ${blockNum}`);
      return [];
    }

    const transfers: HiveTransfer[] = [];

    // Use index to get trx_id from block.transaction_ids array
    for (let txIndex = 0; txIndex < block.transactions.length; txIndex++) {
      const tx = block.transactions[txIndex];
      const trxId = block.transaction_ids[txIndex];

      // Skip if no trx_id available
      if (!trxId) {
        console.log(`[PaymentListener] Missing trx_id for tx at index ${txIndex} in block ${blockNum}`);
        continue;
      }

      if (!tx.operations || !Array.isArray(tx.operations)) {
        continue;
      }

      for (const op of tx.operations) {
        if (op[0] === 'transfer' && op[1].to === CONFIG.PAYMENT_ACCOUNT) {
          transfers.push({
            trx_id: trxId,
            block_num: blockNum,
            from: op[1].from,
            to: op[1].to,
            amount: op[1].amount,
            memo: op[1].memo,
            timestamp: block.timestamp,
          });
        }
      }
    }

    return transfers;
  }

  // ==========================================================================
  // Database Methods - Implemented with PostgreSQL
  // ==========================================================================

  private async getTenant(username: string): Promise<any> {
    return db.queryOne(
      'SELECT * FROM tenants WHERE username = $1',
      [username.toLowerCase()]
    );
  }

  private async createTenant(username: string): Promise<any> {
    const defaultConfig = this.getDefaultConfig(username);

    const result = await db.queryOne(
      `INSERT INTO tenants (username, config, subscription_status, subscription_plan)
       VALUES ($1, $2, 'inactive', 'standard')
       RETURNING *`,
      [username.toLowerCase(), JSON.stringify(defaultConfig)]
    );

    return result;
  }

  private async updateTenantSubscription(
    username: string,
    update: { status?: string; expiresAt?: Date; plan?: string }
  ): Promise<void> {
    const sets: string[] = ['updated_at = NOW()'];
    const params: any[] = [];
    let paramIndex = 1;

    if (update.status) {
      sets.push(`subscription_status = $${paramIndex++}`);
      params.push(update.status);
    }
    if (update.expiresAt) {
      sets.push(`subscription_expires_at = $${paramIndex++}`);
      params.push(update.expiresAt);
      // Also set started_at if this is first activation
      sets.push(
        `subscription_started_at = COALESCE(subscription_started_at, $${paramIndex++})`
      );
      params.push(new Date());
    }
    if (update.plan) {
      sets.push(`subscription_plan = $${paramIndex++}`);
      params.push(update.plan);
    }

    params.push(username.toLowerCase());

    await db.query(
      `UPDATE tenants SET ${sets.join(', ')} WHERE username = $${paramIndex}`,
      params
    );
  }

  private async logPayment(payment: {
    tenantId?: string;
    trxId: string;
    blockNum: number;
    fromAccount: string;
    amount: number;
    currency: string;
    memo: string;
    status: string;
    monthsCredited: number;
    subscriptionExtendedTo?: Date;
    note?: string;
  }): Promise<void> {
    // Get tenant ID if not provided
    let tenantId = payment.tenantId;
    if (!tenantId) {
      const parsed = parseMemo(payment.memo);
      if (parsed.username) {
        const tenant = await this.getTenant(parsed.username);
        tenantId = tenant?.id;
      }
    }

    await db.query(
      `INSERT INTO payments
       (tenant_id, trx_id, block_num, from_account, amount, currency, memo, status, months_credited, subscription_extended_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (trx_id) DO NOTHING`,
      [
        tenantId || null,
        payment.trxId,
        payment.blockNum,
        payment.fromAccount,
        payment.amount,
        payment.currency,
        payment.memo,
        payment.status,
        payment.monthsCredited,
        payment.subscriptionExtendedTo || null,
      ]
    );
  }

  private async getLastProcessedBlock(): Promise<number | null> {
    try {
      const result = await db.queryOne<{ value: string }>(
        "SELECT value FROM system_config WHERE key = 'payment_listener.last_block'"
      );
      if (result?.value) {
        const blockNum = parseInt(result.value, 10);
        if (!isNaN(blockNum) && blockNum > 0) {
          return blockNum;
        }
      }
      return null;
    } catch (error) {
      console.error('[PaymentListener] Error loading last processed block:', error);
      return null;
    }
  }

  private async saveLastProcessedBlock(blockNum: number): Promise<void> {
    try {
      await db.query(
        `INSERT INTO system_config (key, value, updated_at)
         VALUES ('payment_listener.last_block', $1, NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = $1, updated_at = NOW()`,
        [blockNum.toString()]
      );
    } catch (error) {
      console.error('[PaymentListener] Error saving last processed block:', error);
      throw error;
    }
  }

  private async generateConfigFile(username: string, config: any): Promise<void> {
    // Validate and sanitize username to prevent path traversal
    if (!this.isValidHiveUsername(username)) {
      throw new Error(`Invalid username for config generation: ${username}`);
    }

    // Sanitized username (already validated, just lowercase and alphanumeric + dots/dashes)
    const safeUsername = username.toLowerCase();

    // Use path.join to construct path safely within fixed configs directory
    const path = await import('path');
    const fs = await import('fs/promises');
    const configsDir = '/app/configs';
    const configPath = path.join(configsDir, `${safeUsername}.json`);

    // Verify the resolved path is still within configsDir (defense in depth)
    const resolvedPath = path.resolve(configPath);
    const resolvedConfigsDir = path.resolve(configsDir);
    if (!resolvedPath.startsWith(resolvedConfigsDir + path.sep)) {
      throw new Error(`Path traversal attempt detected: ${username}`);
    }

    await fs.writeFile(resolvedPath, JSON.stringify(config, null, 2));
    console.log(`[PaymentListener] Generated config: ${resolvedPath}`);
  }

  /**
   * Validate Hive username format
   * Rules: 3-16 characters, lowercase letters, numbers, dots, and dashes
   * Cannot start/end with dot or dash, no consecutive dots/dashes
   */
  private isValidHiveUsername(username: string): boolean {
    if (!username || typeof username !== 'string') return false;
    if (username.length < 3 || username.length > 16) return false;

    // Hive username regex: lowercase letters, numbers, dots, dashes
    // Must start with letter, cannot end with dot/dash
    const hiveUsernameRegex = /^[a-z][a-z0-9.-]*[a-z0-9]$|^[a-z]{3}$/;
    if (!hiveUsernameRegex.test(username.toLowerCase())) return false;

    // No consecutive dots or dashes
    if (/[.-]{2}/.test(username)) return false;

    return true;
  }

  private getDefaultConfig(username: string): any {
    return {
      version: 1,
      configuration: {
        general: {
          theme: 'system',
          styleTemplate: 'medium',
          language: 'en',
          imageProxy: 'https://images.ecency.com',
          profileBaseUrl: 'https://ecency.com/@',
          createPostUrl: 'https://ecency.com/submit',
        },
        instanceConfiguration: {
          type: 'blog',
          username: username,
          meta: {
            title: `${username}'s Blog`,
            description: 'A blog powered by Hive blockchain',
            favicon: 'https://ecency.com/favicon.ico',
          },
          layout: {
            listType: 'list',
            sidebar: {
              placement: 'right',
              followers: { enabled: true },
              following: { enabled: true },
              hiveInformation: { enabled: true },
            },
          },
          features: {
            postsFilters: ['posts', 'blog'],
            likes: { enabled: true },
            comments: { enabled: true },
            post: { text2Speech: { enabled: true } },
            auth: {
              enabled: true,
              methods: ['keychain', 'hivesigner', 'hiveauth'],
            },
          },
        },
      },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Start the listener
const listener = new PaymentListener();
listener.start();

// Handle graceful shutdown
process.on('SIGTERM', () => listener.stop());
process.on('SIGINT', () => listener.stop());
