# Session Security Implementation

## Overview

This application now uses **cryptographically signed session tokens** for server-side authentication and authorization. This prevents session forgery and ensures that only legitimate users can perform privileged operations.

## Security Architecture

### Problem (Before)
- Client-side cookie (`active_user`) was a plain username string
- Set by JavaScript using `js-cookie` library
- Anyone could forge the cookie: `document.cookie = "active_user=anyusername"`
- Server-side operations trusted this unverified cookie
- **Critical vulnerability**: Users could impersonate others for server operations

### Solution (After)
- **Signed Session Tokens**: HMAC-SHA256 signature prevents forgery
- **HttpOnly Cookies**: Cannot be accessed or modified by JavaScript
- **Secure Flag**: Only transmitted over HTTPS in production
- **SameSite Protection**: Prevents CSRF attacks
- **Stateless Verification**: No database needed, signature is self-contained

## Implementation Details

### Session Token Format
```
username.timestamp.signature
```

Where:
- `username`: The authenticated user
- `timestamp`: Unix timestamp in milliseconds
- `signature`: HMAC-SHA256(username + timestamp, SECRET)

Example:
```
alice.1704067200000.a3f2b9c1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Files Created/Modified

**New Files:**
- `apps/web/src/utils/session.ts` - Session token creation and verification
- `apps/web/src/app/actions/set-session.ts` - Server Action to set signed cookies
- `apps/web/SESSION_SECURITY.md` - This documentation

**Modified Files:**
- `apps/web/src/core/global-store/modules/authentication-module.ts` - Calls Server Action on login
- `apps/web/src/app/actions/revalidate-entry.ts` - Verifies signed session
- `apps/web/src/app/api/revalidate-entry/route.ts` - Added error logging

## Environment Variables

### Required

**SESSION_SECRET** (or **NEXTAUTH_SECRET**)
- **Purpose**: Secret key for HMAC signature of session tokens
- **Format**: 64-character hexadecimal string (32 bytes)
- **Security**: MUST be secret, MUST be random, MUST be unique per environment

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output:
```
a1b2c3d4e5f6789012345678901234567890123456789012345678901234
```

Add to `.env` or `.env.local`:
```bash
SESSION_SECRET=your-generated-secret-here
```

### Optional

**REVALIDATE_SECRET**
- **Purpose**: Secret for API-based revalidation (external services)
- **Format**: Any secure random string
- **Note**: Only needed if using `/api/revalidate-entry` endpoint

## Usage

### Authentication Flow

1. **User logs in** (via HiveSigner, Keychain, or HiveAuth)
   ```typescript
   // Client-side: User proves they have blockchain keys
   const user = await authenticateWithHive(username);

   // Store in Zustand and localStorage
   setActiveUser(username);
   ```

2. **Server Action sets signed session**
   ```typescript
   // authentication-module.ts automatically calls:
   await setSessionCookie(username);

   // Server creates:
   // 1. Signed session token (HttpOnly, Secure, SameSite)
   // 2. Legacy cookie for backward compatibility
   ```

3. **Server operations verify session**
   ```typescript
   // Any Server Action requiring auth:
   const username = await getSessionUser();

   // Returns null if:
   // - No session cookie
   // - Invalid signature
   // - Expired timestamp
   // - Otherwise returns verified username
   ```

### Example: Revalidation Action

```typescript
export async function revalidateEntryAction(author: string, permlink: string) {
  // Verify cryptographically signed session
  const authenticatedUsername = await getSessionUser();

  if (!authenticatedUsername) {
    return { success: false, error: "Invalid session" };
  }

  // Check authorization (user must be author)
  if (authenticatedUsername !== author) {
    return { success: false, error: "Unauthorized" };
  }

  // Authorized - perform operation
  revalidatePath(`/@${author}/${permlink}`);
}
```

## Security Properties

### What This Prevents

✅ **Session Forgery**
- Attacker cannot create valid session tokens without the secret
- HMAC signature ensures integrity

✅ **XSS Attacks**
- HttpOnly flag prevents JavaScript access
- Even if XSS exists, cannot steal session token

✅ **CSRF Attacks**
- SameSite=Lax prevents cross-site requests
- Session cookie not sent from malicious sites

✅ **Replay Attacks (Partial)**
- Timestamp allows expiration checking
- Tokens expire after 365 days

✅ **Impersonation**
- Users cannot perform operations as other users
- Each operation verifies the session signature

### What This Does NOT Prevent

❌ **Stolen Cookies**
- If attacker gets physical access to browser/cookies, session can be stolen
- Mitigation: Use short session lifetimes, IP binding, device fingerprinting (not implemented)

❌ **Man-in-the-Middle**
- If HTTPS is compromised, session can be intercepted
- Mitigation: Ensure Secure flag is set (implemented for production)

❌ **Session Fixation**
- Attacker could set session ID before user logs in
- Mitigation: Regenerate session on login (not implemented)

## Migration Notes

### Backward Compatibility

The implementation maintains **backward compatibility**:

1. **Legacy Cookie**: `active_user` cookie still set (client-readable)
   - Used by client-side code for UI state
   - **NOT trusted for authorization**

2. **New Cookie**: `session_token` cookie added (HttpOnly)
   - Used by server-side operations
   - **Cryptographically verified**

### Existing Code

Most existing code continues to work:
- Client-side authentication unchanged
- UI state management unchanged
- Only server-side authorization is enhanced

### Migration Steps for Other Server Actions

If you have other Server Actions requiring authentication:

```typescript
// Before (INSECURE - do not use):
const cookieStore = await cookies();
const username = cookieStore.get(ACTIVE_USER_COOKIE_NAME)?.value;
// ❌ Anyone can forge this cookie!

// After (SECURE):
import { getSessionUser } from "@/app/actions/set-session";
const username = await getSessionUser();
// ✅ Cryptographically verified
```

## Testing

### Verify Session Security

1. **Check session cookie is HttpOnly:**
   ```bash
   # Open browser DevTools → Application → Cookies
   # session_token should have HttpOnly: true
   ```

2. **Try to access session token in console:**
   ```javascript
   document.cookie
   // Should NOT contain session_token
   ```

3. **Verify signature validation:**
   ```typescript
   // Try forging a token
   const fakeToken = "attacker.1234567890.fakesignature";
   const username = verifySessionToken(fakeToken);
   // Should return null
   ```

4. **Test authorization:**
   ```typescript
   // Try revalidating another user's post
   const result = await revalidateEntryAction("otheruser", "post");
   // Should return { success: false, error: "Unauthorized" }
   ```

## Production Checklist

Before deploying to production:

- [ ] Set `SESSION_SECRET` environment variable (64-char hex string)
- [ ] Verify `SESSION_SECRET` is different for dev/staging/production
- [ ] Confirm `Secure` flag is enabled (check `NODE_ENV === "production"`)
- [ ] Test session creation on login
- [ ] Test session verification in Server Actions
- [ ] Monitor logs for "Invalid session signature" warnings
- [ ] Set up alerts for suspicious authorization attempts

## Troubleshooting

### "SESSION_SECRET not set" Warning

**Symptom:** Console warning on server startup

**Solution:**
```bash
# Generate a secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env.local (development) or environment variables (production)
SESSION_SECRET=generated-secret-here
```

### "Invalid session signature detected"

**Symptom:** Users logged out unexpectedly

**Possible causes:**
1. `SESSION_SECRET` was changed (invalidates all sessions)
2. Clock skew between servers (timestamp mismatch)
3. Actual attack attempt

**Solution:**
- Don't change `SESSION_SECRET` in production
- Sync server clocks
- Monitor for attack patterns

### Sessions expire too quickly

**Symptom:** Users need to re-login frequently

**Solution:**
Increase `SESSION_MAX_AGE` in `apps/web/src/utils/session.ts`:
```typescript
const SESSION_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // Current: 365 days
```

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Next.js Server Actions Security](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security)
- [HMAC Signature Verification](https://en.wikipedia.org/wiki/HMAC)
