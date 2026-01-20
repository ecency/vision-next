/**
 * Ecency Hosting - HBD Payment Listener
 *
 * Monitors the Hive blockchain for HBD transfers to the hosting account
 * and processes subscription payments automatically.
 */

import { Client } from '@hiveio/dhive';
import { db } from './db/client';
import { TenantService } from './services/tenant-service';
import { ConfigService } from './services/config-service';
import { parseMemo, type ParsedMemo } from '../types';

// Configuration
const CONFIG = {
  PAYMENT_ACCOUNT: process.env.PAYMENT_ACCOUNT || 'ecency.hosting',
  MONTHLY_PRICE_HBD: parseFloat(process.env.MONTHLY_PRICE_HBD || '1.000'),
  PRO_UPGRADE_PRICE_HBD: parseFloat(process.env.PRO_UPGRADE_PRICE_HBD || '3.000'),
  HIVE_API_NODES: (process.env.HIVE_API_URL || 'https://api.hive.blog').split(','),
  POLL_INTERVAL_MS: 3000, // 3 seconds (1 block)
};

const hiveClient = new Client(CONFIG.HIVE_API_NODES);

class PaymentListener {
  private lastProcessedBlock: number = 0;
  private isRunning: boolean = false;
  private expirationIntervalId: ReturnType<typeof setInterval> | null = null;

  async start() {
    console.log('[PaymentListener] Starting...');
    console.log('[PaymentListener] Monitoring account:', CONFIG.PAYMENT_ACCOUNT);
    console.log('[PaymentListener] Monthly price:', CONFIG.MONTHLY_PRICE_HBD, 'HBD');

    // Get last processed block from DB or use head block minus backfill window
    const lastBlock = await this.getLastProcessedBlock();
    if (lastBlock !== null) {
      this.lastProcessedBlock = lastBlock;
      console.log('[PaymentListener] Resuming from saved block:', this.lastProcessedBlock);
    } else {
      // Start from head block minus some blocks to backfill recent transactions
      const headBlock = await this.getHeadBlockNumber();
      const backfillBlocks = 100; // ~5 minutes of blocks
      this.lastProcessedBlock = Math.max(0, headBlock - backfillBlocks);
      console.log('[PaymentListener] No saved block, starting from:', this.lastProcessedBlock);
    }

    this.isRunning = true;
    this.pollLoop();

    // Also run subscription expiry check periodically
    this.expirationIntervalId = setInterval(() => this.checkExpirations(), 60 * 60 * 1000); // Every hour
  }

  async stop() {
    // Clear the expiration check interval
    if (this.expirationIntervalId !== null) {
      clearInterval(this.expirationIntervalId);
      this.expirationIntervalId = null;
    }
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

    // Process up to 100 blocks at a time to catch up
    const maxBlocks = Math.min(headBlock - this.lastProcessedBlock, 100);

    for (let i = 0; i < maxBlocks; i++) {
      const blockNum = this.lastProcessedBlock + 1;

      try {
        await this.processBlock(blockNum);
        this.lastProcessedBlock = blockNum;
        await this.saveLastProcessedBlock(blockNum);
      } catch (error) {
        console.error('[PaymentListener] Error processing block', blockNum, error);
        break; // Stop and retry this block next iteration
      }
    }
  }

  private async processBlock(blockNum: number) {
    const block = await hiveClient.database.getBlock(blockNum);
    if (!block || !block.transactions) return;

    // transaction_ids array contains the IDs - tx.transaction_id is undefined
    const transactionIds = (block as any).transaction_ids as string[] | undefined;

    for (let txIndex = 0; txIndex < block.transactions.length; txIndex++) {
      const tx = block.transactions[txIndex];
      const trxId = transactionIds?.[txIndex];

      // Skip if no trx_id available
      if (!trxId) {
        console.log(`[PaymentListener] Missing trx_id for tx at index ${txIndex} in block ${blockNum}`);
        continue;
      }

      for (const op of tx.operations) {
        if (op[0] === 'transfer' && op[1].to === CONFIG.PAYMENT_ACCOUNT) {
          await this.processTransfer({
            trxId,
            blockNum,
            from: op[1].from,
            to: op[1].to,
            amount: op[1].amount,
            memo: op[1].memo,
            timestamp: block.timestamp,
          });
        }
      }
    }
  }

  private async processTransfer(transfer: {
    trxId: string;
    blockNum: number;
    from: string;
    to: string;
    amount: string;
    memo: string;
    timestamp: string;
  }) {
    console.log('[PaymentListener] Processing transfer:', transfer.trxId);

    // Check if already processed
    const existing = await db.queryOne(
      'SELECT id FROM payments WHERE trx_id = $1',
      [transfer.trxId]
    );
    if (existing) {
      console.log('[PaymentListener] Transfer already processed:', transfer.trxId);
      return;
    }

    // Parse amount
    const [amountStr, currency] = transfer.amount.split(' ');
    const amount = parseFloat(amountStr);

    // Only accept HBD
    if (currency !== 'HBD') {
      console.log('[PaymentListener] Ignoring non-HBD transfer:', transfer.amount);
      return;
    }

    // Parse memo
    const parsed = parseMemo(transfer.memo);

    if (parsed.action === 'unknown') {
      console.log('[PaymentListener] Unknown memo format:', transfer.memo);
      await this.logPayment(transfer, amount, 'failed', 0, null, 'Invalid memo format');
      return;
    }

    // Process based on action
    if (parsed.action === 'blog') {
      // For blog subscriptions: validate monthly payment
      const monthsFromAmount = Math.floor(amount / CONFIG.MONTHLY_PRICE_HBD);

      if (monthsFromAmount < 1) {
        console.log('[PaymentListener] Insufficient amount:', amount, 'HBD for', parsed.username);
        await this.logPayment(transfer, amount, 'failed', 0, null, 'Insufficient amount for subscription');
        return;
      }

      // If user requested more months than they paid for, reject
      if (parsed.months > monthsFromAmount) {
        console.log(
          '[PaymentListener] Requested months exceed payment:',
          parsed.months,
          'requested but only',
          monthsFromAmount,
          'paid for',
          parsed.username
        );
        await this.logPayment(
          transfer,
          amount,
          'failed',
          0,
          null,
          `Requested ${parsed.months} months but only paid for ${monthsFromAmount}`
        );
        return;
      }

      // Grant only the months that were paid for
      const months = monthsFromAmount;
      await this.processSubscription(transfer, parsed.username, months, amount);
    } else if (parsed.action === 'upgrade') {
      // For upgrades: validate against pro upgrade price, not monthly price
      if (amount < CONFIG.PRO_UPGRADE_PRICE_HBD) {
        console.log('[PaymentListener] Insufficient amount for upgrade:', amount, 'HBD');
        await this.logPayment(
          transfer,
          amount,
          'failed',
          0,
          null,
          `Insufficient amount for Pro upgrade (need ${CONFIG.PRO_UPGRADE_PRICE_HBD} HBD)`
        );
        return;
      }
      await this.processUpgrade(transfer, parsed.username, amount);
    }
  }

  private async processSubscription(
    transfer: any,
    username: string,
    months: number,
    amount: number
  ) {
    console.log('[PaymentListener] Processing subscription:', username, 'for', months, 'months');

    let updatedTenant: any = null;

    try {
      // Use transaction to ensure atomicity of payment insert and subscription update
      await db.transaction(async (client) => {
        // 1. Insert payment with 'processing' status first (serves as dedup via unique trx_id)
        const insertResult = await client.query(
          `INSERT INTO payments
           (tenant_id, trx_id, block_num, from_account, amount, currency, memo, status, months_credited)
           VALUES (NULL, $1, $2, $3, $4, 'HBD', $5, 'processing', $6)
           ON CONFLICT (trx_id) DO NOTHING
           RETURNING id`,
          [transfer.trxId, transfer.blockNum, transfer.from, amount, transfer.memo, months]
        );

        // If no row returned, trx_id already exists (duplicate)
        if (insertResult.rows.length === 0) {
          console.log('[PaymentListener] Duplicate transaction detected:', transfer.trxId);
          return;
        }

        const paymentId = insertResult.rows[0].id;

        // 2. Check if tenant exists, create if not
        let tenant = await TenantService.getByUsername(username);

        if (!tenant) {
          // Verify Hive account exists
          const accountExists = await TenantService.verifyHiveAccount(username);
          if (!accountExists) {
            // Update payment to failed status
            await client.query(
              `UPDATE payments SET status = 'failed' WHERE id = $1`,
              [paymentId]
            );
            throw new Error('Hive account not found');
          }

          tenant = await TenantService.create(username);
          console.log('[PaymentListener] Created new tenant:', username);
        }

        // 3. Activate/extend subscription
        updatedTenant = await TenantService.activateSubscription(username, months);

        // 4. Update payment to 'processed' with tenant_id and subscription info
        await client.query(
          `UPDATE payments
           SET tenant_id = $2, status = 'processed', subscription_extended_to = $3
           WHERE id = $1`,
          [paymentId, updatedTenant.id, updatedTenant.subscription_expires_at]
        );

        console.log(
          '[PaymentListener] Subscription activated for',
          username,
          'until',
          updatedTenant.subscription_expires_at
        );
      });

      // 5. Generate config file AFTER transaction commits successfully
      if (updatedTenant) {
        await ConfigService.generateConfigFile(updatedTenant);
      }
    } catch (error) {
      console.error('[PaymentListener] Failed to process subscription for', username, error);
      // Log failure (may fail if trx_id already exists, which is fine)
      await this.logPayment(transfer, amount, 'failed', 0, null, String(error));
    }
  }

  private async processUpgrade(transfer: any, username: string, amount: number) {
    console.log('[PaymentListener] Processing upgrade:', username);

    if (amount < CONFIG.PRO_UPGRADE_PRICE_HBD) {
      console.log('[PaymentListener] Insufficient amount for upgrade:', amount, 'HBD');
      await this.logPayment(transfer, amount, 'failed', 0, null, 'Insufficient for upgrade');
      return;
    }

    try {
      const tenant = await TenantService.getByUsername(username);
      if (!tenant) {
        console.log('[PaymentListener] Tenant not found for upgrade:', username);
        await this.logPayment(transfer, amount, 'failed', 0, null, 'Tenant not found');
        return;
      }

      await TenantService.upgradeToPro(username);
      await this.logPayment(transfer, amount, 'processed', 0, null, 'Upgraded to Pro');

      console.log('[PaymentListener] Upgraded', username, 'to Pro plan');
    } catch (error) {
      console.error('[PaymentListener] Failed to process upgrade for', username, error);
      await this.logPayment(transfer, amount, 'failed', 0, null, String(error));
    }
  }

  private async logPayment(
    transfer: any,
    amount: number,
    status: string,
    monthsCredited: number,
    subscriptionExtendedTo: Date | null,
    note?: string
  ) {
    const tenant = await TenantService.getByUsername(
      parseMemo(transfer.memo).username
    );

    await db.query(
      `INSERT INTO payments
       (tenant_id, trx_id, block_num, from_account, amount, currency, memo, status, months_credited, subscription_extended_to)
       VALUES ($1, $2, $3, $4, $5, 'HBD', $6, $7, $8, $9)
       ON CONFLICT (trx_id) DO NOTHING`,
      [
        tenant?.id || null,
        transfer.trxId,
        transfer.blockNum,
        transfer.from,
        amount,
        transfer.memo,
        status,
        monthsCredited,
        subscriptionExtendedTo,
      ]
    );
  }

  private async checkExpirations() {
    console.log('[PaymentListener] Checking subscription expirations...');
    const expired = await TenantService.expireSubscriptions();
    if (expired > 0) {
      console.log('[PaymentListener] Expired', expired, 'subscriptions');
    }
  }

  private async getHeadBlockNumber(): Promise<number> {
    const props = await hiveClient.database.getDynamicGlobalProperties();
    return props.head_block_number;
  }

  private async getLastProcessedBlock(): Promise<number | null> {
    try {
      const result = await db.queryOne<{ value: string }>(
        "SELECT value FROM system_config WHERE key = 'payment_listener.last_block'"
      );
      if (result && result.value) {
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
      throw error; // Re-throw to prevent block from being marked as processed
    }
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
