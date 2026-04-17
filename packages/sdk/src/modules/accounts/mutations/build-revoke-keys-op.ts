import { PublicKey } from "../../../hive-tx";
import type { Authority } from "../../../hive-tx";
import { FullAccount } from "../types";

/**
 * Check whether an authority would still meet its weight_threshold
 * after removing the given keys. This prevents revoking keys that
 * would leave an authority unable to sign (especially for multisig).
 */
export function canRevokeFromAuthority(
  auth: Authority,
  revokingKeyStrs: Set<string>
): boolean {
  const remainingWeight = auth.key_auths
    .filter(([key]) => !revokingKeyStrs.has(String(key)))
    .reduce((sum, [, weight]) => sum + weight, 0);

  // account_auths also contribute weight
  const accountWeight = (auth.account_auths ?? []).reduce(
    (sum: number, [, weight]: [string, number]) => sum + weight,
    0
  );

  return (remainingWeight + accountWeight) >= auth.weight_threshold;
}

/**
 * Build an account_update operation that removes the given public keys
 * from the relevant authorities.
 *
 * Only includes the `owner` field when a revoking key actually exists
 * in the owner authority - omitting it allows active-level signing.
 *
 * Returns the operation payload (without the "account_update" tag) so
 * callers can wrap it as needed for their broadcast method.
 */
export function buildRevokeKeysOp(
  accountData: FullAccount,
  revokingKeys: PublicKey[]
) {
  const revokingKeyStrs = new Set(revokingKeys.map((k) => k.toString()));

  const hasAnyKeyInAuth = (auth: Authority) =>
    auth.key_auths.some(
      ([key]: [string | PublicKey, number]) => revokingKeyStrs.has(String(key))
    );

  const prepareAuth = (auth: Authority): Authority => {
    const clone: Authority = JSON.parse(JSON.stringify(auth));
    clone.key_auths = clone.key_auths.filter(
      ([key]) => !revokingKeyStrs.has(key.toString())
    );
    return clone;
  };

  const needsOwnerUpdate = hasAnyKeyInAuth(accountData.owner);

  return {
    account: accountData.name,
    json_metadata: accountData.json_metadata,
    owner: needsOwnerUpdate ? prepareAuth(accountData.owner) : undefined,
    active: prepareAuth(accountData.active),
    posting: prepareAuth(accountData.posting),
    memo_key: accountData.memo_key
  };
}
