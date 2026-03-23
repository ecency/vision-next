const SOL_EXPLORER_URL = "https://explorer.solana.com/tx/";
const LAMPORTS_PER_SOL = 1_000_000_000;

export function getSolExplorerUrl(signature: string) {
  return `${SOL_EXPLORER_URL}${signature}`;
}

export function parseToLamports(amount: string): number {
  const [whole = "0", fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(9, "0").slice(0, 9);
  return Number(whole) * LAMPORTS_PER_SOL + Number(paddedFraction);
}

export function formatLamports(lamports: number, decimals = 6): string {
  const sol = lamports / LAMPORTS_PER_SOL;
  return sol.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
}

async function getMetaMaskSolanaWallet(): Promise<any> {
  const { getWallets } = await import("@wallet-standard/app");
  const walletsApi = getWallets();
  const wallets = walletsApi.get();

  const mmWallet = wallets.find(
    (w) =>
      w.name.toLowerCase().includes("metamask") &&
      w.features["standard:connect"]
  );

  if (!mmWallet) {
    throw new Error("MetaMask Solana wallet not found. Enable Solana in MetaMask settings.");
  }

  return mmWallet;
}

export async function sendSolTransfer(
  to: string,
  amountSol: string
): Promise<string> {
  const mmWallet = await getMetaMaskSolanaWallet();

  // Connect to get accounts
  const connectFeature = mmWallet.features["standard:connect"] as any;
  await connectFeature.connect();

  const solAccount = mmWallet.accounts?.find(
    (acc: any) => acc.chains?.some((c: string) => c.startsWith("solana:"))
  );

  if (!solAccount) {
    throw new Error("No Solana account found in MetaMask.");
  }

  // Use @solana/web3.js for transaction building (dynamic import to avoid bundle bloat)
  const { Connection, PublicKey, SystemProgram, Transaction } = await import("@solana/web3.js");

  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
  const fromPubkey = new PublicKey(solAccount.address);
  const toPubkey = new PublicKey(to);
  const lamports = parseToLamports(amountSol);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  // Serialize the transaction for signing via Wallet Standard
  const serializedTx = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false
  });

  const signAndSendFeature = mmWallet.features["solana:signAndSendTransaction"] as any;
  if (!signAndSendFeature) {
    throw new Error("MetaMask does not support Solana transaction signing. Please update MetaMask.");
  }

  const [result] = await signAndSendFeature.signAndSendTransaction({
    account: solAccount,
    transaction: serializedTx,
    chain: "solana:mainnet"
  });

  // Result contains the signature — either a string or Uint8Array
  if (typeof result.signature === "string") {
    return result.signature;
  }

  // Encode Uint8Array to base58 (standard Solana signature format)
  const { base58 } = await import("@scure/base");
  return base58.encode(new Uint8Array(result.signature));
}
