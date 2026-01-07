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

interface Payload$4 {
    profile: Partial<AccountProfile>;
    tokens: AccountProfile["tokens"];
}
declare function useAccountUpdate(username: string, accessToken: string | undefined, auth?: {
    postingKey?: string | null;
    loginType?: string | null;
}): _tanstack_react_query.UseMutationResult<unknown, Error, Partial<Payload$4>, unknown>;

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
    profile: {
        reputation: number;
        about?: string;
        cover_image?: string;
        location?: string;
        name?: string;
        profile_image?: string;
        website?: string;
        pinned?: string;
        beneficiary?: {
            account: string;
            weight: number;
        };
        tokens?: {
            symbol: string;
            type: string;
            meta: Record<string, any>;
        }[];
    };
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
    profile: {
        reputation: number;
        about?: string;
        cover_image?: string;
        location?: string;
        name?: string;
        profile_image?: string;
        website?: string;
        pinned?: string;
        beneficiary?: {
            account: string;
            weight: number;
        };
        tokens?: {
            symbol: string;
            type: string;
            meta: Record<string, any>;
        }[];
    };
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
        profile: {
            reputation: number;
            about?: string;
            cover_image?: string;
            location?: string;
            name?: string;
            profile_image?: string;
            website?: string;
            pinned?: string;
            beneficiary?: {
                account: string;
                weight: number;
            };
            tokens?: {
                symbol: string;
                type: string;
                meta: Record<string, any>;
            }[];
        };
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
            profile: {
                reputation: number;
                about?: string;
                cover_image?: string;
                location?: string;
                name?: string;
                profile_image?: string;
                website?: string;
                pinned?: string;
                beneficiary?: {
                    account: string;
                    weight: number;
                };
                tokens?: {
                    symbol: string;
                    type: string;
                    meta: Record<string, any>;
                }[];
            };
        };
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

declare function checkUsernameWalletsPendingQueryOptions(username: string): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<{
    exist: boolean;
}, Error, {
    exist: boolean;
}, string[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<{
        exist: boolean;
    }, string[], never> | undefined;
} & {
    queryKey: string[] & {
        [dataTagSymbol]: {
            exist: boolean;
        };
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

declare function getAccountRecoveriesQueryOptions(username: string | undefined, code: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<GetRecoveriesEmailResponse[], Error, GetRecoveriesEmailResponse[], (string | undefined)[]>, "queryFn"> & {
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

declare function useBroadcastMutation<T>(mutationKey: MutationKey | undefined, username: string | undefined, accessToken: string | undefined, operations: (payload: T) => Operation[], onSuccess?: UseMutationOptions<unknown, Error, T>["onSuccess"], auth?: {
    postingKey?: string | null;
    loginType?: string | null;
}): _tanstack_react_query.UseMutationResult<unknown, Error, T, unknown>;

declare function broadcastJson<T>(username: string | undefined, id: string, payload: T, accessToken?: string, auth?: {
    postingKey?: string | null;
    loginType?: string | null;
}): Promise<any>;

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

declare function getAccountTokenQueryOptions(username: string | undefined, accessToken: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<any, Error, any, (string | undefined)[]>, "queryFn"> & {
    queryFn?: _tanstack_react_query.QueryFunction<any, (string | undefined)[], never> | undefined;
} & {
    queryKey: (string | undefined)[] & {
        [dataTagSymbol]: any;
        [dataTagErrorSymbol]: Error;
    };
};

declare function getAccountVideosQueryOptions(username: string | undefined, accessToken: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<ThreeSpeakVideo[], Error, ThreeSpeakVideo[], (string | undefined)[]>, "queryFn"> & {
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

declare function getDecodeMemoQueryOptions(username: string, memo: string, accessToken: string | undefined): _tanstack_react_query.OmitKeyof<_tanstack_react_query.UseQueryOptions<any, Error, any, string[]>, "queryFn"> & {
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

export { type AccountBookmark, type AccountFavorite, type AccountFollowStats, type AccountProfile, type AccountRelationship, type AccountReputation, type Asset, CONFIG, type CantAfford, type Communities, type Community, type CommunityRole, type CommunityTeam, type CommunityType, ConfigManager, type DynamicProps, index as EcencyAnalytics, EcencyQueriesManager, type Fragment, type FullAccount, type GameClaim, type GetGameStatus, type GetRecoveriesEmailResponse, HiveSignerIntegration, keychain as Keychain, type Keys, NaiMap, type Payer, ROLES, type RcStats, type Recoveries, type StatsResponse, type StoringUser, Symbol, ThreeSpeakIntegration, type ThreeSpeakVideo, type TrendingTag, broadcastJson, checkUsernameWalletsPendingQueryOptions, decodeObj, dedupeAndSortKeyAuths, encodeObj, getAccessToken, getAccountFullQueryOptions, getAccountPendingRecoveryQueryOptions, getAccountRcQueryOptions, getAccountRecoveriesQueryOptions, getAccountSubscriptionsQueryOptions, getActiveAccountBookmarksQueryOptions, getActiveAccountFavouritesQueryOptions, getBoundFetch, getChainPropertiesQueryOptions, getCommunitiesQueryOptions, getCommunityContextQueryOptions, getCommunityPermissions, getCommunityType, getDynamicPropsQueryOptions, getFragmentsQueryOptions, getGameStatusCheckQueryOptions, getHivePoshLinksQueryOptions, getLoginType, getPostingKey, getPromotedPostsQuery, getQueryClient, getRcStatsQueryOptions, getRefreshToken, getRelationshipBetweenAccountsQueryOptions, getSearchAccountsByUsernameQueryOptions, getStatsQueryOptions, getTrendingTagsQueryOptions, getUser, makeQueryClient, parseAsset, roleMap, useAccountFavouriteAdd, useAccountFavouriteDelete, useAccountRelationsUpdate, useAccountRevokeKey, useAccountRevokePosting, useAccountUpdate, useAccountUpdateKeyAuths, useAccountUpdatePassword, useAccountUpdateRecovery, useAddFragment, useBookmarkAdd, useBookmarkDelete, useBroadcastMutation, useEditFragment, useGameClaim, useRemoveFragment, useSignOperationByHivesigner, useSignOperationByKey, useSignOperationByKeychain };
