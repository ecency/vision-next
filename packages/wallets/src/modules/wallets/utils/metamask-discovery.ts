import { EcencyWalletCurrency } from "@/modules/wallets/enums";

export type WalletAddressMap = Partial<Record<EcencyWalletCurrency, string>>;

/** Chain prefixes we look for in Wallet Standard accounts */
const CHAIN_PREFIX_MAP: Record<string, EcencyWalletCurrency> = {
  "solana:": EcencyWalletCurrency.SOL,
  "bip122:": EcencyWalletCurrency.BTC
};

const HIVE_SNAP_ID = "npm:@hiveio/metamask-snap";

export interface HivePublicKey {
  publicKey: string;
  role?: string;
  accountIndex: number;
  addressIndex: number;
}

/**
 * Fetch non-EVM addresses from MetaMask via the Wallet Standard protocol.
 *
 * MetaMask registers non-EVM wallets (Solana, Bitcoin) as separate Wallet Standard
 * wallets — they are NOT accessible through window.ethereum (EVM-only provider).
 */
export async function fetchMultichainAddresses(): Promise<WalletAddressMap> {
  const addresses: WalletAddressMap = {};

  try {
    const { getWallets } = await import("@wallet-standard/app");
    const walletsApi = getWallets();
    const wallets = walletsApi.get();

    const mmWallet = wallets.find(
      (w: any) =>
        w.name.toLowerCase().includes("metamask") &&
        w.features["standard:connect"]
    );

    if (!mmWallet) return addresses;

    const connectFeature = mmWallet.features["standard:connect"] as any;
    await connectFeature.connect();

    const accounts = mmWallet.accounts ?? [];

    for (const account of accounts) {
      if (!account.address || !Array.isArray(account.chains)) continue;

      for (const [prefix, currency] of Object.entries(CHAIN_PREFIX_MAP)) {
        if (addresses[currency]) continue;
        if (account.chains.some((c: string) => c.startsWith(prefix))) {
          addresses[currency] = account.address;
        }
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.log("[MetaMask multichain] wallet standard discovery failed:", e);
    }
  }

  return addresses;
}

/**
 * Fetch the EVM address from MetaMask via window.ethereum.
 * Returns the first connected account address.
 */
export async function fetchEvmAddress(): Promise<string | undefined> {
  if (!window.ethereum?.isMetaMask) return undefined;

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts"
  });

  return accounts?.[0] ?? undefined;
}

/**
 * Discover all wallet addresses from MetaMask (EVM + non-EVM).
 * Returns a map of currency -> address.
 */
export async function discoverMetaMaskWallets(): Promise<WalletAddressMap> {
  const addresses: WalletAddressMap = {};

  // EVM address (shared for ETH + BNB)
  const evmAddress = await fetchEvmAddress();
  if (evmAddress) {
    addresses[EcencyWalletCurrency.ETH] = evmAddress;
    addresses[EcencyWalletCurrency.BNB] = evmAddress;
  }

  // Non-EVM addresses via Wallet Standard
  const multichainAddresses = await fetchMultichainAddresses();
  Object.assign(addresses, multichainAddresses);

  return addresses;
}

/**
 * Install the Hive Snap in MetaMask.
 */
export async function installHiveSnap(): Promise<void> {
  await window.ethereum!.request({
    method: "wallet_requestSnaps",
    params: { [HIVE_SNAP_ID]: {} }
  });
}

/**
 * Get Hive public keys from the MetaMask Hive Snap.
 * Returns owner, active, posting, and memo public keys.
 */
export async function getHivePublicKeys(): Promise<HivePublicKey[]> {
  const result = await window.ethereum!.request({
    method: "wallet_invokeSnap",
    params: {
      snapId: HIVE_SNAP_ID,
      request: {
        method: "hive_getPublicKeys",
        params: {
          keys: [
            { role: "owner", accountIndex: 0 },
            { role: "active", accountIndex: 0 },
            { role: "posting", accountIndex: 0 },
            { role: "memo", accountIndex: 0 }
          ]
        }
      }
    }
  });
  return (result as { publicKeys: HivePublicKey[] }).publicKeys;
}
