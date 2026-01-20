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

    try {
      // 1. Check if tenant exists, create if not
      let tenant = await this.getTenant(username);

      if (!tenant) {
        tenant = await this.createTenant(username);
      }

      // 2. Extend subscription
      const newExpiryDate = this.calculateNewExpiry(tenant.subscription_expires_at, months);

      await this.updateTenantSubscription(username, {
        status: 'active',
        expiresAt: newExpiryDate,
      });

      // 3. Generate/update config file
      await this.generateConfigFile(username, tenant.config);

      // 4. Log payment
      await this.logPayment({
        tenantId: tenant.id,
        trxId: transfer.trx_id,
        blockNum: transfer.block_num,
        fromAccount: transfer.from,
        amount,
        currency: 'HBD',
        memo: transfer.memo,
        status: 'processed',
        monthsCredited: months,
        subscriptionExtendedTo: newExpiryDate,
      });

      console.log(`[PaymentListener] Subscription activated for ${username} until ${newExpiryDate}`);
    } catch (error) {
      console.error(`[PaymentListener] Failed to process subscription for ${username}:`, error);
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
      // Upgrade tenant to Pro plan
      await this.updateTenantSubscription(username, {
        plan: 'pro',
      });

      await this.logPayment({
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
    const response = await fetch(CONFIG.HIVE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'condenser_api.get_block',
        params: [blockNum],
        id: 1,
      }),
    });

    const data = await response.json();
    const block = data.result;

    if (!block || !block.transactions) return [];

    const transfers: HiveTransfer[] = [];

    for (const tx of block.transactions) {
      for (const op of tx.operations) {
        if (op[0] === 'transfer' && op[1].to === CONFIG.PAYMENT_ACCOUNT) {
          transfers.push({
            trx_id: tx.transaction_id,
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
    // Write config to /app/configs/{username}.json
    // This is read by nginx to serve the correct config per tenant
    const fs = await import('fs/promises');
    const configPath = `/app/configs/${username}.json`;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`[PaymentListener] Generated config: ${configPath}`);
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
