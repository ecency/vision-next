import * as _tanstack_react_query from '@tanstack/react-query';
import { UseMutationOptions, MutationKey, QueryClient, QueryKey, InfiniteData, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query';
import * as _hiveio_dhive from '@hiveio/dhive';
import { Authority, PrivateKey, AuthorityType, PublicKey, Operation, Client, SMTAsset } from '@hiveio/dhive';
import * as _hiveio_dhive_lib_chain_rc from '@hiveio/dhive/lib/chain/rc';

interface AccountFollowStats {
    follower_count: number;
    following_count: number;
    account: string;
}

interface AccountReputation {
    account: string;
    reputation: number;
}

interface AccountProfile {
    about?: string;
    cover_image?: string;
    location?: string;
    name?: string;
    profile_image?: string;
    website?: string;
    pinned?: string;
    reputation?: number;
    version?: number;
    beneficiary?: {
        account: string;
        weight: number;
    };
    tokens?: {
        symbol: string;
        type: string;
        meta: Record<string, any>;
    }[];
}

interface FullAccount {
    name: string;
    owner: Authority;
    active: Authority;
    posting: Authority;
    memo_key: string;
    post_count: number;
    created: string;
    reputation: string | number;
    json_metadata: string;
    posting_json_metadata: string;
    last_vote_time: string;
    last_post: string;
    reward_hbd_balance: string;
    reward_vesting_hive: string;
    reward_hive_balance: string;
    reward_vesting_balance: string;
    balance: string;
    vesting_shares: string;
    hbd_balance: string;
    savings_balance: string;
    savings_hbd_balance: string;
    savings_hbd_seconds: string;
    savings_hbd_last_interest_payment: string;
    savings_hbd_seconds_last_update: string;
    next_vesting_withdrawal: string;
    pending_claimed_accounts: number;
    delegated_vesting_shares: string;
    received_vesting_shares: string;
    vesting_withdraw_rate: string;
    to_withdraw: string;
    withdrawn: string;
    witness_votes: string[];
    proxy: string;
    recovery_account: string;
    proxied_vsf_votes: number[] | string[];
    voting_manabar: {
        current_mana: string | number;
        last_update_time: number;
    };
    voting_power: number;
    downvote_manabar: {
        current_mana: string | number;
        last_update_time: number;
    };
    profile?: AccountProfile;
    follow_stats?: AccountFollowStats;
    proxyVotes?: [];
}

interface AccountRelationship {
    follows: boolean;
    ignores: boolean;
    is_blacklisted: boolean;
    follows_blacklists: boolean;
}

interface AccountBookmark {
    _id: string;
    author: string;
    permlink: string;
    timestamp: number;
    created: string;
}

interface AccountFavorite {
    _id: string;
    account: string;
    timestamp: number;
}

interface Recoveries {
    username: string;
    email: string;
    publicKeys: Record<string, number>;
}
interface GetRecoveriesEmailResponse extends Recoveries {
    _id: string;
}

interface Follow {
    follower: string;
    following: string;
    what: string[];
}

interface Payload$4 {
    profile: Partial<AccountProfile>;
    tokens: AccountProfile["tokens"];
}
declare function useAccountUpdate(username: string): _tanstack_react_query.UseMutationResult<unknown, Error, Partial<Payload$4>, unknown>;

type Kind = "toggle-ignore" | "toggle-follow";
declare function useAccountRelationsUpdate(reference: string | undefined, target: string | undefined, onSuccess: (data: Partial<AccountRelationship> | undefined) => void, onError: (e: Error) => void): _tanstack_react_query.UseMutationResult<{
    ignores: boolean | undefined;
    follows: boolean | undefined;
    is_blacklisted?: boolean | undefined;
    follows_blacklists?: boolean | undefined;
}, Error, Kind, unknown>;

interface Payload$3 {
    author: string;
    permlink: string;
}
declare function useBookmarkAdd(username: string | undefined, onSuccess: () => void, onError: (e: Error) => void): _tanstack_react_query.UseMutationResult<any, Error, Payload$3, unknown>;

declare function useBookmarkDelete(username: string | undefined, onSuccess: () => void, onError: (e: Error) => void): _tanstack_react_query.UseMutationResult<any, Error, string, unknown>;

declare function useAccountFavouriteAdd(username: string | undefined, onSuccess: () => void, onError: (e: Error) => void): _tanstack_react_query.UseMutationResult<any, Error, string, unknown>;

declare function useAccountFavouriteDelete(username: string | undefined, onSuccess: () => void, onError: (e: Error) => void): _tanstack_react_query.UseMutationResult<any, Error, string, unknown>;

interface Keys {
    owner: PrivateKey;
    active: PrivateKey;
    posting: PrivateKey;
    memo_key: PrivateKey;
}
interface Payload$2 {
    keepCurrent?: boolean;
    currentKey: PrivateKey;
    keys: Keys[];
}
declare function dedupeAndSortKeyAuths(existing: AuthorityType["key_auths"], additions: [string, number][]): AuthorityType["key_auths"];
type UpdateKeyAuthsOptions = Pick<UseMutationOptions<unknown, Error, Payload$2>, "onSuccess" | "onError">;
declare function useAccountUpdateKeyAuths(username: string, options?: UpdateKeyAuthsOptions): _tanstack_react_query.UseMutationResult<_hiveio_dhive.TransactionConfirmation, Error, Payload$2, unknown>;

interface Payload$1 {
    newPassword: string;
    currentPassword: string;
    keepCurrent?: boolean;
}
/**
 * Only native Hive and custom passwords could be updated here
 * Seed based password cannot be updated here, it will be in an account always for now
 */
type UpdatePasswordOptions = Pick<UseMutationOptions<unknown, Error, Payload$1>, "onSuccess" | "onError">;
declare function useAccountUpdatePassword(username: string, options?: UpdatePasswordOptions): _tanstack_react_query.UseMutationResult<_hiveio_dhive.TransactionConfirmation, Error, Payload$1, unknown>;

type SignType$1 = "key" | "keychain" | "hivesigner";
interface CommonPayload$1 {
    accountName: string;
    type: SignType$1;
    key?: PrivateKey;
}
type RevokePostingOptions = Pick<UseMutationOptions<unknown, Error, CommonPayload$1>, "onSuccess" | "onError">;
declare function useAccountRevokePosting(username: string | undefined, options: RevokePostingOptions): _tanstack_react_query.UseMutationResult<any, Error, CommonPayload$1, unknown>;

type SignType = "key" | "keychain" | "hivesigner" | "ecency";
interface CommonPayload {
    accountName: string;
    type: SignType;
    key?: PrivateKey;
    email?: string;
}
type UpdateRecoveryOptions = Pick<UseMutationOptions<unknown, Error, CommonPayload>, "onSuccess" | "onError">;
declare function useAccountUpdateRecovery(username: string | undefined, options: UpdateRecoveryOptions): _tanstack_react_query.UseMutationResult<unknown, Error, CommonPayload, unknown>;

interface Payload {
    currentKey: PrivateKey;
    revokingKey: PublicKey;
}
/**
 * This hook provides functionality to revoke a key from an account on the Hive blockchain.
 * It leverages React Query's `useMutation` for managing the mutation state and executing
 * the operation efficiently.
 *
 * @param username The username of the Hive account from which the key should be revoked.
 *                 Pass `undefined` if the username is unknown or not set yet.
 *
 * @returns The mutation object from `useMutation`, including methods to trigger the key
 *          revocation and access its state (e.g., loading, success, error).
 */
type RevokeKeyOptions = Pick<UseMutationOptions<unknown, Error, Payload>, "onSuccess" | "onError">;
declare function useAccountRevokeKey(username: string | undefined, options?: RevokeKeyOptions): _tanstack_react_query.UseMutationResult<_hiveio_dhive.TransactionConfirmation, Error, Payload, unknown>;

declare function getAccountFullQueryOptions(username: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    name: any;
    owner: any;
    active: any;
    posting: any;
    memo_key: any;
    post_count: any;
    created: any;
    posting_json_metadata: any;
    last_vote_time: any;
    last_post: any;
    json_metadata: any;
    reward_hive_balance: any;
    reward_hbd_balance: any;
    reward_vesting_hive: any;
    reward_vesting_balance: any;
    balance: any;
    hbd_balance: any;
    savings_balance: any;
    savings_hbd_balance: any;
    savings_hbd_last_interest_payment: any;
    savings_hbd_seconds_last_update: any;
    savings_hbd_seconds: any;
    next_vesting_withdrawal: any;
    pending_claimed_accounts: any;
    vesting_shares: any;
    delegated_vesting_shares: any;
    received_vesting_shares: any;
    vesting_withdraw_rate: any;
    to_withdraw: any;
    withdrawn: any;
    witness_votes: any;
    proxy: any;
    recovery_account: any;
    proxied_vsf_votes: any;
    voting_manabar: any;
    voting_power: any;
    downvote_manabar: any;
    follow_stats: AccountFollowStats | undefined;
    reputation: number;
    profile: AccountProfile;
}, Error, {
    name: any;
    owner: any;
    active: any;
    posting: any;
    memo_key: any;
    post_count: any;
    created: any;
    posting_json_metadata: any;
    last_vote_time: any;
    last_post: any;
    json_metadata: any;
    reward_hive_balance: any;
    reward_hbd_balance: any;
    reward_vesting_hive: any;
    reward_vesting_balance: any;
    balance: any;
    hbd_balance: any;
    savings_balance: any;
    savings_hbd_balance: any;
    savings_hbd_last_interest_payment: any;
    savings_hbd_seconds_last_update: any;
    savings_hbd_seconds: any;
    next_vesting_withdrawal: any;
    pending_claimed_accounts: any;
    vesting_shares: any;
    delegated_vesting_shares: any;
    received_vesting_shares: any;
    vesting_withdraw_rate: any;
    to_withdraw: any;
    withdrawn: any;
    witness_votes: any;
    proxy: any;
    recovery_account: any;
    proxied_vsf_votes: any;
    voting_manabar: any;
    voting_power: any;
    downvote_manabar: any;
    follow_stats: AccountFollowStats | undefined;
    reputation: number;
    profile: AccountProfile;
}, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        name: any;
        owner: any;
        active: any;
        posting: any;
        memo_key: any;
        post_count: any;
        created: any;
        posting_json_metadata: any;
        last_vote_time: any;
        last_post: any;
        json_metadata: any;
        reward_hive_balance: any;
        reward_hbd_balance: any;
        reward_vesting_hive: any;
        reward_vesting_balance: any;
        balance: any;
        hbd_balance: any;
        savings_balance: any;
        savings_hbd_balance: any;
        savings_hbd_last_interest_payment: any;
        savings_hbd_seconds_last_update: any;
        savings_hbd_seconds: any;
        next_vesting_withdrawal: any;
        pending_claimed_accounts: any;
        vesting_shares: any;
        delegated_vesting_shares: any;
        received_vesting_shares: any;
        vesting_withdraw_rate: any;
        to_withdraw: any;
        withdrawn: any;
        witness_votes: any;
        proxy: any;
        recovery_account: any;
        proxied_vsf_votes: any;
        voting_manabar: any;
        voting_power: any;
        downvote_manabar: any;
        follow_stats: AccountFollowStats | undefined;
        reputation: number;
        profile: AccountProfile;
    }, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: {
            name: any;
            owner: any;
            active: any;
            posting: any;
            memo_key: any;
            post_count: any;
            created: any;
            posting_json_metadata: any;
            last_vote_time: any;
            last_post: any;
            json_metadata: any;
            reward_hive_balance: any;
            reward_hbd_balance: any;
            reward_vesting_hive: any;
            reward_vesting_balance: any;
            balance: any;
            hbd_balance: any;
            savings_balance: any;
            savings_hbd_balance: any;
            savings_hbd_last_interest_payment: any;
            savings_hbd_seconds_last_update: any;
            savings_hbd_seconds: any;
            next_vesting_withdrawal: any;
            pending_claimed_accounts: any;
            vesting_shares: any;
            delegated_vesting_shares: any;
            received_vesting_shares: any;
            vesting_withdraw_rate: any;
            to_withdraw: any;
            withdrawn: any;
            witness_votes: any;
            proxy: any;
            recovery_account: any;
            proxied_vsf_votes: any;
            voting_manabar: any;
            voting_power: any;
            downvote_manabar: any;
            follow_stats: AccountFollowStats | undefined;
            reputation: number;
            profile: AccountProfile;
        };
        [dataTagErrorSymbol]: Error;
    };
};

/**
 * Get multiple accounts by usernames
 */
declare function getAccountsQueryOptions(usernames: string[]): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<FullAccount[], Error, FullAccount[], (string | string[])[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<FullAccount[], (string | string[])[], never> | undefined;
} & {
    queryKey: (string | string[])[] & {
        [dataTagSymbol]: FullAccount[];
        [dataTagErrorSymbol]: Error;
    };
};

/**
 * Get follow count (followers and following) for an account
 */
declare function getFollowCountQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<AccountFollowStats, Error, AccountFollowStats, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<AccountFollowStats, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: AccountFollowStats;
        [dataTagErrorSymbol]: Error;
    };
};

/**
 * Get list of accounts that a user is following
 *
 * @param follower - The account doing the following
 * @param startFollowing - Pagination start point (account name)
 * @param followType - Type of follow relationship (default: "blog")
 * @param limit - Maximum number of results (default: 100)
 */
declare function getFollowingQueryOptions(follower: string | undefined, startFollowing: string, followType?: string, limit?: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<Follow[], Error, Follow[], (string | number | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Follow[], (string | number | undefined)[], never> | undefined;
} & {
    queryKey: (string | number | undefined)[] & {
        [dataTagSymbol]: Follow[];
        [dataTagErrorSymbol]: Error;
    };
};

/**
 * Get list of users that an account has muted
 *
 * @param username - The account username
 * @param limit - Maximum number of results (default: 100)
 */
declare function getMutedUsersQueryOptions(username: string | undefined, limit?: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<string[], Error, string[], (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<string[], (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: string[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getSearchAccountsByUsernameQueryOptions(query: string, limit?: number, excludeList?: string[]): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<string[], Error, string[], (string | string[])[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<string[], (string | string[])[], never> | undefined;
} & {
    queryKey: (string | string[])[] & {
        [dataTagSymbol]: string[];
        [dataTagErrorSymbol]: Error;
    };
};

type AccountProfileToken = NonNullable<AccountProfile["tokens"]>[number];
type WalletMetadataCandidate = Partial<AccountProfileToken> & {
    currency?: string;
    show?: boolean;
    address?: string;
    publicKey?: string;
    privateKey?: string;
    username?: string;
};
interface CheckUsernameWalletsPendingResponse {
    exist: boolean;
    tokens?: WalletMetadataCandidate[];
    wallets?: WalletMetadataCandidate[];
}
declare function checkUsernameWalletsPendingQueryOptions(username: string, code: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<CheckUsernameWalletsPendingResponse, Error, CheckUsernameWalletsPendingResponse, readonly unknown[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<CheckUsernameWalletsPendingResponse, readonly unknown[], never> | undefined;
} & {
    queryKey: readonly unknown[] & {
        [dataTagSymbol]: CheckUsernameWalletsPendingResponse;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getRelationshipBetweenAccountsQueryOptions(reference: string | undefined, target: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<AccountRelationship, Error, AccountRelationship, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<AccountRelationship, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: AccountRelationship;
        [dataTagErrorSymbol]: Error;
    };
};

type Subscriptions = string[];
declare function getAccountSubscriptionsQueryOptions(username: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<Subscriptions, Error, Subscriptions, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Subscriptions, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: Subscriptions;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getActiveAccountBookmarksQueryOptions(activeUsername: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<AccountBookmark[], Error, AccountBookmark[], (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<AccountBookmark[], (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: AccountBookmark[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getActiveAccountFavouritesQueryOptions(activeUsername: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<AccountFavorite[], Error, AccountFavorite[], (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<AccountFavorite[], (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: AccountFavorite[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getAccountRecoveriesQueryOptions(username: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<GetRecoveriesEmailResponse[], Error, GetRecoveriesEmailResponse[], (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<GetRecoveriesEmailResponse[], (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: GetRecoveriesEmailResponse[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getAccountPendingRecoveryQueryOptions(username: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<any, Error, any, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<any, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: any;
        [dataTagErrorSymbol]: Error;
    };
};

type ProfileTokens = AccountProfile["tokens"];
interface BuildProfileMetadataArgs {
    existingProfile?: AccountProfile;
    profile?: Partial<AccountProfile> | null;
    tokens?: ProfileTokens | null;
}
declare function parseProfileMetadata(postingJsonMetadata?: string | null): AccountProfile;
declare function extractAccountProfile(data?: Pick<FullAccount, "posting_json_metadata"> | null): AccountProfile;
declare function buildProfileMetadata({ existingProfile, profile, tokens, }: BuildProfileMetadataArgs): AccountProfile;

/**
 * Parses raw account data from Hive API into FullAccount type
 * Handles profile metadata extraction from posting_json_metadata or json_metadata
 */
declare function parseAccounts(rawAccounts: any[]): FullAccount[];

declare function useSignOperationByKey(username: string | undefined): _tanstack_react_query.UseMutationResult<_hiveio_dhive.TransactionConfirmation, Error, {
    operation: Operation;
    keyOrSeed: string;
}, unknown>;

type KeychainAuthorityTypes = "Owner" | "Active" | "Posting" | "Memo";
interface TxResponse {
    success: boolean;
    result: string;
}
declare function handshake(): Promise<void>;
declare const broadcast: (account: string, operations: Operation[], key: KeychainAuthorityTypes, rpc?: string | null) => Promise<TxResponse>;
declare const customJson: (account: string, id: string, key: KeychainAuthorityTypes, json: string, display_msg: string, rpc?: string | null) => Promise<TxResponse>;

type keychain_KeychainAuthorityTypes = KeychainAuthorityTypes;
declare const keychain_broadcast: typeof broadcast;
declare const keychain_customJson: typeof customJson;
declare const keychain_handshake: typeof handshake;
declare namespace keychain {
  export { type keychain_KeychainAuthorityTypes as KeychainAuthorityTypes, keychain_broadcast as broadcast, keychain_customJson as customJson, keychain_handshake as handshake };
}

declare function useSignOperationByKeychain(username: string | undefined, keyType?: KeychainAuthorityTypes): _tanstack_react_query.UseMutationResult<any, Error, {
    operation: Operation;
}, unknown>;

declare function useSignOperationByHivesigner(callbackUri?: string): _tanstack_react_query.UseMutationResult<string | void, Error, {
    operation: Operation;
}, unknown>;

declare function getChainPropertiesQueryOptions(): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<_hiveio_dhive.ChainProperties, Error, _hiveio_dhive.ChainProperties, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<_hiveio_dhive.ChainProperties, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: _hiveio_dhive.ChainProperties;
        [dataTagErrorSymbol]: Error;
    };
};

declare function useBroadcastMutation<T>(mutationKey: MutationKey | undefined, username: string | undefined, operations: (payload: T) => Operation[], onSuccess?: UseMutationOptions<unknown, Error, T>["onSuccess"]): _tanstack_react_query.UseMutationResult<unknown, Error, T, unknown>;

declare function broadcastJson<T>(username: string | undefined, id: string, payload: T): Promise<any>;

interface StoringUser {
    username: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    postingKey: null | undefined | string;
    loginType: null | undefined | string;
    index?: number;
}

declare const getUser: (username: string) => StoringUser | undefined;
declare const getAccessToken: (username: string) => string | undefined;
declare const getPostingKey: (username: string) => null | undefined | string;
declare const getLoginType: (username: string) => null | undefined | string;
declare const getRefreshToken: (username: string) => string | undefined;

declare const CONFIG: {
    privateApiHost: string;
    storage: Storage;
    storagePrefix: string;
    hiveClient: Client;
    heliusApiKey: string | undefined;
    queryClient: QueryClient;
    plausibleHost: string;
    spkNode: string;
};
declare namespace ConfigManager {
    function setQueryClient(client: QueryClient): void;
}

declare function makeQueryClient(): QueryClient;
declare const getQueryClient: () => QueryClient;
declare namespace EcencyQueriesManager {
    function getQueryData<T>(queryKey: QueryKey): T | undefined;
    function getInfiniteQueryData<T>(queryKey: QueryKey): InfiniteData<T, unknown> | undefined;
    function prefetchQuery<T>(options: UseQueryOptions<T>): Promise<T | undefined>;
    function prefetchInfiniteQuery<T, P>(options: UseInfiniteQueryOptions<T, Error, InfiniteData<T>, QueryKey, P>): Promise<InfiniteData<T, unknown> | undefined>;
    function generateClientServerQuery<T>(options: UseQueryOptions<T>): {
        prefetch: () => Promise<T | undefined>;
        getData: () => T | undefined;
        useClientQuery: () => _tanstack_react_query.UseQueryResult<_tanstack_react_query.NoInfer<T>, Error>;
        fetchAndGet: () => Promise<T>;
    };
    function generateClientServerInfiniteQuery<T, P>(options: UseInfiniteQueryOptions<T, Error, InfiniteData<T>, QueryKey, P>): {
        prefetch: () => Promise<InfiniteData<T, unknown> | undefined>;
        getData: () => InfiniteData<T, unknown> | undefined;
        useClientQuery: () => _tanstack_react_query.UseInfiniteQueryResult<InfiniteData<T, unknown>, Error>;
        fetchAndGet: () => Promise<InfiniteData<T, P>>;
    };
}

interface DynamicProps {
    hivePerMVests: number;
    base: number;
    quote: number;
    fundRewardBalance: number;
    fundRecentClaims: number;
    hbdPrintRate: number;
    hbdInterestRate: number;
    headBlock: number;
    totalVestingFund: number;
    totalVestingShares: number;
    virtualSupply: number;
    vestingRewardPercent: number;
    accountCreationFee: string;
}

declare function getDynamicPropsQueryOptions(): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<DynamicProps, Error, DynamicProps, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<DynamicProps, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: DynamicProps;
        [dataTagErrorSymbol]: Error;
    };
};

declare function encodeObj(o: any): string;
declare function decodeObj(o: any): any;

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

declare function getBoundFetch(): typeof fetch;

declare function getTrendingTagsQueryOptions(limit?: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseInfiniteQueryOptions<string[], Error, _tanstack_react_query.InfiniteData<string[], unknown>, string[], {
    afterTag: string;
}>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<string[], string[], {
        afterTag: string;
    }> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: _tanstack_react_query.InfiniteData<string[], unknown>;
        [dataTagErrorSymbol]: Error;
    };
};

interface TrendingTag {
    comments: number;
    name: string;
    top_posts: number;
    total_payouts: string;
}

interface Fragment {
    id: string;
    title: string;
    body: string;
    created: string;
    modified: string;
}

interface EntryBeneficiaryRoute {
    account: string;
    weight: number;
}
interface EntryVote {
    voter: string;
    rshares: number;
}
interface EntryStat {
    flag_weight: number;
    gray: boolean;
    hide: boolean;
    total_votes: number;
    is_pinned?: boolean;
}
interface JsonMetadata {
    tags?: string[];
    description?: string | null;
    app?: any;
    canonical_url?: string;
    format?: string;
    original_author?: string;
    original_permlink?: string;
    image?: string[];
    pinned_reply?: string;
    location?: {
        coordinates: {
            lat: number;
            lng: number;
        };
        address?: string;
    };
}
interface JsonPollMetadata {
    content_type: "poll";
    version: number;
    question: string;
    choices: string[];
    preferred_interpretation: string;
    token: string;
    vote_change: boolean;
    hide_votes: boolean;
    filters: {
        account_age: number;
    };
    end_time: number;
    max_choices_voted?: number;
}
interface Entry {
    last_update?: string;
    active_votes: EntryVote[];
    author: string;
    author_payout_value: string;
    author_reputation: number;
    author_role?: string;
    author_title?: string;
    beneficiaries: EntryBeneficiaryRoute[];
    blacklists: string[];
    body: string;
    category: string;
    children: number;
    community?: string;
    community_title?: string;
    created: string;
    total_votes?: number;
    curator_payout_value: string;
    depth: number;
    is_paidout: boolean;
    json_metadata: JsonMetadata | null;
    max_accepted_payout: string;
    net_rshares: number;
    parent_author?: string;
    parent_permlink?: string;
    payout: number;
    payout_at: string;
    pending_payout_value: string;
    percent_hbd: number;
    permlink: string;
    post_id: any;
    id?: number;
    num?: number;
    promoted: string;
    reblogs?: number;
    reblogged_by?: string[] | any;
    replies: any[];
    stats: EntryStat | null;
    title: string;
    updated: string;
    url: string;
    original_entry?: Entry;
    is_optimistic?: boolean;
}
interface EntryHeader {
    author: string;
    category: string;
    permlink: string;
    depth: number;
}
interface Vote {
    percent: number;
    reputation: number;
    rshares: string;
    time: string;
    timestamp?: number;
    voter: string;
    weight: number;
}

declare function getFragmentsQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<Fragment[], Error, Fragment[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Fragment[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: Fragment[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getPromotedPostsQuery<T extends any>(type?: "feed" | "waves"): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<T[], Error, T[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<T[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: T[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getEntryActiveVotesQueryOptions(entry?: Entry): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<Vote[], Error, Vote[], (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Vote[], (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: Vote[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function getPostHeaderQueryOptions(author: string, permlink: string): Omit<_tanstack_react_query.UseQueryOptions<Entry | null, Error, Entry | null, string[]>, "queryFn"> & {
    initialData: Entry | (() => Entry | null) | null;
    queryFn?: _tanstack_react_query.QueryFunction<Entry | null, string[]> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: Entry | null;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getPostQueryOptions(author: string, permlink?: string, observer?: string, num?: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<Entry | null, Error, Entry | null, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Entry | null, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: Entry | null;
        [dataTagErrorSymbol]: Error;
    };
};

declare enum SortOrder {
    trending = "trending",
    author_reputation = "author_reputation",
    votes = "votes",
    created = "created"
}
declare function sortDiscussions(entry: Entry, discussion: Entry[], order: SortOrder): Entry[];
declare function getDiscussionsQueryOptions(entry: Entry, order?: SortOrder, enabled?: boolean, observer?: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<Entry[], Error, Entry[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Entry[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: Entry[];
        [dataTagErrorSymbol]: Error;
    };
};

type PageParam$1 = {
    author: string | undefined;
    permlink: string | undefined;
    hasNextPage: boolean;
};
type Page = Entry[];
declare function getAccountPostsInfiniteQueryOptions(username: string | undefined, filter?: string, limit?: number, observer?: string, enabled?: boolean): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseInfiniteQueryOptions<Page, Error, Page, (string | number)[], PageParam$1>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Page, (string | number)[], PageParam$1> | undefined;
} & {
    queryKey: (string | number)[] & {
        [dataTagSymbol]: _tanstack_react_query.InfiniteData<Page, unknown>;
        [dataTagErrorSymbol]: Error;
    };
};

type PageParam = {
    author: string | undefined;
    permlink: string | undefined;
    hasNextPage: boolean;
};
interface GetPostsRankedOptions {
    resolvePosts?: boolean;
}
declare function getPostsRankedInfiniteQueryOptions(sort: string, tag: string, limit?: number, observer?: string, enabled?: boolean, _options?: GetPostsRankedOptions): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseInfiniteQueryOptions<Entry[], Error, Entry[], (string | number)[], PageParam>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Entry[], (string | number)[], PageParam> | undefined;
} & {
    queryKey: (string | number)[] & {
        [dataTagSymbol]: _tanstack_react_query.InfiniteData<Entry[], unknown>;
        [dataTagErrorSymbol]: Error;
    };
};

interface BlogEntry {
    author: string;
    permlink: string;
    blog: string;
    reblog_on: string;
    reblogged_on: string;
    entry_id: number;
}
interface Reblog {
    author: string;
    permlink: string;
}
declare function getReblogsQueryOptions(username?: string, activeUsername?: string, limit?: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<Reblog[], Error, Reblog[], (string | number)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Reblog[], (string | number)[], never> | undefined;
} & {
    queryKey: (string | number)[] & {
        [dataTagSymbol]: Reblog[];
        [dataTagErrorSymbol]: Error;
    };
};

declare function useAddFragment(username: string): _tanstack_react_query.UseMutationResult<Fragment, Error, {
    title: string;
    body: string;
}, unknown>;

declare function useEditFragment(username: string, fragmentId: string): _tanstack_react_query.UseMutationResult<Fragment, Error, {
    title: string;
    body: string;
}, unknown>;

declare function useRemoveFragment(username: string, fragmentId: string): _tanstack_react_query.UseMutationResult<Response, Error, void, unknown>;

type ActivityType = "post-created" | "post-updated" | "post-scheduled" | "draft-created" | "video-published" | "legacy-post-created" | "legacy-post-updated" | "legacy-post-scheduled" | "legacy-draft-created" | "legacy-video-published" | "perks-points-by-qr" | "perks-account-boost" | "perks-promote" | "perks-boost-plus" | "points-claimed" | "spin-rolled" | "signed-up-with-wallets" | "signed-up-with-email";
declare function useRecordActivity(username: string | undefined, activityType: ActivityType): _tanstack_react_query.UseMutationResult<void, Error, void, unknown>;

declare const index_useRecordActivity: typeof useRecordActivity;
declare namespace index {
  export { index_useRecordActivity as useRecordActivity };
}

interface ThreeSpeakVideo {
    app: string;
    beneficiaries: string;
    category: string;
    community: unknown | null;
    created: string;
    declineRewards: boolean;
    description: string;
    donations: boolean;
    duration: number;
    encoding: Record<number, boolean>;
    encodingProgress: number;
    encoding_price_steem: string;
    filename: string;
    firstUpload: boolean;
    fromMobile: boolean;
    height: unknown;
    hive: string;
    indexed: boolean;
    is3CJContent: boolean;
    isNsfwContent: boolean;
    isReel: boolean;
    isVOD: boolean;
    job_id: string;
    language: string;
    local_filename: string;
    lowRc: boolean;
    needsBlockchainUpdate: boolean;
    originalFilename: string;
    owner: string;
    paid: boolean;
    permlink: string;
    postToHiveBlog: boolean;
    publish_type: string;
    reducedUpvote: boolean;
    rewardPowerup: boolean;
    size: number;
    status: string;
    tags_v2: unknown[];
    thumbUrl: string;
    thumbnail: string;
    title: string;
    updateSteem: boolean;
    upload_type: string;
    upvoteEligible: boolean;
    video_v2: string;
    views: number;
    votePercent: number;
    width: unknown;
    __v: number;
    _id: string;
}

declare function getAccountTokenQueryOptions(username: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<any, Error, any, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<any, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: any;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getAccountVideosQueryOptions(username: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<ThreeSpeakVideo[], Error, ThreeSpeakVideo[], (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<ThreeSpeakVideo[], (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: ThreeSpeakVideo[];
        [dataTagErrorSymbol]: Error;
    };
};

declare const queries$1_getAccountTokenQueryOptions: typeof getAccountTokenQueryOptions;
declare const queries$1_getAccountVideosQueryOptions: typeof getAccountVideosQueryOptions;
declare namespace queries$1 {
  export { queries$1_getAccountTokenQueryOptions as getAccountTokenQueryOptions, queries$1_getAccountVideosQueryOptions as getAccountVideosQueryOptions };
}

declare const ThreeSpeakIntegration: {
    queries: typeof queries$1;
};

declare function getDecodeMemoQueryOptions(username: string, memo: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<any, Error, any, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<any, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: any;
        [dataTagErrorSymbol]: Error;
    };
};

declare const queries_getDecodeMemoQueryOptions: typeof getDecodeMemoQueryOptions;
declare namespace queries {
  export { queries_getDecodeMemoQueryOptions as getDecodeMemoQueryOptions };
}

declare const HiveSignerIntegration: {
    queries: typeof queries;
};

declare function getHivePoshLinksQueryOptions(username: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    twitter: {
        username: any;
        profile: any;
    };
    reddit: {
        username: any;
        profile: any;
    };
}, Error, {
    twitter: {
        username: any;
        profile: any;
    };
    reddit: {
        username: any;
        profile: any;
    };
}, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        twitter: {
            username: any;
            profile: any;
        };
        reddit: {
            username: any;
            profile: any;
        };
    }, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: {
            twitter: {
                username: any;
                profile: any;
            };
            reddit: {
                username: any;
                profile: any;
            };
        };
        [dataTagErrorSymbol]: Error;
    };
};

interface StatsResponse {
    results: [
        {
            metrics: number[];
            dimensions: string[];
        }
    ];
    query: {
        site_id: string;
        metrics: string[];
        date_range: string[];
        filters: string[];
    };
}
interface UseStatsQueryOptions {
    url: string;
    dimensions?: string[];
    metrics?: string[];
    enabled?: boolean;
}
declare function getStatsQueryOptions({ url, dimensions, metrics, enabled, }: UseStatsQueryOptions): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<StatsResponse, Error, StatsResponse, (string | string[])[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<StatsResponse, (string | string[])[], never> | undefined;
} & {
    queryKey: (string | string[])[] & {
        [dataTagSymbol]: StatsResponse;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getRcStatsQueryOptions(): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<any, Error, any, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<any, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: any;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getAccountRcQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<_hiveio_dhive_lib_chain_rc.RCAccount[], Error, _hiveio_dhive_lib_chain_rc.RCAccount[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<_hiveio_dhive_lib_chain_rc.RCAccount[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: _hiveio_dhive_lib_chain_rc.RCAccount[];
        [dataTagErrorSymbol]: Error;
    };
};

interface RcStats {
    block: number;
    budget: number[];
    comment: number;
    ops: Ops;
    payers: Payer[];
    pool: number[];
    regen: number;
    share: number[];
    stamp: string;
    transfer: number;
    vote: number;
}
interface Ops {
    account_create_operation: OperationCost;
    account_update2_operation: OperationCost;
    account_update_operation: OperationCost;
    account_witness_proxy_operation: OperationCost;
    account_witness_vote_operation: OperationCost;
    cancel_transfer_from_savings_operation: OperationCost;
    change_recovery_account_operation: OperationCost;
    claim_account_operation: OperationCost;
    claim_reward_balance_operation: OperationCost;
    collateralized_convert_operation: OperationCost;
    comment_operation: OperationCost;
    comment_options_operation: OperationCost;
    convert_operation: OperationCost;
    create_claimed_account_operation: OperationCost;
    custom_json_operation: OperationCost;
    delegate_vesting_shares_operation: OperationCost;
    delete_comment_operation: OperationCost;
    feed_publish_operation: OperationCost;
    limit_order_cancel_operation: OperationCost;
    limit_order_create_operation: OperationCost;
    multiop: OperationCost;
    recover_account_operation: OperationCost;
    recurrent_transfer_operation: OperationCost;
    request_account_recovery_operation: OperationCost;
    set_withdraw_vesting_route_operation: OperationCost;
    transfer_from_savings_operation: OperationCost;
    transfer_operation: OperationCost;
    transfer_to_savings_operation: OperationCost;
    transfer_to_vesting_operation: OperationCost;
    update_proposal_votes_operation: OperationCost;
    vote_operation: OperationCost;
    withdraw_vesting_operation: OperationCost;
    witness_set_properties_operation: OperationCost;
    witness_update_operation: OperationCost;
}
interface OperationCost {
    avg_cost: number;
    count: number;
}
interface Payer {
    cant_afford?: CantAfford;
    count: number;
    lt10?: number;
    lt20?: number;
    lt5?: number;
    rank: number;
}
interface CantAfford {
    comment: number;
    transfer: number;
    vote: number;
}

interface GetGameStatus {
    key: string;
    remaining: number;
    status: number;
    next_date: string;
    wait_secs: number;
}

interface GameClaim {
    score: number;
}

declare function getGameStatusCheckQueryOptions(username: string | undefined, gameType: "spin"): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<GetGameStatus, Error, GetGameStatus, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<GetGameStatus, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: GetGameStatus;
        [dataTagErrorSymbol]: Error;
    };
};

declare function useGameClaim(username: string | undefined, gameType: "spin", key: string): _tanstack_react_query.UseMutationResult<GameClaim, Error, void, unknown>;

declare enum ROLES {
    OWNER = "owner",
    ADMIN = "admin",
    MOD = "mod",
    MEMBER = "member",
    GUEST = "guest",
    MUTED = "muted"
}
declare const roleMap: Record<string, string[]>;
type CommunityTeam = Array<Array<string>>;
type CommunityRole = (typeof ROLES)[keyof typeof ROLES];
type CommunityType = "Topic" | "Journal" | "Council";
interface Community {
    about: string;
    admins?: string[];
    avatar_url: string;
    created_at: string;
    description: string;
    flag_text: string;
    id: number;
    is_nsfw: boolean;
    lang: string;
    name: string;
    num_authors: number;
    num_pending: number;
    subscribers: number;
    sum_pending: number;
    settings?: any;
    team: CommunityTeam;
    title: string;
    type_id: number;
}
type Communities = Community[];

declare function getCommunitiesQueryOptions(sort: string, query?: string, limit?: number, observer?: string | undefined, enabled?: boolean): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<Communities, Error, Communities, (string | number | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Communities, (string | number | undefined)[], never> | undefined;
} & {
    queryKey: (string | number | undefined)[] & {
        [dataTagSymbol]: Communities;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getCommunityContextQueryOptions(username: string | undefined, communityName: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    role: any;
    subscribed: any;
}, Error, {
    role: any;
    subscribed: any;
}, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        role: any;
        subscribed: any;
    }, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: {
            role: any;
            subscribed: any;
        };
        [dataTagErrorSymbol]: Error;
    };
};

declare function getCommunityType(name: string, type_id: number): CommunityType;
declare function getCommunityPermissions({ communityType, userRole, subscribed, }: {
    communityType: CommunityType;
    userRole: CommunityRole;
    subscribed: boolean;
}): {
    canPost: boolean;
    canComment: boolean;
    isModerator: boolean;
};

declare function getNotificationsUnreadCountQueryOptions(activeUsername: string | undefined): Omit<_tanstack_react_query.UseQueryOptions<number, Error, number, (string | undefined)[]>, "queryFn"> & {
    initialData: number | (() => number);
    queryFn?: _tanstack_react_query.QueryFunction<number, (string | undefined)[]> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: number;
        [dataTagErrorSymbol]: Error;
    };
};

declare enum NotificationFilter {
    VOTES = "rvotes",
    MENTIONS = "mentions",
    FAVORITES = "nfavorites",
    BOOKMARKS = "nbookmarks",
    FOLLOWS = "follows",
    REPLIES = "replies",
    REBLOGS = "reblogs",
    TRANSFERS = "transfers",
    DELEGATIONS = "delegations"
}

declare enum NotifyTypes {
    VOTE = 1,
    MENTION = 2,
    FOLLOW = 3,
    COMMENT = 4,
    RE_BLOG = 5,
    TRANSFERS = 6,
    FAVORITES = 13,
    BOOKMARKS = 15,
    ALLOW_NOTIFY = "ALLOW_NOTIFY"
}
declare const ALL_NOTIFY_TYPES: readonly [NotifyTypes.VOTE, NotifyTypes.MENTION, NotifyTypes.FOLLOW, NotifyTypes.COMMENT, NotifyTypes.RE_BLOG, NotifyTypes.TRANSFERS, NotifyTypes.FAVORITES, NotifyTypes.BOOKMARKS];
declare enum NotificationViewType {
    ALL = "All",
    UNREAD = "Unread",
    READ = "Read"
}

interface BaseWsNotification {
    source: string;
    target: string;
    timestamp: string;
}
interface WsVoteNotification extends BaseWsNotification {
    type: "vote";
    extra: {
        permlink: string;
        weight: number;
        title: string | null;
        img_url: string | null;
    };
}
interface WsMentionNotification extends BaseWsNotification {
    type: "mention";
    extra: {
        permlink: string;
        is_post: 0 | 1;
        title: string | null;
        img_url: string | null;
    };
}
interface WsFavoriteNotification extends BaseWsNotification {
    type: "favorites";
    extra: {
        permlink: string;
        is_post: 0 | 1;
        title: string | null;
    };
}
interface WsBookmarkNotification extends BaseWsNotification {
    type: "bookmarks";
    extra: {
        permlink: string;
        is_post: 0 | 1;
        title: string | null;
    };
}
interface WsFollowNotification extends BaseWsNotification {
    type: "follow";
    extra: {
        what: string[];
    };
}
interface WsReplyNotification extends BaseWsNotification {
    type: "reply";
    extra: {
        title: string;
        body: string;
        json_metadata: string;
        permlink: string;
        parent_author: string;
        parent_permlink: string;
        parent_title: string | null;
        parent_img_url: string | null;
    };
}
interface WsReblogNotification extends BaseWsNotification {
    type: "reblog";
    extra: {
        permlink: string;
        title: string | null;
        img_url: string | null;
    };
}
interface WsTransferNotification extends BaseWsNotification {
    type: "transfer";
    extra: {
        amount: string;
        memo: string;
    };
}
interface WsDelegationsNotification extends BaseWsNotification {
    type: "delegations";
    extra: {
        amount: string;
    };
}
interface WsSpinNotification extends BaseWsNotification {
    type: "spin";
}
interface WsInactiveNotification extends BaseWsNotification {
    type: "inactive";
}
interface WsReferralNotification extends BaseWsNotification {
    type: "referral";
}
type WsNotification = WsVoteNotification | WsMentionNotification | WsFavoriteNotification | WsBookmarkNotification | WsFollowNotification | WsReplyNotification | WsReblogNotification | WsTransferNotification | WsSpinNotification | WsInactiveNotification | WsReferralNotification | WsDelegationsNotification;
interface BaseAPiNotification {
    id: string;
    source: string;
    read: 0 | 1;
    timestamp: string;
    ts: number;
    gk: string;
    gkf: boolean;
}
interface ApiVoteNotification extends BaseAPiNotification {
    type: "vote" | "unvote";
    voter: string;
    weight: number;
    author: string;
    permlink: string;
    title: string | null;
    img_url: string | null;
}
interface ApiMentionNotification extends BaseAPiNotification {
    type: "mention";
    author: string;
    account: string;
    permlink: string;
    post: boolean;
    title: string | null;
    img_url: string | null;
    deck?: boolean;
}
interface ApiFollowNotification extends BaseAPiNotification {
    type: "follow" | "unfollow" | "ignore";
    follower: string;
    following: string;
    blog: boolean;
}
interface ApiReblogNotification extends BaseAPiNotification {
    type: "reblog";
    account: string;
    author: string;
    permlink: string;
    title: string | null;
    img_url: string | null;
}
interface ApiReplyNotification extends BaseAPiNotification {
    type: "reply";
    author: string;
    permlink: string;
    title: string;
    body: string;
    json_metadata: string;
    metadata: any;
    parent_author: string;
    parent_permlink: string;
    parent_title: string | null;
    parent_img_url: string | null;
}
interface ApiTransferNotification extends BaseAPiNotification {
    type: "transfer";
    to: string;
    amount: string;
    memo: string | null;
}
interface ApiFavoriteNotification extends BaseAPiNotification {
    type: "favorites";
    author: string;
    account: string;
    permlink: string;
    post: boolean;
    title: string | null;
}
interface ApiBookmarkNotification extends BaseAPiNotification {
    type: "bookmarks";
    author: string;
    account: string;
    permlink: string;
    post: boolean;
    title: string | null;
}
interface ApiSpinNotification extends BaseAPiNotification {
    type: "spin";
}
interface ApiInactiveNotification extends BaseAPiNotification {
    type: "inactive";
}
interface ApiReferralNotification extends BaseAPiNotification {
    type: "referral";
}
interface ApiDelegationsNotification extends BaseAPiNotification {
    type: "delegations";
    to: string;
    amount: string;
}
interface ApiNotificationSetting {
    system: string;
    allows_notify: number;
    notify_types: number[] | null;
    status: number;
}
type ApiNotification = ApiVoteNotification | ApiMentionNotification | ApiFavoriteNotification | ApiBookmarkNotification | ApiFollowNotification | ApiReblogNotification | ApiReplyNotification | ApiTransferNotification | ApiSpinNotification | ApiInactiveNotification | ApiReferralNotification | ApiDelegationsNotification;
interface Notifications {
    filter: NotificationFilter | null;
    unread: number;
    list: ApiNotification[];
    loading: boolean;
    hasMore: boolean;
    unreadFetchFlag: boolean;
    settings?: ApiNotificationSetting;
    fbSupport: "pending" | "granted" | "denied";
}

declare function getNotificationsInfiniteQueryOptions(activeUsername: string | undefined, filter?: NotificationFilter | undefined): _tanstack_react_query.UseInfiniteQueryOptions<ApiNotification[], Error, _tanstack_react_query.InfiniteData<ApiNotification[], unknown>, (string | undefined)[], string> & {
    initialData: _tanstack_react_query.InfiniteData<ApiNotification[], string> | (() => _tanstack_react_query.InfiniteData<ApiNotification[], string>) | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: _tanstack_react_query.InfiniteData<ApiNotification[], unknown>;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getNotificationsSettingsQueryOptions(activeUsername: string | undefined): Omit<_tanstack_react_query.UseQueryOptions<ApiNotificationSetting, Error, ApiNotificationSetting, (string | undefined)[]>, "queryFn"> & {
    initialData: ApiNotificationSetting | (() => ApiNotificationSetting);
    queryFn?: _tanstack_react_query.QueryFunction<ApiNotificationSetting, (string | undefined)[]> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: ApiNotificationSetting;
        [dataTagErrorSymbol]: Error;
    };
};

interface Proposal {
    creator: string;
    daily_pay: {
        amount: string;
        nai: string;
        precision: number;
    };
    end_date: string;
    id: number;
    permlink: string;
    proposal_id: number;
    receiver: string;
    start_date: string;
    status: string;
    subject: string;
    total_votes: string;
}

interface ProposalVote {
    id: number;
    proposal?: Proposal;
    voter: string;
}

/**
 * Get a single proposal by ID
 */
declare function getProposalQueryOptions(id: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<Proposal, Error, Proposal, (string | number)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Proposal, (string | number)[], never> | undefined;
} & {
    queryKey: (string | number)[] & {
        [dataTagSymbol]: Proposal;
        [dataTagErrorSymbol]: Error;
    };
};

/**
 * Get all proposals, sorted with expired proposals at the end
 */
declare function getProposalsQueryOptions(): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<Proposal[], Error, Proposal[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<Proposal[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: Proposal[];
        [dataTagErrorSymbol]: Error;
    };
};

type ProposalVoteRow = {
    id: number;
    voter: string;
    voterAccount: FullAccount;
};
/**
 * Get proposal votes with pagination and enriched voter account data
 *
 * @param proposalId - The proposal ID
 * @param voter - Starting voter for pagination
 * @param limit - Number of votes per page
 */
declare function getProposalVotesInfiniteQueryOptions(proposalId: number, voter: string, limit: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseInfiniteQueryOptions<ProposalVoteRow[], Error, ProposalVoteRow[], (string | number)[], string>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<ProposalVoteRow[], (string | number)[], string> | undefined;
} & {
    queryKey: (string | number)[] & {
        [dataTagSymbol]: _tanstack_react_query.InfiniteData<ProposalVoteRow[], unknown>;
        [dataTagErrorSymbol]: Error;
    };
};

/**
 * Fetches ALL proposal votes for a specific user in a single query.
 * Much more efficient than querying each proposal individually.
 * Uses "by_voter_proposal" order to get all votes by a user.
 */
declare function getUserProposalVotesQueryOptions(voter: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<ProposalVote[], Error, ProposalVote[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<ProposalVote[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: ProposalVote[];
        [dataTagErrorSymbol]: Error;
    };
};

interface DelegatedVestingShare {
    id: number;
    delegatee: string;
    delegator: string;
    min_delegation_time: string;
    vesting_shares: string;
}

interface ConversionRequest {
    amount: string;
    conversion_date: string;
    id: number;
    owner: string;
    requestid: number;
}
interface CollateralizedConversionRequest {
    collateral_amount: string;
    conversion_date: string;
    converted_amount: string;
    id: number;
    owner: string;
    requestid: number;
}

interface SavingsWithdrawRequest {
    id: number;
    from: string;
    to: string;
    memo: string;
    request_id: number;
    amount: string;
    complete: string;
}

interface WithdrawRoute {
    auto_vest: boolean;
    from_account: string;
    id: number;
    percent: number;
    to_account: string;
}

interface OpenOrdersData {
    id: number;
    created: string;
    expiration: string;
    seller: string;
    orderid: number;
    for_sale: number;
    sell_price: {
        base: string;
        quote: string;
    };
    real_price: string;
    rewarded: boolean;
}

/**
 * Get vesting delegations for an account
 *
 * @param username - The account username
 * @param from - Pagination start point (delegatee name)
 * @param limit - Maximum number of results (default: 50)
 */
declare function getVestingDelegationsQueryOptions(username?: string, from?: string, limit?: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<DelegatedVestingShare[], Error, DelegatedVestingShare[], (string | number | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<DelegatedVestingShare[], (string | number | undefined)[], never> | undefined;
} & {
    queryKey: (string | number | undefined)[] & {
        [dataTagSymbol]: DelegatedVestingShare[];
        [dataTagErrorSymbol]: Error;
    };
};

/**
 * Get HBD to HIVE conversion requests for an account
 *
 * @param account - The account username
 */
declare function getConversionRequestsQueryOptions(account: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<ConversionRequest[], Error, ConversionRequest[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<ConversionRequest[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: ConversionRequest[];
        [dataTagErrorSymbol]: Error;
    };
};

/**
 * Get collateralized HIVE to HBD conversion requests for an account
 *
 * @param account - The account username
 */
declare function getCollateralizedConversionRequestsQueryOptions(account: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<CollateralizedConversionRequest[], Error, CollateralizedConversionRequest[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<CollateralizedConversionRequest[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: CollateralizedConversionRequest[];
        [dataTagErrorSymbol]: Error;
    };
};

/**
 * Get pending savings withdrawal requests for an account
 *
 * @param account - The account username
 */
declare function getSavingsWithdrawFromQueryOptions(account: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<SavingsWithdrawRequest[], Error, SavingsWithdrawRequest[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<SavingsWithdrawRequest[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: SavingsWithdrawRequest[];
        [dataTagErrorSymbol]: Error;
    };
};

/**
 * Get power down (vesting withdrawal) routes for an account
 *
 * @param account - The account username
 */
declare function getWithdrawRoutesQueryOptions(account: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<WithdrawRoute[], Error, WithdrawRoute[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<WithdrawRoute[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: WithdrawRoute[];
        [dataTagErrorSymbol]: Error;
    };
};

/**
 * Get open market orders for an account
 *
 * @param user - The account username
 */
declare function getOpenOrdersQueryOptions(user: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<OpenOrdersData[], Error, OpenOrdersData[], string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<OpenOrdersData[], string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: OpenOrdersData[];
        [dataTagErrorSymbol]: Error;
    };
};

interface Witness {
    total_missed: number;
    url: string;
    props: {
        account_creation_fee: string;
        account_subsidy_budget: number;
        maximum_block_size: number;
    };
    hbd_exchange_rate: {
        base: string;
    };
    available_witness_account_subsidies: number;
    running_version: string;
    owner: string;
    signing_key: string;
    last_hbd_exchange_update: string;
}

type WitnessPage = Witness[];
/**
 * Get witnesses ordered by vote count (infinite scroll)
 *
 * @param limit - Number of witnesses per page
 */
declare function getWitnessesInfiniteQueryOptions(limit: number): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseInfiniteQueryOptions<WitnessPage, Error, WitnessPage, (string | number)[], string>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<WitnessPage, (string | number)[], string> | undefined;
} & {
    queryKey: (string | number)[] & {
        [dataTagSymbol]: _tanstack_react_query.InfiniteData<WitnessPage, unknown>;
        [dataTagErrorSymbol]: Error;
    };
};

export { ALL_NOTIFY_TYPES, type AccountBookmark, type AccountFavorite, type AccountFollowStats, type AccountProfile, type AccountRelationship, type AccountReputation, type ApiBookmarkNotification, type ApiDelegationsNotification, type ApiFavoriteNotification, type ApiFollowNotification, type ApiInactiveNotification, type ApiMentionNotification, type ApiNotification, type ApiNotificationSetting, type ApiReblogNotification, type ApiReferralNotification, type ApiReplyNotification, type ApiSpinNotification, type ApiTransferNotification, type ApiVoteNotification, type Asset, type BlogEntry, type BuildProfileMetadataArgs, CONFIG, type CantAfford, type CheckUsernameWalletsPendingResponse, type CollateralizedConversionRequest, type Communities, type Community, type CommunityRole, type CommunityTeam, type CommunityType, ConfigManager, type ConversionRequest, type DelegatedVestingShare, type DynamicProps, index as EcencyAnalytics, EcencyQueriesManager, type Entry, type EntryBeneficiaryRoute, type EntryHeader, type EntryStat, type EntryVote, type Follow, type Fragment, type FullAccount, type GameClaim, type GetGameStatus, type GetRecoveriesEmailResponse, HiveSignerIntegration, type JsonMetadata, type JsonPollMetadata, keychain as Keychain, type Keys, NaiMap, NotificationFilter, NotificationViewType, type Notifications, NotifyTypes, type OpenOrdersData, type Payer, type ProfileTokens, type Proposal, type ProposalVote, type ProposalVoteRow, ROLES, type RcStats, type Reblog, type Recoveries, type SavingsWithdrawRequest, SortOrder, type StatsResponse, type StoringUser, Symbol, ThreeSpeakIntegration, type ThreeSpeakVideo, type TrendingTag, type Vote, type WalletMetadataCandidate, type WithdrawRoute, type Witness, type WsBookmarkNotification, type WsDelegationsNotification, type WsFavoriteNotification, type WsFollowNotification, type WsInactiveNotification, type WsMentionNotification, type WsNotification, type WsReblogNotification, type WsReferralNotification, type WsReplyNotification, type WsSpinNotification, type WsTransferNotification, type WsVoteNotification, broadcastJson, buildProfileMetadata, checkUsernameWalletsPendingQueryOptions, decodeObj, dedupeAndSortKeyAuths, encodeObj, extractAccountProfile, getAccessToken, getAccountFullQueryOptions, getAccountPendingRecoveryQueryOptions, getAccountPostsInfiniteQueryOptions, getAccountRcQueryOptions, getAccountRecoveriesQueryOptions, getAccountSubscriptionsQueryOptions, getAccountsQueryOptions, getActiveAccountBookmarksQueryOptions, getActiveAccountFavouritesQueryOptions, getBoundFetch, getChainPropertiesQueryOptions, getCollateralizedConversionRequestsQueryOptions, getCommunitiesQueryOptions, getCommunityContextQueryOptions, getCommunityPermissions, getCommunityType, getConversionRequestsQueryOptions, getDiscussionsQueryOptions, getDynamicPropsQueryOptions, getEntryActiveVotesQueryOptions, getFollowCountQueryOptions, getFollowingQueryOptions, getFragmentsQueryOptions, getGameStatusCheckQueryOptions, getHivePoshLinksQueryOptions, getLoginType, getMutedUsersQueryOptions, getNotificationsInfiniteQueryOptions, getNotificationsSettingsQueryOptions, getNotificationsUnreadCountQueryOptions, getOpenOrdersQueryOptions, getPostHeaderQueryOptions, getPostQueryOptions, getPostingKey, getPostsRankedInfiniteQueryOptions, getPromotedPostsQuery, getProposalQueryOptions, getProposalVotesInfiniteQueryOptions, getProposalsQueryOptions, getQueryClient, getRcStatsQueryOptions, getReblogsQueryOptions, getRefreshToken, getRelationshipBetweenAccountsQueryOptions, getSavingsWithdrawFromQueryOptions, getSearchAccountsByUsernameQueryOptions, getStatsQueryOptions, getTrendingTagsQueryOptions, getUser, getUserProposalVotesQueryOptions, getVestingDelegationsQueryOptions, getWithdrawRoutesQueryOptions, getWitnessesInfiniteQueryOptions, makeQueryClient, parseAccounts, parseAsset, parseProfileMetadata, roleMap, sortDiscussions, useAccountFavouriteAdd, useAccountFavouriteDelete, useAccountRelationsUpdate, useAccountRevokeKey, useAccountRevokePosting, useAccountUpdate, useAccountUpdateKeyAuths, useAccountUpdatePassword, useAccountUpdateRecovery, useAddFragment, useBookmarkAdd, useBookmarkDelete, useBroadcastMutation, useEditFragment, useGameClaim, useRemoveFragment, useSignOperationByHivesigner, useSignOperationByKey, useSignOperationByKeychain };
