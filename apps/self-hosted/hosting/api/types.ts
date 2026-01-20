/**
 * Ecency Hosting API - Type Definitions
 */

// =============================================================================
// Tenant Types
// =============================================================================

export interface Tenant {
  id: string;
  username: string; // Hive username, also used as subdomain
  
  // Subscription
  subscriptionStatus: 'inactive' | 'active' | 'expired' | 'suspended';
  subscriptionPlan: 'standard' | 'pro';
  subscriptionStartedAt: Date | null;
  subscriptionExpiresAt: Date | null;
  
  // Custom domain (Pro only)
  customDomain: string | null;
  customDomainVerified: boolean;
  customDomainVerifiedAt: Date | null;
  
  // Blog configuration
  config: BlogConfig;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogConfig {
  version: number;
  configuration: {
    general: {
      theme: 'light' | 'dark' | 'system';
      styleTemplate: 'medium' | 'minimal' | 'magazine' | 'developer' | 'modern-gradient';
      language: string;
      imageProxy: string;
      profileBaseUrl: string;
      createPostUrl: string;
      styles?: {
        background?: string;
      };
    };
    instanceConfiguration: {
      type: 'blog' | 'community';
      username: string;
      communityId?: string;
      meta: {
        title: string;
        description: string;
        logo?: string;
        favicon?: string;
        keywords?: string;
      };
      layout: {
        listType: 'list' | 'grid';
        sidebar: {
          placement: 'left' | 'right';
          followers?: { enabled: boolean };
          following?: { enabled: boolean };
          hiveInformation?: { enabled: boolean };
        };
      };
      features: {
        postsFilters?: string[];
        likes?: { enabled: boolean };
        comments?: { enabled: boolean };
        post?: { text2Speech?: { enabled: boolean } };
        auth?: {
          enabled: boolean;
          methods: ('keychain' | 'hivesigner' | 'hiveauth')[];
        };
      };
    };
  };
}

// =============================================================================
// Payment Types
// =============================================================================

export interface Payment {
  id: string;
  tenantId: string;
  
  // Hive transaction
  trxId: string;
  blockNum: number;
  fromAccount: string;
  amount: number;
  currency: 'HBD' | 'HIVE';
  memo: string | null;
  
  // Processing
  status: 'pending' | 'processed' | 'failed' | 'refunded';
  processedAt: Date | null;
  
  // Subscription extension
  monthsCredited: number;
  subscriptionExtendedTo: Date | null;
  
  createdAt: Date;
}

export interface HiveTransfer {
  trx_id: string;
  block_num: number;
  from: string;
  to: string;
  amount: string; // "1.000 HBD"
  memo: string;
  timestamp: string;
}

// =============================================================================
// Domain Verification Types
// =============================================================================

export interface DomainVerification {
  id: string;
  tenantId: string;
  domain: string;
  verificationToken: string;
  verificationMethod: 'cname' | 'txt';
  verified: boolean;
  verifiedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

// Database row type (snake_case)
export interface DomainVerificationRow {
  id: string;
  tenant_id: string;
  domain: string;
  verification_token: string;
  verification_method: 'cname' | 'txt';
  verified: boolean;
  verified_at: string | null;
  expires_at: string;
  created_at: string;
}

/**
 * Convert database row (snake_case) to DomainVerification (camelCase)
 */
export function mapDomainVerificationFromDb(row: DomainVerificationRow): DomainVerification {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    domain: row.domain,
    verificationToken: row.verification_token,
    verificationMethod: row.verification_method,
    verified: row.verified,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
  };
}

/**
 * Convert DomainVerification (camelCase) to database fields (snake_case)
 * For use in INSERT/UPDATE queries
 */
export function mapDomainVerificationToDb(verification: Partial<DomainVerification>): Record<string, any> {
  const result: Record<string, any> = {};

  if (verification.tenantId !== undefined) result.tenant_id = verification.tenantId;
  if (verification.domain !== undefined) result.domain = verification.domain;
  if (verification.verificationToken !== undefined) result.verification_token = verification.verificationToken;
  if (verification.verificationMethod !== undefined) result.verification_method = verification.verificationMethod;
  if (verification.verified !== undefined) result.verified = verification.verified;
  if (verification.verifiedAt !== undefined) result.verified_at = verification.verifiedAt;
  if (verification.expiresAt !== undefined) result.expires_at = verification.expiresAt;

  return result;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

// POST /v1/tenants - Create new tenant
export interface CreateTenantRequest {
  username: string;
  config?: Partial<BlogConfig>;
}

export interface CreateTenantResponse {
  tenant: Tenant;
  paymentInstructions: {
    to: string;
    amount: string;
    memo: string;
  };
}

// PATCH /v1/tenants/:username - Update tenant config
export interface UpdateTenantRequest {
  config?: Partial<BlogConfig>;
  customDomain?: string;
}

// GET /v1/tenants/:username/status
export interface TenantStatusResponse {
  username: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  daysRemaining: number | null;
  customDomain: string | null;
  customDomainVerified: boolean;
  blogUrl: string;
}

// POST /v1/domains/verify - Initiate domain verification
export interface VerifyDomainRequest {
  domain: string;
}

export interface VerifyDomainResponse {
  domain: string;
  verificationMethod: 'cname' | 'txt';
  verificationToken: string;
  instructions: string;
  expiresAt: Date;
}

// GET /v1/auth/tenant-lookup - Traefik middleware for custom domain lookup
export interface TenantLookupResponse {
  tenantId: string;
  username: string;
}

// =============================================================================
// Payment Memo Format
// =============================================================================

/**
 * Payment memo format:
 * - "blog:username" - Pay for username's blog
 * - "blog:username:months" - Pay for specific months (e.g., "blog:alice:12")
 * - "upgrade:username" - Upgrade to Pro plan
 * 
 * Examples:
 * - "blog:alice" - 1 month standard for alice
 * - "blog:bob:6" - 6 months standard for bob
 * - "upgrade:alice" - Upgrade alice to Pro
 */
export interface ParsedMemo {
  action: 'blog' | 'upgrade' | 'unknown';
  username: string;
  months: number;
}

export function parseMemo(memo: string): ParsedMemo {
  const parts = memo.trim().toLowerCase().split(':');

  // Trim username and validate it's not empty/whitespace-only
  const username = parts[1]?.trim() || '';

  if (parts[0] === 'blog' && username !== '') {
    // Trim months string before parsing to avoid whitespace issues
    const monthsStr = parts[2]?.trim() || '1';
    const months = parseInt(monthsStr, 10) || 1;
    return {
      action: 'blog',
      username,
      months,
    };
  }

  if (parts[0] === 'upgrade' && username !== '') {
    return {
      action: 'upgrade',
      username,
      months: 1,
    };
  }

  return {
    action: 'unknown',
    username: '',
    months: 0,
  };
}
