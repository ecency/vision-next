import { EcencyWalletCurrency } from "@/modules/wallets/enums";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<any>;
    };
  }
}

const EVM_CHAIN_CONFIG: Record<string, { chainId: string; name: string; rpcUrl: string; explorerUrl: string }> = {
  [EcencyWalletCurrency.ETH]: {
    chainId: "0x1",
    name: "Ethereum Mainnet",
    rpcUrl: "https://rpc.ankr.com/eth",
    explorerUrl: "https://etherscan.io/tx/"
  },
  [EcencyWalletCurrency.BNB]: {
    chainId: "0x38",
    name: "BNB Smart Chain",
    rpcUrl: "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com/tx/"
  }
};

export function getEvmChainConfig(currency: EcencyWalletCurrency) {
  const config = EVM_CHAIN_CONFIG[currency];
  if (!config) throw new Error(`Unsupported EVM currency: ${currency}`);
  return config;
}

export function getEvmExplorerUrl(currency: EcencyWalletCurrency, txHash: string) {
  return `${getEvmChainConfig(currency).explorerUrl}${txHash}`;
}

export async function ensureEvmChain(currency: EcencyWalletCurrency): Promise<void> {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const { chainId, name, rpcUrl } = getEvmChainConfig(currency);
  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

  if (currentChainId === chainId) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }]
    });
  } catch (err: any) {
    // Chain not added — add it
    if (err?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId,
          chainName: name,
          rpcUrls: [rpcUrl],
          nativeCurrency: {
            name: currency === EcencyWalletCurrency.ETH ? "Ether" : "BNB",
            symbol: currency === EcencyWalletCurrency.ETH ? "ETH" : "BNB",
            decimals: 18
          }
        }]
      });
    } else {
      throw err;
    }
  }
}

export async function estimateEvmGas(
  from: string,
  to: string,
  valueHex: string,
  currency: EcencyWalletCurrency
): Promise<{ gasLimit: string; gasPrice: string; estimatedFeeWei: bigint }> {
  if (!window.ethereum) throw new Error("MetaMask not found");

  await ensureEvmChain(currency);

  const [gasLimit, gasPrice] = await Promise.all([
    window.ethereum.request({
      method: "eth_estimateGas",
      params: [{ from, to, value: valueHex }]
    }),
    window.ethereum.request({ method: "eth_gasPrice" })
  ]);

  const estimatedFeeWei = BigInt(gasLimit) * BigInt(gasPrice);

  return { gasLimit, gasPrice, estimatedFeeWei };
}

export function formatWei(wei: bigint, decimals = 6): string {
  const eth = Number(wei) / 1e18;
  return eth.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "");
}

export function parseToWei(amount: string): string {
  const [whole = "0", fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(18, "0").slice(0, 18);
  const wei = BigInt(whole) * BigInt(10 ** 18) + BigInt(paddedFraction);
  return "0x" + wei.toString(16);
}

export async function sendEvmTransfer(
  to: string,
  amountWei: string,
  currency: EcencyWalletCurrency
): Promise<string> {
  if (!window.ethereum) throw new Error("MetaMask not found");

  await ensureEvmChain(currency);

  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const from = accounts[0];
  if (!from) throw new Error("No MetaMask account connected");

  const txHash = await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [{
      from,
      to,
      value: amountWei
    }]
  });

  return txHash;
}
