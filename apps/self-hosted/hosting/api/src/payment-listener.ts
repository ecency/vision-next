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

// Configuration
const CONFIG = {
  PAYMENT_ACCOUNT: process.env.PAYMENT_ACCOUNT || 'ecency.hosting',
  MONTHLY_PRICE_HBD: parseFloat(process.env.MONTHLY_PRICE_HBD || '1.000'),
  PRO_UPGRADE_PRICE_HBD: parseFloat(process.env.PRO_UPGRADE_PRICE_HBD || '3.000'),
  HIVE_API_NODES: (process.env.HIVE_API_URL || 'https://api.hive.blog').split(','),
  POLL_INTERVAL_MS: 3000, // 3 seconds (1 block)
};

const hiveClient = new Client(CONFIG.HIVE_API_NODES);

interface ParsedMemo {
  action: 'blog' | 'upgrade' | 'unknown';
  username: string;
  months: number;
}

function parseMemo(memo: string): ParsedMemo {
  const parts = memo.trim().toLowerCase().split(':');

  if (parts[0] === 'blog' && parts[1]) {
    return {
      action: 'blog',
      username: parts[1],
      months: parseInt(parts[2] || '1', 10) || 1,
    };
  }

  if (parts[0] === 'upgrade' && parts[1]) {
    return {
      action: 'upgrade',
      username: parts[1],
      months: 1,
    };
  }

  return {
    action: 'unknown',
    username: '',
    months: 0,
  };
}

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

    for (const tx of block.transactions) {
      for (const op of tx.operations) {
        if (op[0] === 'transfer' && op[1].to === CONFIG.PAYMENT_ACCOUNT) {
          await this.processTransfer({
            trxId: tx.transaction_id,
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

    // Calculate months based on amount - only credit what was actually paid
    const monthsFromAmount = Math.floor(amount / CONFIG.MONTHLY_PRICE_HBD);

    if (monthsFromAmount < 1) {
      console.log('[PaymentListener] Insufficient amount:', amount, 'HBD for', parsed.username);
      await this.logPayment(transfer, amount, 'failed', 0, null, 'Insufficient amount');
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

    // Process based on action
    if (parsed.action === 'blog') {
      await this.processSubscription(transfer, parsed.username, months, amount);
    } else if (parsed.action === 'upgrade') {
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

    try {
      // Check if tenant exists, create if not
      let tenant = await TenantService.getByUsername(username);

      if (!tenant) {
        // Verify Hive account exists
        const accountExists = await TenantService.verifyHiveAccount(username);
        if (!accountExists) {
          console.log('[PaymentListener] Hive account not found:', username);
          await this.logPayment(transfer, amount, 'failed', 0, null, 'Hive account not found');
          return;
        }

        tenant = await TenantService.create(username);
        console.log('[PaymentListener] Created new tenant:', username);
      }

      // Activate/extend subscription
      const updatedTenant = await TenantService.activateSubscription(username, months);

      // Generate config file
      await ConfigService.generateConfigFile(updatedTenant);

      // Log successful payment
      await this.logPayment(
        transfer,
        amount,
        'processed',
        months,
        updatedTenant.subscription_expires_at
      );

      console.log(
        '[PaymentListener] Subscription activated for',
        username,
        'until',
        updatedTenant.subscription_expires_at
      );
    } catch (error) {
      console.error('[PaymentListener] Failed to process subscription for', username, error);
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
