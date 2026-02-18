import * as _tanstack_react_query from '@tanstack/react-query';
import { UseMutationOptions } from '@tanstack/react-query';
import { AuthContext, HiveEngineTokenMetadataResponse, AssetOperation } from '@ecency/sdk';
export { Asset, AssetOperation, AuthorReward, CancelTransferFromSavings, ClaimRewardBalance, CollateralizedConvert, CommentBenefactor, CommentPayoutUpdate, CommentReward, CurationReward, DelegateVestingShares, DelegatedVestingShare, EffectiveCommentVote, FillCollateralizedConvertRequest, FillConvertRequest, FillOrder, FillRecurrentTransfers, FillVestingWithdraw, GeneralAssetInfo, GeneralAssetTransaction, HIVE_ACCOUNT_OPERATION_GROUPS, HIVE_OPERATION_LIST, HIVE_OPERATION_NAME_BY_ID, HIVE_OPERATION_ORDERS, HiveBasedAssetSignType, HiveEngineMarketResponse, HiveEngineMetric, HiveEngineOpenOrder, HiveEngineOrderBookEntry, HiveEngineToken, HiveEngineTokenBalance, HiveEngineTokenInfo, HiveEngineTokenMetadataResponse, HiveEngineTokenStatus, HiveEngineTransaction, HiveMarketMetric, HiveOperationFilter, HiveOperationFilterKey, HiveOperationFilterValue, HiveOperationGroup, HiveOperationName, HiveTransaction, WithdrawRoute as HiveWithdrawRoute, Interest, LimitOrderCancel, LimitOrderCreate, NaiMap, PointTransaction, PointTransactionType, Points, PointsResponse, ProducerReward, ProposalPay, ReceivedVestingShare, RecurrentTransfers, ReturnVestingDelegation, SetWithdrawRoute, SpkApiWallet, SpkMarkets, Symbol, Token, TokenMetadata, Transfer, TransferToSavings, TransferToVesting, TransformedSpkMarkets, UpdateProposalVotes, VoteProxy, WalletOperationPayload, WithdrawVesting, formattedNumber, getAccountWalletAssetInfoQueryOptions, getAllHiveEngineTokensQueryOptions, getHbdAssetGeneralInfoQueryOptions, getHbdAssetTransactionsQueryOptions, getHiveAssetGeneralInfoQueryOptions, getHiveAssetMetricQueryOptions, getHiveAssetTransactionsQueryOptions, getHiveAssetWithdrawalRoutesQueryOptions, getHiveEngineBalancesWithUsdQueryOptions, getHiveEngineTokenGeneralInfoQueryOptions, getHiveEngineTokenTransactionsQueryOptions, getHiveEngineTokensBalancesQueryOptions, getHiveEngineTokensMarketQueryOptions, getHiveEngineTokensMetadataQueryOptions, getHiveEngineTokensMetricsQueryOptions, getHiveEngineUnclaimedRewardsQueryOptions, getHivePowerAssetGeneralInfoQueryOptions, getHivePowerAssetTransactionsQueryOptions, getHivePowerDelegatesInfiniteQueryOptions, getHivePowerDelegatingsQueryOptions, getLarynxAssetGeneralInfoQueryOptions, getLarynxPowerAssetGeneralInfoQueryOptions, getPointsAssetGeneralInfoQueryOptions, getPointsAssetTransactionsQueryOptions, getPointsQueryOptions, getSpkAssetGeneralInfoQueryOptions, getSpkMarketsQueryOptions, getSpkWalletQueryOptions, isEmptyDate, parseAsset, resolveHiveOperationFilters, rewardSpk, useClaimPoints, useWalletOperation, vestsToHp } from '@ecency/sdk';
import { BaseWallet, SignTxParams } from '@okxweb3/coin-base';
import { Client } from '@hiveio/dhive';
import { Transaction, SignedTransaction, TransactionConfirmation } from '@hiveio/dhive/lib/chain/transaction';
import { utxoTx } from '@okxweb3/coin-bitcoin/dist/type';
import { Network } from '@okxweb3/coin-bitcoin/dist/bitcoinjs-lib';
import { EthTxParams } from '@okxweb3/coin-ethereum/dist/EthWallet';
import { SolSignParam } from '@okxweb3/coin-solana/dist/SolWallet';
import { TrxSignParam } from '@okxweb3/coin-tron/dist/TrxWallet';
import { TxData } from '@okxweb3/coin-ton/dist/api/types';
import { AptosParam } from '@okxweb3/coin-aptos/dist/AptosWallet';

declare enum EcencyWalletCurrency {
    BTC = "BTC",
    ETH = "ETH",
    BNB = "BNB",
    APT = "APT",
    TON = "TON",
    TRON = "TRX",
    SOL = "SOL"
}

declare enum EcencyWalletBasicTokens {
    Points = "POINTS",
    HivePower = "HP",
    Hive = "HIVE",
    HiveDollar = "HBD"
}

interface EcencyTokenMetadata {
    address?: string;
    privateKey?: string;
    publicKey?: string;
    username?: string;
    currency?: string;
    custom?: boolean;
    type: string;
    /**
     * Represents showing of the token in the Ecency wallet
     */
    show?: boolean;
}

interface EcencyHiveKeys {
    username: string;
    owner: string;
    active: string;
    posting: string;
    memo: string;
    masterPassword: string;
    ownerPubkey: string;
    activePubkey: string;
    postingPubkey: string;
    memoPubkey: string;
}

interface AccountPointsResponse {
    points: string;
    unclaimed_points: string;
}

/**
 * Uses for creating wallet logically in the application
 *
 * Keep attention: this mutation doesn't save wallet to somewhere in a server
 */
declare function useWalletCreate(username: string, currency: EcencyWalletCurrency, importedSeed?: string): {
    createWallet: _tanstack_react_query.UseMutationResult<EcencyTokenMetadata, Error, void, unknown>;
    importWallet: () => void;
};

interface Payload$3 {
    currency: string;
    address: string;
}
declare function useCreateAccountWithWallets(username: string): _tanstack_react_query.UseMutationResult<Response, Error, Payload$3, unknown>;

interface Payload$2 {
    address: string;
    currency: EcencyWalletCurrency;
}
declare function useCheckWalletExistence(): _tanstack_react_query.UseMutationResult<boolean, Error, Payload$2, unknown>;

interface Payload$1 {
    tokens: Record<string, string>;
    hiveKeys: {
        ownerPublicKey: string;
        activePublicKey: string;
        postingPublicKey: string;
        memoPublicKey: string;
    };
}
declare function useUpdateAccountWithWallets(username: string, accessToken: string | undefined): _tanstack_react_query.UseMutationResult<Response, Error, Payload$1, unknown>;

declare const index_useCheckWalletExistence: typeof useCheckWalletExistence;
declare const index_useCreateAccountWithWallets: typeof useCreateAccountWithWallets;
declare const index_useUpdateAccountWithWallets: typeof useUpdateAccountWithWallets;
declare namespace index {
  export { index_useCheckWalletExistence as useCheckWalletExistence, index_useCreateAccountWithWallets as useCreateAccountWithWallets, index_useUpdateAccountWithWallets as useUpdateAccountWithWallets };
}

interface Payload {
    privateKeyOrSeed: string;
}
/**
 * This mutation uses for importing an existing wallet, validation and saving logically in application
 *
 * Keep attention: this mutation doesn't save wallet to somewhere in a server
 */
declare function useImportWallet(username: string, currency: EcencyWalletCurrency): _tanstack_react_query.UseMutationResult<{
    privateKey: string;
    address: any;
    publicKey: string;
}, Error, Payload, unknown>;

/**
 * Saving of token(s) metadata to Hive profile
 * It may contain: external wallets(see EcencyWalletCurrency), Hive tokens arrangement
 *
 * Basically, this mutation is a convenient wrapper for update profile operation
 */
type SaveWalletInformationOptions = Pick<UseMutationOptions<unknown, Error, EcencyTokenMetadata[]>, "onSuccess" | "onError">;
declare function useSaveWalletInformationToMetadata(username: string, auth?: AuthContext, options?: SaveWalletInformationOptions): _tanstack_react_query.UseMutationResult<unknown, Error, EcencyTokenMetadata[], unknown>;

interface ExternalWalletBalance {
    chain: string;
    unit: string;
    raw?: unknown;
    nodeId?: string;
    /**
     * Balance represented as a BigInt for convenience.
     */
    balanceBigInt: bigint;
    /**
     * Balance returned as a string to preserve precision for UIs that cannot
     * handle bigint values directly.
     */
    balanceString: string;
}
declare function useGetExternalWalletBalanceQuery(currency: EcencyWalletCurrency, address: string): _tanstack_react_query.UseQueryResult<ExternalWalletBalance, Error>;

declare function useSeedPhrase(username: string): _tanstack_react_query.UseQueryResult<string, Error>;

declare function getTokenPriceQueryOptions(currency?: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<number, Error, number, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<number, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: number;
        [dataTagErrorSymbol]: Error;
    };
};

declare function useHiveKeysQuery(username: string): _tanstack_react_query.UseQueryResult<EcencyHiveKeys, Error>;

declare function getAllTokensListQueryOptions(username?: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    basic: EcencyWalletBasicTokens[];
    external: EcencyWalletCurrency[];
    spk: string[];
    layer2: HiveEngineTokenMetadataResponse[];
}, Error, {
    basic: EcencyWalletBasicTokens[];
    external: EcencyWalletCurrency[];
    spk: string[];
    layer2: HiveEngineTokenMetadataResponse[];
}, (string | null)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        basic: EcencyWalletBasicTokens[];
        external: EcencyWalletCurrency[];
        spk: string[];
        layer2: HiveEngineTokenMetadataResponse[];
    }, (string | null)[], never> | undefined;
} & {
    queryKey: (string | null)[] & {
        [dataTagSymbol]: {
            basic: EcencyWalletBasicTokens[];
            external: EcencyWalletCurrency[];
            spk: string[];
            layer2: HiveEngineTokenMetadataResponse[];
        };
        [dataTagErrorSymbol]: Error;
    };
};

declare function getAccountWalletListQueryOptions(username: string, currency?: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<string[], Error, string[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<string[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: string[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getTokenOperationsQueryOptions(token: string, username: string, isForOwner?: boolean, currency?: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<AssetOperation[], Error, AssetOperation[], (string | boolean)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<AssetOperation[], (string | boolean)[], never> | undefined;
} & {
    queryKey: (string | boolean)[] & {
        [dataTagSymbol]: AssetOperation[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function useWalletsCacheQuery(username?: string): _tanstack_react_query.DefinedUseQueryResult<Map<EcencyWalletCurrency, EcencyTokenMetadata>, Error>;

declare function delay(ms: number): Promise<unknown>;

declare function getWallet(currency: EcencyWalletCurrency): BaseWallet | undefined;

declare function mnemonicToSeedBip39(value: string): string;

type HiveRole = "owner" | "active" | "posting" | "memo";
declare function deriveHiveKey(mnemonic: string, role: HiveRole, accountIndex?: number): {
    readonly privateKey: string;
    readonly publicKey: string;
};
declare function deriveHiveKeys(mnemonic: string, accountIndex?: number): {
    readonly owner: string;
    readonly active: string;
    readonly posting: string;
    readonly memo: string;
    readonly ownerPubkey: string;
    readonly activePubkey: string;
    readonly postingPubkey: string;
    readonly memoPubkey: string;
};

declare function deriveHiveMasterPasswordKey(username: string, masterPassword: string, role: HiveRole): {
    readonly privateKey: string;
    readonly publicKey: string;
};
declare function deriveHiveMasterPasswordKeys(username: string, masterPassword: string): {
    readonly owner: string;
    readonly active: string;
    readonly posting: string;
    readonly memo: string;
    readonly ownerPubkey: string;
    readonly activePubkey: string;
    readonly postingPubkey: string;
    readonly memoPubkey: string;
};

type HiveKeyDerivation = "bip44" | "master-password" | "unknown";
declare function detectHiveKeyDerivation(username: string, seed: string, type?: "active" | "owner"): Promise<HiveKeyDerivation>;

/**
 * Sign a digest using the provided private key.
 * @param digest Digest as a Buffer or hex string.
 * @param privateKey Private key in WIF format.
 * @returns Hex encoded signature string.
 */
declare function signDigest(digest: Buffer | string, privateKey: string): string;

/**
 * Sign a transaction with the given private key.
 * Optionally a custom chain id can be provided.
 *
 * @param tx Transaction to sign.
 * @param privateKey Private key in WIF format.
 * @param chainId Optional chain id as a hex string.
 * @returns Signed transaction including the signature.
 */
declare function signTx(tx: Transaction, privateKey: string, chainId?: string): SignedTransaction;
/**
 * Sign a transaction and broadcast it to the network.
 * Optionally a custom chain id can be provided.
 *
 * @param client Hive client instance used for broadcasting.
 * @param tx Transaction to sign.
 * @param privateKey Private key in WIF format.
 * @param chainId Optional chain id as a hex string.
 * @returns Broadcast confirmation.
 */
declare function signTxAndBroadcast(client: Client, tx: Transaction, privateKey: string, chainId?: string): Promise<TransactionConfirmation>;

/**
 * Encrypt a memo using explicit keys.
 * @param privateKey Sender's private memo key in WIF format.
 * @param publicKey Recipient's public memo key.
 * @param memo Memo text to encrypt.
 */
declare function encryptMemoWithKeys(privateKey: string, publicKey: string, memo: string): string;
/**
 * Encrypt a memo by looking up the recipient's memo key from the blockchain.
 * @param client Hive client instance used to fetch account information.
 * @param fromPrivateKey Sender's private memo key.
 * @param toAccount Recipient account name.
 * @param memo Memo text to encrypt.
 */
declare function encryptMemoWithAccounts(client: Client, fromPrivateKey: string, toAccount: string, memo: string): Promise<string>;

/**
 * Decrypt an encrypted memo using the recipient's private key.
 * @param privateKey Private memo key in WIF format.
 * @param memo Encrypted memo string.
 */
declare function decryptMemoWithKeys(privateKey: string, memo: string): string;
/**
 * Decrypt a memo using account information.
 * This is an alias of {@link decryptMemoWithKeys} and provided for
 * API symmetry with {@link encryptMemoWithAccounts}.
 */
declare const decryptMemoWithAccounts: typeof decryptMemoWithKeys;

/**
 * Sign a transaction for an external chain supported by okxweb3 wallets.
 *
 * @param currency Chain identifier.
 * @param params   Signing parameters accepted by okxweb3 wallets.
 */
declare function signExternalTx(currency: EcencyWalletCurrency, params: SignTxParams): Promise<any>;
/**
 * Sign and broadcast a transaction for an external chain. The transaction is
 * signed locally and then sent to a public RPC endpoint for broadcasting.
 *
 * @param currency Chain identifier.
 * @param params   Signing parameters accepted by okxweb3 wallets.
 * @returns        RPC response or broadcasted transaction hash.
 */
declare function signExternalTxAndBroadcast(currency: EcencyWalletCurrency, params: SignTxParams): Promise<any>;

/**
 * Union type covering all chain-specific build parameters.
 */
type ExternalTxParams = utxoTx | EthTxParams | SolSignParam | TrxSignParam | TxData | AptosParam;
/**
 * Build a Bitcoin PSBT from UTXO inputs and desired outputs.
 *
 * @param tx Transaction description accepted by @okxweb3/coin-bitcoin.
 * @returns Hex encoded PSBT ready for signing.
 */
declare function buildPsbt(tx: utxoTx, network?: Network, maximumFeeRate?: number): string;
/**
 * Helper returning raw Ethereum transaction data ready for signing.
 *
 * The returned object can be passed directly to signExternalTx.
 */
declare function buildEthTx(data: EthTxParams): EthTxParams;
/**
 * Helper returning Solana transaction params used by signExternalTx.
 */
declare function buildSolTx(data: SolSignParam): SolSignParam;
/**
 * Helper returning Tron transaction params used by signExternalTx.
 */
declare function buildTronTx(data: TrxSignParam): TrxSignParam;
/**
 * Helper returning TON transaction params used by signExternalTx.
 */
declare function buildTonTx(data: TxData): TxData;
/**
 * Helper returning Aptos transaction params used by signExternalTx.
 */
declare function buildAptTx(data: AptosParam): AptosParam;
/**
 * Build a transaction for an external chain supported by okxweb3 wallets.
 *
 * @param currency Chain identifier.
 * @param tx       Chain specific transaction description.
 */
declare function buildExternalTx(currency: EcencyWalletCurrency, tx: ExternalTxParams): string | EthTxParams | SolSignParam | TrxSignParam | TxData | AptosParam;

declare function getBoundFetch(): typeof fetch;

export { type AccountPointsResponse, type EcencyHiveKeys, type EcencyTokenMetadata, EcencyWalletBasicTokens, EcencyWalletCurrency, index as EcencyWalletsPrivateApi, type ExternalTxParams, type ExternalWalletBalance, type HiveKeyDerivation, type HiveRole, buildAptTx, buildEthTx, buildExternalTx, buildPsbt, buildSolTx, buildTonTx, buildTronTx, decryptMemoWithAccounts, decryptMemoWithKeys, delay, deriveHiveKey, deriveHiveKeys, deriveHiveMasterPasswordKey, deriveHiveMasterPasswordKeys, detectHiveKeyDerivation, encryptMemoWithAccounts, encryptMemoWithKeys, getAccountWalletListQueryOptions, getAllTokensListQueryOptions, getBoundFetch, getTokenOperationsQueryOptions, getTokenPriceQueryOptions, getWallet, mnemonicToSeedBip39, signDigest, signExternalTx, signExternalTxAndBroadcast, signTx, signTxAndBroadcast, useGetExternalWalletBalanceQuery, useHiveKeysQuery, useImportWallet, useSaveWalletInformationToMetadata, useSeedPhrase, useWalletCreate, useWalletsCacheQuery };
