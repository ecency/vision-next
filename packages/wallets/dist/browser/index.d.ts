import * as _tanstack_react_query from '@tanstack/react-query';
import { UseMutationOptions, useMutation } from '@tanstack/react-query';
import { AuthContext, useBroadcastMutation } from '@ecency/sdk';
export { getHiveEngineMetrics, getHiveEngineOpenOrders, getHiveEngineOrderBook, getHiveEngineTradeHistory } from '@ecency/sdk';
import { BaseWallet, SignTxParams } from '@okxweb3/coin-base';
import { OperationName, VirtualOperationName, SMTAsset, PrivateKey, Operation, TransactionConfirmation, Client } from '@hiveio/dhive';
import { Transaction, SignedTransaction, TransactionConfirmation as TransactionConfirmation$1 } from '@hiveio/dhive/lib/chain/transaction';
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
declare function useWalletCreate(username: string, currency: EcencyWalletCurrency): {
    createWallet: _tanstack_react_query.UseMutationResult<EcencyTokenMetadata, Error, void, unknown>;
    importWallet: () => void;
};

interface Payload$8 {
    currency: string;
    address: string;
}
declare function useCreateAccountWithWallets(username: string): _tanstack_react_query.UseMutationResult<Response, Error, Payload$8, unknown>;

interface Payload$7 {
    address: string;
    currency: EcencyWalletCurrency;
}
declare function useCheckWalletExistence(): _tanstack_react_query.UseMutationResult<boolean, Error, Payload$7, unknown>;

interface Payload$6 {
    tokens: Record<string, string>;
    hiveKeys: {
        ownerPublicKey: string;
        activePublicKey: string;
        postingPublicKey: string;
        memoPublicKey: string;
    };
}
declare function useUpdateAccountWithWallets(username: string, accessToken: string | undefined): _tanstack_react_query.UseMutationResult<Response, Error, Payload$6, unknown>;

declare const index_useCheckWalletExistence: typeof useCheckWalletExistence;
declare const index_useCreateAccountWithWallets: typeof useCreateAccountWithWallets;
declare const index_useUpdateAccountWithWallets: typeof useUpdateAccountWithWallets;
declare namespace index {
  export { index_useCheckWalletExistence as useCheckWalletExistence, index_useCreateAccountWithWallets as useCreateAccountWithWallets, index_useUpdateAccountWithWallets as useUpdateAccountWithWallets };
}

interface Payload$5 {
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
}, Error, Payload$5, unknown>;

/**
 * Saving of token(s) metadata to Hive profile
 * It may contain: external wallets(see EcencyWalletCurrency), Hive tokens arrangement
 *
 * Basically, this mutation is a convenient wrapper for update profile operation
 */
type SaveWalletInformationOptions = Pick<UseMutationOptions<unknown, Error, EcencyTokenMetadata[]>, "onSuccess" | "onError">;
declare function useSaveWalletInformationToMetadata(username: string, auth?: AuthContext, options?: SaveWalletInformationOptions): _tanstack_react_query.UseMutationResult<unknown, Error, EcencyTokenMetadata[], unknown>;

declare function getHiveAssetGeneralInfoQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    parts?: undefined;
} | {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    parts: {
        name: string;
        balance: number;
    }[];
}, Error, {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    parts?: undefined;
} | {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    parts: {
        name: string;
        balance: number;
    }[];
}, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        name: string;
        title: string;
        price: number;
        accountBalance: number;
        parts?: undefined;
    } | {
        name: string;
        title: string;
        price: number;
        accountBalance: number;
        parts: {
            name: string;
            balance: number;
        }[];
    }, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: {
            name: string;
            title: string;
            price: number;
            accountBalance: number;
            parts?: undefined;
        } | {
            name: string;
            title: string;
            price: number;
            accountBalance: number;
            parts: {
                name: string;
                balance: number;
            }[];
        };
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHivePowerAssetGeneralInfoQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    apr?: undefined;
    parts?: undefined;
} | {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    apr: string;
    parts: {
        name: string;
        balance: number;
    }[];
}, Error, {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    apr?: undefined;
    parts?: undefined;
} | {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    apr: string;
    parts: {
        name: string;
        balance: number;
    }[];
}, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        name: string;
        title: string;
        price: number;
        accountBalance: number;
        apr?: undefined;
        parts?: undefined;
    } | {
        name: string;
        title: string;
        price: number;
        accountBalance: number;
        apr: string;
        parts: {
            name: string;
            balance: number;
        }[];
    }, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: {
            name: string;
            title: string;
            price: number;
            accountBalance: number;
            apr?: undefined;
            parts?: undefined;
        } | {
            name: string;
            title: string;
            price: number;
            accountBalance: number;
            apr: string;
            parts: {
                name: string;
                balance: number;
            }[];
        };
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHbdAssetGeneralInfoQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    apr?: undefined;
    parts?: undefined;
} | {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    apr: string;
    parts: {
        name: string;
        balance: number;
    }[];
}, Error, {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    apr?: undefined;
    parts?: undefined;
} | {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    apr: string;
    parts: {
        name: string;
        balance: number;
    }[];
}, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        name: string;
        title: string;
        price: number;
        accountBalance: number;
        apr?: undefined;
        parts?: undefined;
    } | {
        name: string;
        title: string;
        price: number;
        accountBalance: number;
        apr: string;
        parts: {
            name: string;
            balance: number;
        }[];
    }, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: {
            name: string;
            title: string;
            price: number;
            accountBalance: number;
            apr?: undefined;
            parts?: undefined;
        } | {
            name: string;
            title: string;
            price: number;
            accountBalance: number;
            apr: string;
            parts: {
                name: string;
                balance: number;
            }[];
        };
        [dataTagErrorSymbol]: Error;
    };
};

type HiveOperationGroup = "" | "transfers" | "market-orders" | "interests" | "stake-operations" | "rewards";

type HiveOperationName = OperationName | VirtualOperationName;
type HiveOperationFilterValue = HiveOperationGroup | HiveOperationName;
type HiveOperationFilter = HiveOperationFilterValue | HiveOperationFilterValue[];
type HiveOperationFilterKey = string;

interface BaseTransaction {
    num: number;
    type: string;
    timestamp: string;
    trx_id: string;
}
interface CurationReward extends BaseTransaction {
    type: "curation_reward";
    comment_author?: string;
    comment_permlink?: string;
    author?: string;
    permlink?: string;
    curator: string;
    reward: string;
}
interface AuthorReward extends BaseTransaction {
    type: "author_reward";
    author: string;
    permlink: string;
    hbd_payout: string;
    hive_payout: string;
    vesting_payout: string;
}
interface CommentBenefactor extends BaseTransaction {
    type: "comment_benefactor_reward";
    benefactor: string;
    author: string;
    permlink: string;
    hbd_payout: string;
    hive_payout: string;
    vesting_payout: string;
}
interface ClaimRewardBalance extends BaseTransaction {
    type: "claim_reward_balance";
    account: string;
    reward_hbd: string;
    reward_hive: string;
    reward_vests: string;
}
interface Transfer extends BaseTransaction {
    type: "transfer";
    amount: string;
    memo: string;
    from: string;
    to: string;
}
interface TransferToVesting extends BaseTransaction {
    type: "transfer_to_vesting";
    amount: string;
    memo?: string;
    from: string;
    to: string;
}
interface SetWithdrawRoute extends BaseTransaction {
    type: "set_withdraw_vesting_route";
    from_account: string;
    to_account: string;
    percent: number;
    auto_vest: boolean;
}
interface TransferToSavings extends BaseTransaction {
    type: "transfer_to_savings";
    amount: string;
    memo?: string;
    from: string;
    to: string;
}
interface CancelTransferFromSavings extends BaseTransaction {
    from: string;
    request_id: number;
    type: "cancel_transfer_from_savings";
}
interface WithdrawVesting extends BaseTransaction {
    type: "withdraw_vesting";
    acc: string;
    vesting_shares: string;
}
interface FillOrder extends BaseTransaction {
    type: "fill_order";
    current_pays: string;
    open_pays: string;
}
interface LimitOrderCancel extends BaseTransaction {
    type: "limit_order_cancel";
    owner: string;
    orderid: number;
    num: number;
}
interface ProducerReward extends BaseTransaction {
    type: "producer_reward";
    vesting_shares: string;
    producer: string;
}
interface Interest extends BaseTransaction {
    type: "interest";
    owner: string;
    interest: string;
}
interface FillConvertRequest extends BaseTransaction {
    type: "fill_convert_request";
    amount_in: string;
    amount_out: string;
}
interface FillCollateralizedConvertRequest extends BaseTransaction {
    type: "fill_collateralized_convert_request";
    owner: string;
    requestid: number;
    amount_in: string;
    amount_out: string;
    excess_collateral: string;
}
interface ReturnVestingDelegation extends BaseTransaction {
    type: "return_vesting_delegation";
    vesting_shares: string;
}
interface ProposalPay extends BaseTransaction {
    type: "proposal_pay";
    payment: string;
}
interface UpdateProposalVotes extends BaseTransaction {
    type: "update_proposal_votes";
    voter: string;
    proposal_ids: [number];
    approve: boolean;
}
interface CommentPayoutUpdate extends BaseTransaction {
    type: "comment_payout_update";
    author: string;
    permlink: string;
}
interface CommentReward extends BaseTransaction {
    type: "comment_reward";
    author: string;
    permlink: string;
    payout: string;
}
interface CollateralizedConvert extends BaseTransaction {
    type: "collateralized_convert";
    owner: string;
    requestid: number;
    amount: string;
}
interface RecurrentTransfers extends BaseTransaction {
    type: "recurrent_transfer";
    amount: string;
    memo: string;
    from: string;
    to: string;
    recurrence: number;
    executions: number;
}
interface FillRecurrentTransfers extends BaseTransaction {
    type: "fill_recurrent_transfer";
    amount: SMTAsset;
    memo: string;
    from: string;
    to: string;
    remaining_executions: number;
}
interface DelegateVestingShares extends BaseTransaction {
    type: "delegate_vesting_shares";
    delegator: string;
    delegatee: string;
    vesting_shares: string;
}
interface LimitOrderCreate extends BaseTransaction {
    type: "limit_order_create";
    owner: string;
    orderid: number;
    amount_to_sell: string;
    min_to_receive: string;
    expiration: string;
}
interface FillVestingWithdraw extends BaseTransaction {
    type: "fill_vesting_withdraw";
    from_account: string;
    to_account: string;
    withdrawn: string;
    deposited: string;
}
interface EffectiveCommentVote extends BaseTransaction {
    type: "effective_comment_vote";
    voter: string;
    author: string;
    permlink: string;
    pending_payout: string;
    total_vote_weight: number;
    rshares: number;
    weight: number;
}
interface VoteProxy extends BaseTransaction {
    type: "account_witness_proxy";
    account: string;
    proxy: string;
}
type HiveTransaction = CurationReward | AuthorReward | CommentBenefactor | ClaimRewardBalance | Transfer | TransferToVesting | TransferToSavings | CancelTransferFromSavings | WithdrawVesting | SetWithdrawRoute | FillOrder | ProducerReward | Interest | FillConvertRequest | FillCollateralizedConvertRequest | ReturnVestingDelegation | ProposalPay | UpdateProposalVotes | CommentPayoutUpdate | CommentReward | CollateralizedConvert | RecurrentTransfers | FillRecurrentTransfers | LimitOrderCreate | LimitOrderCancel | FillVestingWithdraw | EffectiveCommentVote | VoteProxy | DelegateVestingShares;

interface HiveMarketMetric {
    hive: {
        high: number;
        low: number;
        open: number;
        close: number;
        volume: number;
    };
    id: number;
    non_hive: {
        high: number;
        low: number;
        open: number;
        close: number;
        volume: number;
    };
    open: string;
    seconds: number;
}

interface HiveWithdrawRoute {
    auto_vest: boolean;
    from_account: string;
    id: number;
    percent: number;
    to_account: string;
}

interface DelegatedVestingShare {
    id: number;
    delegatee: string;
    delegator: string;
    min_delegation_time: string;
    vesting_shares: string;
}

interface ReceivedVestingShare {
    delegatee: string;
    delegator: string;
    timestamp: string;
    vesting_shares: string;
}

declare function resolveHiveOperationFilters(filters: HiveOperationFilter): {
    filterKey: HiveOperationFilterKey;
    filterArgs: any[];
};
declare function getHiveAssetTransactionsQueryOptions(username: string | undefined, limit?: number, filters?: HiveOperationFilter): _tanstack_react_query.UseInfiniteQueryOptions<HiveTransaction[], Error, _tanstack_react_query.InfiniteData<HiveTransaction[], unknown>, readonly unknown[], unknown> & {
    initialData: _tanstack_react_query.InfiniteData<HiveTransaction[], unknown> | (() => _tanstack_react_query.InfiniteData<HiveTransaction[], unknown>) | undefined;
} & {
    queryKey: readonly unknown[] & {
        [dataTagSymbol]: _tanstack_react_query.InfiniteData<HiveTransaction[], unknown>;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHivePowerAssetTransactionsQueryOptions(username: string | undefined, limit?: number, filters?: HiveOperationFilter): _tanstack_react_query.UseInfiniteQueryOptions<HiveTransaction[], Error, _tanstack_react_query.InfiniteData<HiveTransaction[], unknown>, readonly unknown[], unknown> & {
    initialData: _tanstack_react_query.InfiniteData<HiveTransaction[], unknown> | (() => _tanstack_react_query.InfiniteData<HiveTransaction[], unknown>) | undefined;
} & {
    queryKey: readonly unknown[] & {
        [dataTagSymbol]: _tanstack_react_query.InfiniteData<HiveTransaction[], unknown>;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHbdAssetTransactionsQueryOptions(username: string | undefined, limit?: number, filters?: HiveOperationFilter): _tanstack_react_query.UseInfiniteQueryOptions<HiveTransaction[], Error, _tanstack_react_query.InfiniteData<HiveTransaction[], unknown>, readonly unknown[], unknown> & {
    initialData: _tanstack_react_query.InfiniteData<HiveTransaction[], unknown> | (() => _tanstack_react_query.InfiniteData<HiveTransaction[], unknown>) | undefined;
} & {
    queryKey: readonly unknown[] & {
        [dataTagSymbol]: _tanstack_react_query.InfiniteData<HiveTransaction[], unknown>;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHiveAssetMetricQueryOptions(bucketSeconds?: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseInfiniteQueryOptions<{
    close: number;
    open: number;
    low: number;
    high: number;
    volume: number;
    time: Date;
}[], Error, _tanstack_react_query.InfiniteData<{
    close: number;
    open: number;
    low: number;
    high: number;
    volume: number;
    time: Date;
}[], unknown>, (string | number)[], Date[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        close: number;
        open: number;
        low: number;
        high: number;
        volume: number;
        time: Date;
    }[], (string | number)[], Date[]> | undefined;
} & {
    queryKey: (string | number)[] & {
        [dataTagSymbol]: _tanstack_react_query.InfiniteData<{
            close: number;
            open: number;
            low: number;
            high: number;
            volume: number;
            time: Date;
        }[], unknown>;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHiveAssetWithdrawalRoutesQueryOptions(username: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<HiveWithdrawRoute[], Error, HiveWithdrawRoute[], (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<HiveWithdrawRoute[], (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: HiveWithdrawRoute[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHivePowerDelegatesInfiniteQueryOptions(username: string, limit?: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<DelegatedVestingShare[], Error, DelegatedVestingShare[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<DelegatedVestingShare[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: DelegatedVestingShare[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHivePowerDelegatingsQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<ReceivedVestingShare[], Error, ReceivedVestingShare[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<ReceivedVestingShare[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: ReceivedVestingShare[];
        [dataTagErrorSymbol]: Error;
    };
};

interface GeneralAssetInfo {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    apr?: string;
    layer?: string;
    pendingRewards?: number;
    parts?: {
        name: string;
        balance: number;
    }[];
}

interface SpkApiWallet {
    balance: number;
    claim: number;
    drop: {
        availible: {
            amount: number;
            precision: number;
            token: string;
        };
        last_claim: number;
        total_claims: number;
    };
    poweredUp: number;
    granted: {
        t: number;
        [key: string]: number;
    };
    granting: {
        t: number;
        [key: string]: number;
    };
    heldCollateral: number;
    contracts: unknown[];
    up: unknown;
    down: unknown;
    power_downs: {
        [key: string]: string;
    };
    gov_downs: unknown;
    gov: number;
    spk: number;
    spk_block: number;
    tick: string;
    node: string;
    head_block: number;
    behind: number;
    VERSION: string;
    pow: number;
}
interface SpkMarkets {
    head_block: number;
    markets: {
        node: {
            [key: string]: {
                lastGood: number;
                report: {
                    block: number;
                };
            };
        };
    };
    stats: any;
}
interface TransformedSpkMarkets {
    list: {
        name: string;
        status: string;
    }[];
    raw: SpkMarkets;
}

declare enum AssetOperation {
    Transfer = "transfer",
    TransferToSavings = "transfer-saving",
    WithdrawFromSavings = "withdraw-saving",
    Delegate = "delegate",
    PowerUp = "power-up",
    PowerDown = "power-down",
    WithdrawRoutes = "withdraw-routes",
    ClaimInterest = "claim-interest",
    Swap = "swap",
    Gift = "gift",
    Promote = "promote",
    Claim = "claim",
    Buy = "buy",
    LockLiquidity = "lock",
    Stake = "stake",
    Unstake = "unstake",
    Undelegate = "undelegate"
}

interface GeneralAssetTransaction {
    id: number | string;
    type: OperationName | number | string;
    created: Date;
    results: {
        amount: string | number;
        asset: string;
    }[];
    from?: string;
    to?: string;
    memo?: string;
}

type HiveBasedAssetSignType = "key" | "keychain" | "hivesigner" | "hiveauth";

interface TransferPayload<T extends HiveBasedAssetSignType> {
    from: string;
    to: string;
    amount: string;
    memo: string;
    type: T;
}
declare function transferHive<T extends HiveBasedAssetSignType>(payload: T extends "key" ? TransferPayload<T> & {
    key: PrivateKey;
} : TransferPayload<T>, auth?: AuthContext): Promise<unknown>;

interface Payload$4<T extends HiveBasedAssetSignType> {
    from: string;
    to: string;
    amount: string;
    memo: string;
    type: T;
}
declare function transferToSavingsHive<T extends HiveBasedAssetSignType>(payload: T extends "key" ? Payload$4<T> & {
    key: PrivateKey;
} : Payload$4<T>, auth?: AuthContext): Promise<unknown>;

interface PayloadBase$1 {
    from: string;
    to: string;
    amount: string;
    memo: string;
    request_id?: number;
}
interface PayloadWithKey$1<T extends HiveBasedAssetSignType> extends PayloadBase$1 {
    type: T;
}
declare function transferFromSavingsHive<T extends HiveBasedAssetSignType>(payload: T extends "key" ? PayloadWithKey$1<T> & {
    key: PrivateKey;
} : PayloadWithKey$1<T>, auth?: AuthContext): Promise<unknown>;

interface Payload$3<T extends HiveBasedAssetSignType> {
    from: string;
    to: string;
    amount: string;
    memo: string;
    type: T;
}
declare function powerUpHive<T extends HiveBasedAssetSignType>(payload: T extends "key" ? Payload$3<T> & {
    key: PrivateKey;
} : Payload$3<T>, auth?: AuthContext): Promise<unknown>;

interface Payload$2<T extends HiveBasedAssetSignType> {
    from: string;
    to: string;
    amount: string;
    memo: string;
    type: T;
}
declare function delegateHive<T extends HiveBasedAssetSignType>(payload: T extends "key" ? Payload$2<T> & {
    key: PrivateKey;
} : Payload$2<T>, auth?: AuthContext): Promise<unknown>;

interface Payload$1<T extends HiveBasedAssetSignType> {
    from: string;
    amount: string;
    type: T;
}
declare function powerDownHive<T extends HiveBasedAssetSignType>(payload: T extends "key" ? Payload$1<T> & {
    key: PrivateKey;
} : Payload$1<T>, auth?: AuthContext): Promise<unknown>;

interface Payload<T extends HiveBasedAssetSignType> {
    from_account: string;
    to_account: string;
    percent: number;
    auto_vest: boolean;
    type: T;
}
declare function withdrawVestingRouteHive<T extends HiveBasedAssetSignType>(payload: T extends "key" ? Payload<T> & {
    key: PrivateKey;
} : Payload<T>, auth?: AuthContext): Promise<unknown>;

declare function useClaimRewards(username: string, auth: AuthContext | undefined, onSuccess: () => void): ReturnType<typeof useBroadcastMutation<void>>;

interface PayloadBase {
    from: string;
    to: string;
    amount: string;
    memo: string;
    request_id?: number;
}
interface PayloadWithKey<T extends HiveBasedAssetSignType> extends PayloadBase {
    type: T;
}
declare function claimInterestHive<T extends HiveBasedAssetSignType>(payload: T extends "key" ? PayloadWithKey<T> & {
    key: PrivateKey;
} : PayloadWithKey<T>, auth?: AuthContext): Promise<unknown>;

declare const HIVE_ACCOUNT_OPERATION_GROUPS: Record<HiveOperationGroup, number[]>;

declare const HIVE_OPERATION_LIST: HiveOperationName[];

declare const HIVE_OPERATION_ORDERS: Record<HiveOperationName, number>;
declare const HIVE_OPERATION_NAME_BY_ID: Record<number, HiveOperationName>;

declare enum Symbol {
    HIVE = "HIVE",
    HBD = "HBD",
    VESTS = "VESTS",
    SPK = "SPK"
}
declare enum NaiMap {
    "@@000000021" = "HIVE",
    "@@000000013" = "HBD",
    "@@000000037" = "VESTS"
}
interface Asset {
    amount: number;
    symbol: Symbol;
}
declare function parseAsset(sval: string | SMTAsset): Asset;

declare function isEmptyDate(s: string | undefined): boolean;

declare function vestsToHp(vests: number, hivePerMVests: number): number;

declare function rewardSpk(data: SpkApiWallet, sstats: any): number;

type HiveAuthKeyType$1 = "posting" | "active";
type HiveAuthBroadcastHandler = (username: string, operations: Operation[], keyType: HiveAuthKeyType$1) => Promise<TransactionConfirmation>;

type HiveAuthKeyType = "posting" | "active";
declare function registerWalletHiveAuthBroadcast(handler: HiveAuthBroadcastHandler): void;
declare function broadcastWithWalletHiveAuth(username: string, operations: Operation[], keyType: HiveAuthKeyType): Promise<TransactionConfirmation>;
declare function hasWalletHiveAuthBroadcast(): boolean;

interface SpkTransferPayload<T extends HiveBasedAssetSignType> {
    from: string;
    to: string;
    amount: string;
    memo?: string;
    type: T;
}
declare function transferSpk<T extends HiveBasedAssetSignType>(payload: T extends "key" ? SpkTransferPayload<T> & {
    key: PrivateKey;
} : SpkTransferPayload<T>, auth?: AuthContext): Promise<unknown>;

interface SpkLockPayload<T extends HiveBasedAssetSignType> {
    mode: "lock" | "unlock";
    from: string;
    amount: string;
    type: T;
}
declare const lockLarynx: <T extends HiveBasedAssetSignType>(payload: T extends "key" ? SpkLockPayload<T> & {
    key: PrivateKey;
} : SpkLockPayload<T>, auth?: AuthContext) => Promise<unknown>;

interface SpkPowerPayload<T extends HiveBasedAssetSignType> {
    mode: "up" | "down";
    from: string;
    amount: string;
    type: T;
}
declare function powerUpLarynx<T extends HiveBasedAssetSignType>(payload: T extends "key" ? SpkPowerPayload<T> & {
    key: PrivateKey;
} : SpkPowerPayload<T>, auth?: AuthContext): Promise<unknown>;

interface LarynxTransferPayload<T extends HiveBasedAssetSignType> {
    from: string;
    to: string;
    amount: string;
    memo?: string;
    type: T;
}
declare function transferLarynx<T extends HiveBasedAssetSignType>(payload: T extends "key" ? LarynxTransferPayload<T> & {
    key: PrivateKey;
} : LarynxTransferPayload<T>, auth?: AuthContext): Promise<unknown>;

declare function getLarynxAssetGeneralInfoQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    layer?: undefined;
} | {
    name: string;
    layer: string;
    title: string;
    price: number;
    accountBalance: number;
}, Error, {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    layer?: undefined;
} | {
    name: string;
    layer: string;
    title: string;
    price: number;
    accountBalance: number;
}, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        name: string;
        title: string;
        price: number;
        accountBalance: number;
        layer?: undefined;
    } | {
        name: string;
        layer: string;
        title: string;
        price: number;
        accountBalance: number;
    }, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: {
            name: string;
            title: string;
            price: number;
            accountBalance: number;
            layer?: undefined;
        } | {
            name: string;
            layer: string;
            title: string;
            price: number;
            accountBalance: number;
        };
        [dataTagErrorSymbol]: Error;
    };
};

declare function getSpkAssetGeneralInfoQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    name: string;
    layer: string;
    title: string;
    price: number;
    accountBalance: number;
}, Error, {
    name: string;
    layer: string;
    title: string;
    price: number;
    accountBalance: number;
}, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        name: string;
        layer: string;
        title: string;
        price: number;
        accountBalance: number;
    }, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: {
            name: string;
            layer: string;
            title: string;
            price: number;
            accountBalance: number;
        };
        [dataTagErrorSymbol]: Error;
    };
};

declare function getLarynxPowerAssetGeneralInfoQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    layer?: undefined;
    parts?: undefined;
} | {
    name: string;
    title: string;
    layer: string;
    price: number;
    accountBalance: number;
    parts: {
        name: string;
        balance: number;
    }[];
}, Error, {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    layer?: undefined;
    parts?: undefined;
} | {
    name: string;
    title: string;
    layer: string;
    price: number;
    accountBalance: number;
    parts: {
        name: string;
        balance: number;
    }[];
}, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        name: string;
        title: string;
        price: number;
        accountBalance: number;
        layer?: undefined;
        parts?: undefined;
    } | {
        name: string;
        title: string;
        layer: string;
        price: number;
        accountBalance: number;
        parts: {
            name: string;
            balance: number;
        }[];
    }, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: {
            name: string;
            title: string;
            price: number;
            accountBalance: number;
            layer?: undefined;
            parts?: undefined;
        } | {
            name: string;
            title: string;
            layer: string;
            price: number;
            accountBalance: number;
            parts: {
                name: string;
                balance: number;
            }[];
        };
        [dataTagErrorSymbol]: Error;
    };
};

declare function getSpkMarketsQueryOptions(): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    list: {
        name: string;
        status: string;
    }[];
    raw: SpkMarkets;
}, Error, {
    list: {
        name: string;
        status: string;
    }[];
    raw: SpkMarkets;
}, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        list: {
            name: string;
            status: string;
        }[];
        raw: SpkMarkets;
    }, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: {
            list: {
                name: string;
                status: string;
            }[];
            raw: SpkMarkets;
        };
        [dataTagErrorSymbol]: Error;
    };
};

declare function getSpkWalletQueryOptions(username?: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<SpkApiWallet, Error, SpkApiWallet, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<SpkApiWallet, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: SpkApiWallet;
        [dataTagErrorSymbol]: Error;
    };
};

interface HiveEngineMarketResponse {
    _id: number;
    symbol: string;
    volume: string;
    volumeExpiration: number;
    lastPrice: string;
    lowestAsk: string;
    highestBid: string;
    lastDayPrice: string;
    lastDayPriceExpiration: number;
    priceChangeHive: string;
    priceChangePercent: string;
}

interface HiveEngineTokenMetadataResponse {
    issuer: string;
    symbol: string;
    name: string;
    metadata: string;
    precision: number;
    maxSupply: string;
    supply: string;
    circulatingSupply: string;
    stakingEnabled: boolean;
    unstakingCooldown: number;
    delegationEnabled: boolean;
    undelegationCooldown: number;
    numberTransactions: number;
    totalStaked: string;
}

interface HiveEngineTokenBalance {
    account: string;
    balance: string;
    delegationsIn: string;
    delegationsOut: string;
    pendingUndelegations: string;
    pendingUnstake: string;
    stake: string;
    symbol: string;
}

interface HiveEngineTransaction {
    _id: string;
    blockNumber: number;
    transactionId: string;
    timestamp: number;
    operation: string;
    from: string;
    to: string;
    symbol: string;
    quantity: string;
    memo: any;
    account: string;
    authorperm?: string;
}

interface HiveEngineMetric {
    baseVolume: string;
    close: string;
    high: string;
    low: string;
    open: string;
    quoteVolume: string;
    timestamp: number;
}

interface HiveEngineTokenStatus {
    symbol: string;
    pending_token: number;
    precision: number;
}

interface HiveEngineTokenInfo {
    highestBid: string;
    lastDayPrice: string;
    lastDayPriceExpiration: number;
    lastPrice: string;
    lowestAsk: string;
    priceChangeHive: string;
    priceChangePercent: string;
    symbol: string;
    volume: string;
    volumeExpiration: number;
}

interface HiveEngineOrderBookEntry {
    _id: number;
    txId: string;
    timestamp: number;
    account: string;
    symbol: string;
    quantity: string;
    price: string;
    expiration: number;
    tokensLocked?: string;
}

interface HiveEngineOpenOrder {
    id: string;
    type: "buy" | "sell";
    account: string;
    symbol: string;
    quantity: string;
    price: string;
    total: string;
    timestamp: number;
}

interface Token {
    issuer: string;
    symbol: string;
    name: string;
    metadata: string;
    precision: number;
    maxSupply: string;
    supply: string;
    circulatingSupply: string;
    stakingEnabled: boolean;
    unstakingCooldown: number;
    delegationEnabled: boolean;
    undelegationCooldown: number;
    numberTransactions: number;
    totalStaked: string;
}

interface TokenMetadata {
    desc: string;
    url: string;
    icon: string;
}

/**
 * Get all Hive Engine tokens with optional filtering by account and symbol
 * @param account - Optional account to filter tokens by
 * @param symbol - Optional symbol to filter tokens by
 */
declare function getAllHiveEngineTokensQueryOptions(account?: string, symbol?: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<HiveEngineTokenInfo[], Error, HiveEngineTokenInfo[], readonly ["assets", "hive-engine", "all-tokens", string | undefined, string | undefined]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<HiveEngineTokenInfo[], readonly ["assets", "hive-engine", "all-tokens", string | undefined, string | undefined], never> | undefined;
} & {
    queryKey: readonly ["assets", "hive-engine", "all-tokens", string | undefined, string | undefined] & {
        [dataTagSymbol]: HiveEngineTokenInfo[];
        [dataTagErrorSymbol]: Error;
    };
};

interface Options$1 {
    fractionDigits?: number;
    prefix?: string;
    suffix?: string;
}
declare function formattedNumber(value: number | string, options?: Options$1 | undefined): string;

interface HiveEngineTokenProps {
    symbol: string;
    name: string;
    icon: string;
    precision: number;
    stakingEnabled: boolean;
    delegationEnabled: boolean;
    balance: string;
    stake: string;
    delegationsIn: string;
    delegationsOut: string;
    usdValue: number;
}
declare class HiveEngineToken {
    symbol: string;
    name?: string;
    icon?: string;
    precision?: number;
    stakingEnabled?: boolean;
    delegationEnabled?: boolean;
    balance: number;
    stake: number;
    stakedBalance: number;
    delegationsIn: number;
    delegationsOut: number;
    usdValue: number;
    constructor(props: HiveEngineTokenProps);
    hasDelegations: () => boolean;
    delegations: () => string;
    staked: () => string;
    balanced: () => string;
}

interface DynamicProps {
    base: number;
    quote: number;
}
/**
 * Get token balances with USD values
 * @param account - Account to get balances for
 * @param dynamicProps - Dynamic props with base/quote for price calculation
 * @param allTokens - All token metrics for price info
 */
declare function getHiveEngineBalancesWithUsdQueryOptions(account: string, dynamicProps?: DynamicProps, allTokens?: HiveEngineTokenInfo[]): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<HiveEngineToken[], Error, HiveEngineToken[], readonly ["assets", "hive-engine", "balances-with-usd", string, DynamicProps | undefined, HiveEngineTokenInfo[] | undefined]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<HiveEngineToken[], readonly ["assets", "hive-engine", "balances-with-usd", string, DynamicProps | undefined, HiveEngineTokenInfo[] | undefined], never> | undefined;
} & {
    queryKey: readonly ["assets", "hive-engine", "balances-with-usd", string, DynamicProps | undefined, HiveEngineTokenInfo[] | undefined] & {
        [dataTagSymbol]: HiveEngineToken[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHiveEngineTokenGeneralInfoQueryOptions(username?: string, symbol?: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    layer: string;
    parts: {
        name: string;
        balance: number;
    }[];
}, Error, {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
    layer: string;
    parts: {
        name: string;
        balance: number;
    }[];
}, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        name: string;
        title: string;
        price: number;
        accountBalance: number;
        layer: string;
        parts: {
            name: string;
            balance: number;
        }[];
    }, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: {
            name: string;
            title: string;
            price: number;
            accountBalance: number;
            layer: string;
            parts: {
                name: string;
                balance: number;
            }[];
        };
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHiveEngineTokensMetadataQueryOptions(tokens: string[]): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<HiveEngineTokenMetadataResponse[], Error, HiveEngineTokenMetadataResponse[], readonly ["assets", "hive-engine", "metadata-list", string[]]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<HiveEngineTokenMetadataResponse[], readonly ["assets", "hive-engine", "metadata-list", string[]], never> | undefined;
} & {
    queryKey: readonly ["assets", "hive-engine", "metadata-list", string[]] & {
        [dataTagSymbol]: HiveEngineTokenMetadataResponse[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHiveEngineTokenTransactionsQueryOptions(username: string | undefined, symbol: string, limit?: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseInfiniteQueryOptions<HiveEngineTransaction[], Error, _tanstack_react_query.InfiniteData<HiveEngineTransaction[], unknown>, readonly unknown[], unknown>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<HiveEngineTransaction[], readonly unknown[], unknown> | undefined;
} & {
    queryKey: readonly unknown[] & {
        [dataTagSymbol]: _tanstack_react_query.InfiniteData<HiveEngineTransaction[], unknown>;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHiveEngineTokensMetricsQueryOptions(symbol: string, interval?: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<HiveEngineMetric[], Error, HiveEngineMetric[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<HiveEngineMetric[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: HiveEngineMetric[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHiveEngineTokensMarketQueryOptions(): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<HiveEngineMarketResponse[], Error, HiveEngineMarketResponse[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<HiveEngineMarketResponse[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: HiveEngineMarketResponse[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHiveEngineTokensBalancesQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<HiveEngineTokenBalance[], Error, HiveEngineTokenBalance[], readonly ["assets", "hive-engine", "balances", string]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<HiveEngineTokenBalance[], readonly ["assets", "hive-engine", "balances", string], never> | undefined;
} & {
    queryKey: readonly ["assets", "hive-engine", "balances", string] & {
        [dataTagSymbol]: HiveEngineTokenBalance[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getHiveEngineUnclaimedRewardsQueryOptions(username: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<HiveEngineTokenStatus[], Error, HiveEngineTokenStatus[], (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<HiveEngineTokenStatus[], (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: HiveEngineTokenStatus[];
        [dataTagErrorSymbol]: Error;
    };
};

interface DelegateEnginePayload<T extends HiveBasedAssetSignType> {
    from: string;
    to: string;
    amount: string;
    asset: string;
    type: T;
}
declare function delegateEngineToken<T extends HiveBasedAssetSignType>(payload: T extends "key" ? DelegateEnginePayload<T> & {
    key: PrivateKey;
} : DelegateEnginePayload<T>, auth?: AuthContext): Promise<unknown>;

interface UndelegateEnginePayload<T extends HiveBasedAssetSignType> {
    from: string;
    to: string;
    amount: string;
    asset: string;
    type: T;
}
declare function undelegateEngineToken<T extends HiveBasedAssetSignType>(payload: T extends "key" ? UndelegateEnginePayload<T> & {
    key: PrivateKey;
} : UndelegateEnginePayload<T>, auth?: AuthContext): Promise<unknown>;

interface StakeEnginePayload<T extends HiveBasedAssetSignType> {
    from: string;
    to: string;
    amount: string;
    asset: string;
    type: T;
}
declare function stakeEngineToken<T extends HiveBasedAssetSignType>(payload: T extends "key" ? StakeEnginePayload<T> & {
    key: PrivateKey;
} : StakeEnginePayload<T>, auth?: AuthContext): Promise<unknown>;

interface UnstakeEnginePayload<T extends HiveBasedAssetSignType> {
    from: string;
    to: string;
    amount: string;
    asset: string;
    type: T;
}
declare function unstakeEngineToken<T extends HiveBasedAssetSignType>(payload: T extends "key" ? UnstakeEnginePayload<T> & {
    key: PrivateKey;
} : UnstakeEnginePayload<T>, auth?: AuthContext): Promise<unknown>;

interface TransferEnginePayload<T extends HiveBasedAssetSignType> {
    from: string;
    to: string;
    amount: string;
    memo: string;
    asset: string;
    type: T;
}
declare function transferEngineToken<T extends HiveBasedAssetSignType>(payload: T extends "key" ? TransferEnginePayload<T> & {
    key: PrivateKey;
} : TransferEnginePayload<T>, auth?: AuthContext): Promise<unknown>;

type EngineOrderSignMethod = "key" | "keychain" | "hivesigner" | "hiveauth";
interface EngineOrderBroadcastOptions {
    method?: EngineOrderSignMethod;
    key?: PrivateKey;
    auth?: AuthContext;
}
declare const placeHiveEngineBuyOrder: (account: string, symbol: string, quantity: string, price: string, options?: EngineOrderBroadcastOptions) => Promise<unknown>;
declare const placeHiveEngineSellOrder: (account: string, symbol: string, quantity: string, price: string, options?: EngineOrderBroadcastOptions) => Promise<unknown>;
declare const cancelHiveEngineOrder: (account: string, type: "buy" | "sell", orderId: string, options?: EngineOrderBroadcastOptions) => Promise<unknown>;

interface ClaimRewardsPayload<T extends HiveBasedAssetSignType> {
    account: string;
    tokens: string[];
    type: T;
}
declare function claimHiveEngineRewards<T extends HiveBasedAssetSignType>(payload: T extends "key" ? ClaimRewardsPayload<T> & {
    key: PrivateKey;
} : ClaimRewardsPayload<T>, auth?: AuthContext): Promise<unknown>;

declare function useClaimPoints(username: string | undefined, accessToken: string | undefined, onSuccess?: () => void, onError?: Parameters<typeof useMutation>["0"]["onError"]): _tanstack_react_query.UseMutationResult<any, unknown, unknown, unknown>;

type PointsSignType = "key" | "keychain" | "hivesigner" | "hiveauth";
interface PointsTransferPayloadBase {
    from: string;
    to: string;
    amount: string;
    memo: string;
    type: PointsSignType;
}
type PointsTransferPayload<T extends PointsSignType> = T extends "key" ? PointsTransferPayloadBase & {
    key: PrivateKey;
} : PointsTransferPayloadBase;
declare function transferPoint<T extends PointsSignType>({ from, to, amount, memo, type, ...payload }: PointsTransferPayload<T>, auth?: AuthContext): Promise<unknown>;

declare function getPointsQueryOptions(username?: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    readonly points: any;
    readonly uPoints: any;
}, Error, {
    readonly points: any;
    readonly uPoints: any;
}, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        readonly points: any;
        readonly uPoints: any;
    }, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: {
            readonly points: any;
            readonly uPoints: any;
        };
        [dataTagErrorSymbol]: Error;
    };
};

declare function getPointsAssetGeneralInfoQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    name: string;
    title: string;
    price: number;
    accountBalance: number;
}, Error, {
    name: string;
    title: string;
    price: number;
    accountBalance: number;
}, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        name: string;
        title: string;
        price: number;
        accountBalance: number;
    }, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: {
            name: string;
            title: string;
            price: number;
            accountBalance: number;
        };
        [dataTagErrorSymbol]: Error;
    };
};

interface PointsResponse {
    points: string;
    unclaimed_points: string;
}

interface Points {
    points: string;
    uPoints: string;
}

declare enum PointTransactionType {
    CHECKIN = 10,
    LOGIN = 20,
    CHECKIN_EXTRA = 30,
    POST = 100,
    COMMENT = 110,
    VOTE = 120,
    REBLOG = 130,
    DELEGATION = 150,
    REFERRAL = 160,
    COMMUNITY = 170,
    TRANSFER_SENT = 998,
    TRANSFER_INCOMING = 999,
    MINTED = 991
}

interface PointTransaction {
    id: number;
    type: PointTransactionType;
    created: string;
    memo: string | null;
    amount: string;
    sender: string | null;
    receiver: string | null;
}

declare function getPointsAssetTransactionsQueryOptions(username: string | undefined, type?: PointTransactionType): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    created: Date;
    type: PointTransactionType;
    results: {
        amount: number;
        asset: string;
    }[];
    id: number;
    from: string | undefined;
    to: string | undefined;
    memo: string | undefined;
}[], Error, {
    created: Date;
    type: PointTransactionType;
    results: {
        amount: number;
        asset: string;
    }[];
    id: number;
    from: string | undefined;
    to: string | undefined;
    memo: string | undefined;
}[], (string | PointTransactionType | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        created: Date;
        type: PointTransactionType;
        results: {
            amount: number;
            asset: string;
        }[];
        id: number;
        from: string | undefined;
        to: string | undefined;
        memo: string | undefined;
    }[], (string | PointTransactionType | undefined)[], never> | undefined;
} & {
    queryKey: (string | PointTransactionType | undefined)[] & {
        [dataTagSymbol]: {
            created: Date;
            type: PointTransactionType;
            results: {
                amount: number;
                asset: string;
            }[];
            id: number;
            from: string | undefined;
            to: string | undefined;
            memo: string | undefined;
        }[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function useWalletOperation(username: string, asset: string, operation: AssetOperation, auth?: AuthContext): _tanstack_react_query.UseMutationResult<any, Error, Record<string, unknown>, unknown>;

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

interface Options {
    refetch: boolean;
    currency?: string;
}
declare function getAccountWalletAssetInfoQueryOptions(username: string, asset: string, options?: Options): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<GeneralAssetInfo | undefined, Error, GeneralAssetInfo | undefined, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<GeneralAssetInfo | undefined, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: GeneralAssetInfo | undefined;
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

interface VisionPortfolioWalletItem {
    symbol: string;
    info: GeneralAssetInfo;
    operations: AssetOperation[];
}
interface VisionPortfolioResponse {
    username: string;
    currency?: string;
    wallets: VisionPortfolioWalletItem[];
}
declare function getVisionPortfolioQueryOptions(username: string, currency?: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<VisionPortfolioResponse, Error, VisionPortfolioResponse, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<VisionPortfolioResponse, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: VisionPortfolioResponse;
        [dataTagErrorSymbol]: Error;
    };
};

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
declare function signTxAndBroadcast(client: Client, tx: Transaction, privateKey: string, chainId?: string): Promise<TransactionConfirmation$1>;

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

export { type AccountPointsResponse, type Asset, AssetOperation, type AuthorReward, type CancelTransferFromSavings, type ClaimRewardBalance, type CollateralizedConvert, type CommentBenefactor, type CommentPayoutUpdate, type CommentReward, type CurationReward, type DelegateEnginePayload, type DelegateVestingShares, type DelegatedVestingShare, type EcencyHiveKeys, type EcencyTokenMetadata, EcencyWalletBasicTokens, EcencyWalletCurrency, index as EcencyWalletsPrivateApi, type EffectiveCommentVote, type EngineOrderBroadcastOptions, type EngineOrderSignMethod, type ExternalTxParams, type ExternalWalletBalance, type FillCollateralizedConvertRequest, type FillConvertRequest, type FillOrder, type FillRecurrentTransfers, type FillVestingWithdraw, type GeneralAssetInfo, type GeneralAssetTransaction, HIVE_ACCOUNT_OPERATION_GROUPS, HIVE_OPERATION_LIST, HIVE_OPERATION_NAME_BY_ID, HIVE_OPERATION_ORDERS, type HiveAuthBroadcastHandler, type HiveAuthKeyType, type HiveBasedAssetSignType, type HiveEngineMarketResponse, type HiveEngineMetric, type HiveEngineOpenOrder, type HiveEngineOrderBookEntry, HiveEngineToken, type HiveEngineTokenBalance, type HiveEngineTokenInfo, type HiveEngineTokenMetadataResponse, type HiveEngineTokenStatus, type HiveEngineTransaction, type HiveKeyDerivation, type HiveMarketMetric, type HiveOperationFilter, type HiveOperationFilterKey, type HiveOperationFilterValue, type HiveOperationGroup, type HiveOperationName, type HiveRole, type HiveTransaction, type HiveWithdrawRoute, type Interest, type LimitOrderCancel, type LimitOrderCreate, NaiMap, type PointTransaction, PointTransactionType, type Points, type PointsResponse, type ProducerReward, type ProposalPay, type ReceivedVestingShare, type RecurrentTransfers, type ReturnVestingDelegation, type SetWithdrawRoute, type SpkApiWallet, type SpkMarkets, type StakeEnginePayload, Symbol, type Token, type TokenMetadata, type Transfer, type TransferEnginePayload, type TransferPayload, type TransferToSavings, type TransferToVesting, type TransformedSpkMarkets, type UndelegateEnginePayload, type UnstakeEnginePayload, type UpdateProposalVotes, type VisionPortfolioResponse, type VisionPortfolioWalletItem, type VoteProxy, type WithdrawVesting, broadcastWithWalletHiveAuth, buildAptTx, buildEthTx, buildExternalTx, buildPsbt, buildSolTx, buildTonTx, buildTronTx, cancelHiveEngineOrder, claimHiveEngineRewards, claimInterestHive, decryptMemoWithAccounts, decryptMemoWithKeys, delay, delegateEngineToken, delegateHive, deriveHiveKey, deriveHiveKeys, deriveHiveMasterPasswordKey, deriveHiveMasterPasswordKeys, detectHiveKeyDerivation, encryptMemoWithAccounts, encryptMemoWithKeys, formattedNumber, getAccountWalletAssetInfoQueryOptions, getAccountWalletListQueryOptions, getAllHiveEngineTokensQueryOptions, getAllTokensListQueryOptions, getBoundFetch, getHbdAssetGeneralInfoQueryOptions, getHbdAssetTransactionsQueryOptions, getHiveAssetGeneralInfoQueryOptions, getHiveAssetMetricQueryOptions, getHiveAssetTransactionsQueryOptions, getHiveAssetWithdrawalRoutesQueryOptions, getHiveEngineBalancesWithUsdQueryOptions, getHiveEngineTokenGeneralInfoQueryOptions, getHiveEngineTokenTransactionsQueryOptions, getHiveEngineTokensBalancesQueryOptions, getHiveEngineTokensMarketQueryOptions, getHiveEngineTokensMetadataQueryOptions, getHiveEngineTokensMetricsQueryOptions, getHiveEngineUnclaimedRewardsQueryOptions, getHivePowerAssetGeneralInfoQueryOptions, getHivePowerAssetTransactionsQueryOptions, getHivePowerDelegatesInfiniteQueryOptions, getHivePowerDelegatingsQueryOptions, getLarynxAssetGeneralInfoQueryOptions, getLarynxPowerAssetGeneralInfoQueryOptions, getPointsAssetGeneralInfoQueryOptions, getPointsAssetTransactionsQueryOptions, getPointsQueryOptions, getSpkAssetGeneralInfoQueryOptions, getSpkMarketsQueryOptions, getSpkWalletQueryOptions, getTokenOperationsQueryOptions, getTokenPriceQueryOptions, getVisionPortfolioQueryOptions, getWallet, hasWalletHiveAuthBroadcast, isEmptyDate, lockLarynx, mnemonicToSeedBip39, parseAsset, placeHiveEngineBuyOrder, placeHiveEngineSellOrder, powerDownHive, powerUpHive, powerUpLarynx, registerWalletHiveAuthBroadcast, resolveHiveOperationFilters, rewardSpk, signDigest, signExternalTx, signExternalTxAndBroadcast, signTx, signTxAndBroadcast, stakeEngineToken, transferEngineToken, transferFromSavingsHive, transferHive, transferLarynx, transferPoint, transferSpk, transferToSavingsHive, undelegateEngineToken, unstakeEngineToken, useClaimPoints, useClaimRewards, useGetExternalWalletBalanceQuery, useHiveKeysQuery, useImportWallet, useSaveWalletInformationToMetadata, useSeedPhrase, useWalletCreate, useWalletOperation, useWalletsCacheQuery, vestsToHp, withdrawVestingRouteHive };
