/**
 * Ecency Hosting - HBD Payment Listener
 * 
 * Monitors the Hive blockchain for HBD transfers to the hosting account
 * and processes subscription payments automatically.
 */

import { parseMemo, type HiveTransfer, type ParsedMemo } from './types';

// Configuration
const CONFIG = {
  PAYMENT_ACCOUNT: process.env.PAYMENT_ACCOUNT || 'ecency.hosting',
  MONTHLY_PRICE_HBD: parseFloat(process.env.MONTHLY_PRICE_HBD || '1.000'),
  PRO_UPGRADE_PRICE_HBD: parseFloat(process.env.PRO_UPGRADE_PRICE_HBD || '3.000'),
  HIVE_API_URL: process.env.HIVE_API_URL || 'https://api.hive.blog',
  POLL_INTERVAL_MS: 3000, // 3 seconds (1 block)
};

/**
 * Payment Listener Service
 * 
 * Flow:
 * 1. Poll Hive blockchain for new blocks
 * 2. Filter transfers to PAYMENT_ACCOUNT
 * 3. Parse memo to extract username and action
 * 4. Validate payment amount
 * 5. Process subscription (create/extend/upgrade)
 * 6. Write config file for the tenant
 * 7. Log to database
 */
class PaymentListener {
  private lastProcessedBlock: number = 0;
  private isRunning: boolean = false;

  async start() {
    console.log(`[PaymentListener] Starting...`);
    console.log(`[PaymentListener] Monitoring account: ${CONFIG.PAYMENT_ACCOUNT}`);
    console.log(`[PaymentListener] Monthly price: ${CONFIG.MONTHLY_PRICE_HBD} HBD`);
    
    // Get current head block
    this.lastProcessedBlock = await this.getHeadBlockNumber();
    console.log(`[PaymentListener] Starting from block: ${this.lastProcessedBlock}`);
    
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
    
    while (this.lastProcessedBlock < headBlock) {
      const blockNum = this.lastProcessedBlock + 1;
      const transfers = await this.getTransfersInBlock(blockNum);
      
      for (const transfer of transfers) {
        await this.processTransfer(transfer);
      }
      
      this.lastProcessedBlock = blockNum;
    }
  }

  private async processTransfer(transfer: HiveTransfer) {
    console.log(`[PaymentListener] Processing transfer: ${transfer.trx_id}`);
    
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
      // TODO: Consider refunding or notifying user
      return;
    }
    
    // Calculate months based on amount
    const monthsFromAmount = Math.floor(amount / CONFIG.MONTHLY_PRICE_HBD);
    const months = Math.max(parsed.months, monthsFromAmount);
    
    if (months < 1) {
      console.log(`[PaymentListener] Insufficient amount: ${amount} HBD for ${parsed.username}`);
      // TODO: Refund or credit partial amount
      return;
    }
    
    // Process based on action
    if (parsed.action === 'blog') {
      await this.processSubscription(transfer, parsed.username, months);
    } else if (parsed.action === 'upgrade') {
      await this.processUpgrade(transfer, parsed.username);
    }
  }

  private async processSubscription(
    transfer: HiveTransfer,
    username: string,
    months: number
  ) {
    console.log(`[PaymentListener] Processing subscription: ${username} for ${months} months`);
    
    try {
      // 1. Check if tenant exists, create if not
      let tenant = await this.getTenant(username);
      
      if (!tenant) {
        tenant = await this.createTenant(username);
      }
      
      // 2. Extend subscription
      const newExpiryDate = this.calculateNewExpiry(
        tenant.subscriptionExpiresAt,
        months
      );
      
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
        amount: parseFloat(transfer.amount.split(' ')[0]),
        currency: 'HBD',
        memo: transfer.memo,
        monthsCredited: months,
        subscriptionExtendedTo: newExpiryDate,
      });
      
      console.log(`[PaymentListener] Subscription activated for ${username} until ${newExpiryDate}`);
      
      // 5. Send notification (optional)
      // await this.notifyUser(username, 'subscription_activated', { months, expiresAt: newExpiryDate });
      
    } catch (error) {
      console.error(`[PaymentListener] Failed to process subscription for ${username}:`, error);
      // TODO: Handle errors, possibly refund
    }
  }

  private async processUpgrade(transfer: HiveTransfer, username: string) {
    console.log(`[PaymentListener] Processing upgrade: ${username}`);
    
    const amount = parseFloat(transfer.amount.split(' ')[0]);
    
    if (amount < CONFIG.PRO_UPGRADE_PRICE_HBD) {
      console.log(`[PaymentListener] Insufficient amount for upgrade: ${amount} HBD`);
      return;
    }
    
    // Upgrade tenant to Pro plan
    await this.updateTenantSubscription(username, {
      plan: 'pro',
    });
    
    console.log(`[PaymentListener] Upgraded ${username} to Pro plan`);
  }

  private calculateNewExpiry(currentExpiry: Date | null, months: number): Date {
    const now = new Date();
    const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(base);
    newExpiry.setMonth(newExpiry.getMonth() + months);
    return newExpiry;
  }

  // ==========================================================================
  // Hive API Methods (implement with your preferred Hive library)
  // ==========================================================================

  private async getHeadBlockNumber(): Promise<number> {
    // TODO: Implement with @hiveio/dhive or fetch
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
    // TODO: Implement - get block and filter for transfers to PAYMENT_ACCOUNT
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
  // Database Methods (implement with your preferred ORM/driver)
  // ==========================================================================

  private async getTenant(username: string): Promise<any> {
    // TODO: Implement database query
    throw new Error('Not implemented');
  }

  private async createTenant(username: string): Promise<any> {
    // TODO: Implement database insert
    throw new Error('Not implemented');
  }

  private async updateTenantSubscription(
    username: string,
    update: { status?: string; expiresAt?: Date; plan?: string }
  ): Promise<void> {
    // TODO: Implement database update
    throw new Error('Not implemented');
  }

  private async logPayment(payment: any): Promise<void> {
    // TODO: Implement database insert
    throw new Error('Not implemented');
  }

  private async generateConfigFile(username: string, config: any): Promise<void> {
    // Write config to /app/configs/{username}.json
    // This is read by nginx to serve the correct config per tenant
    const fs = await import('fs/promises');
    const configPath = `/app/configs/${username}.json`;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`[PaymentListener] Generated config: ${configPath}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the listener
const listener = new PaymentListener();
listener.start();

// Handle graceful shutdown
process.on('SIGTERM', () => listener.stop());
process.on('SIGINT', () => listener.stop());
