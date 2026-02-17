/**
 * Centralized query key definitions for all SDK queries.
 *
 * These key builders are the single source of truth for React Query cache keys.
 * Both SDK query options and web app consumers should reference these
 * instead of using inline string arrays.
 *
 * @example
 * ```typescript
 * import { QueryKeys } from "@ecency/sdk";
 *
 * // In query options
 * queryKey: QueryKeys.posts.entry(`/@${author}/${permlink}`)
 *
 * // In cache invalidation
 * queryClient.invalidateQueries({ queryKey: QueryKeys.posts.drafts(username) })
 * ```
 */
export const QueryKeys = {
  // ===========================================================================
  // Posts
  // ===========================================================================
  posts: {
    entry: (entryPath: string) => ["posts", "entry", entryPath],
    postHeader: (author: string, permlink?: string) =>
      ["posts", "post-header", author, permlink],
    content: (author: string, permlink: string) =>
      ["posts", "content", author, permlink],
    contentReplies: (author: string, permlink: string) =>
      ["posts", "content-replies", author, permlink],
    accountPosts: (
      username: string,
      filter: string,
      limit: number,
      observer: string
    ) => ["posts", "account-posts", username, filter, limit, observer],
    accountPostsPage: (
      username: string,
      filter: string,
      startAuthor: string,
      startPermlink: string,
      limit: number,
      observer: string
    ) =>
      [
        "posts",
        "account-posts-page",
        username,
        filter,
        startAuthor,
        startPermlink,
        limit,
        observer,
      ],
    userPostVote: (username: string, author: string, permlink: string) =>
      ["posts", "user-vote", username, author, permlink],
    reblogs: (username: string, limit: number) =>
      ["posts", "reblogs", username, limit],
    entryActiveVotes: (author?: string, permlink?: string) =>
      ["posts", "entry-active-votes", author, permlink],
    rebloggedBy: (author: string, permlink: string) =>
      ["posts", "reblogged-by", author, permlink],
    tips: (author: string, permlink: string) =>
      ["posts", "tips", author, permlink],
    normalize: (author: string, permlink: string) =>
      ["posts", "normalize", author, permlink],
    drafts: (activeUsername?: string) =>
      ["posts", "drafts", activeUsername],
    draftsInfinite: (activeUsername?: string, limit?: number) =>
      ["posts", "drafts", "infinite", activeUsername, limit],
    schedules: (activeUsername?: string) =>
      ["posts", "schedules", activeUsername],
    schedulesInfinite: (activeUsername?: string, limit?: number) =>
      ["posts", "schedules", "infinite", activeUsername, limit],
    fragments: (username?: string) =>
      ["posts", "fragments", username],
    fragmentsInfinite: (username?: string, limit?: number) =>
      ["posts", "fragments", "infinite", username, limit],
    images: (username?: string) => ["posts", "images", username],
    galleryImages: (activeUsername?: string) =>
      ["posts", "gallery-images", activeUsername],
    imagesInfinite: (username?: string, limit?: number) =>
      ["posts", "images", "infinite", username, limit],
    promoted: (type: string) => ["posts", "promoted", type],
    postsRanked: (
      sort: string,
      tag: string,
      limit: number,
      observer: string
    ) => ["posts", "posts-ranked", sort, tag, limit, observer],
    postsRankedPage: (
      sort: string,
      startAuthor: string,
      startPermlink: string,
      limit: number,
      tag: string,
      observer: string
    ) =>
      [
        "posts",
        "posts-ranked-page",
        sort,
        startAuthor,
        startPermlink,
        limit,
        tag,
        observer,
      ],
    discussions: (
      author: string,
      permlink: string,
      order: string,
      observer: string
    ) => ["posts", "discussions", author, permlink, order, observer],
    discussion: (author: string, permlink: string, observer: string) =>
      ["posts", "discussion", author, permlink, observer],
    deletedEntry: (entryPath: string) =>
      ["posts", "deleted-entry", entryPath],
    commentHistory: (
      author: string,
      permlink: string,
      onlyMeta: boolean
    ) => ["posts", "comment-history", author, permlink, onlyMeta],
    trendingTags: () => ["posts", "trending-tags"],
    trendingTagsWithStats: (limit: number) =>
      ["posts", "trending-tags", "stats", limit],
    wavesByHost: (host: string) =>
      ["posts", "waves", "by-host", host],
    wavesByTag: (host: string, tag: string) =>
      ["posts", "waves", "by-tag", host, tag],
    wavesFollowing: (host: string, username: string) =>
      ["posts", "waves", "following", host, username],
    wavesTrendingTags: (host: string, hours: number) =>
      ["posts", "waves", "trending-tags", host, hours],
    _prefix: ["posts"],
  },

  // ===========================================================================
  // Accounts
  // ===========================================================================
  accounts: {
    full: (username?: string) => ["get-account-full", username],
    list: (...usernames: string[]) =>
      ["accounts", "list", ...usernames],
    friends: (
      following: string,
      mode: string,
      followType: string,
      limit: number
    ) => ["accounts", "friends", following, mode, followType, limit],
    searchFriends: (username: string, mode: string, query: string) =>
      ["accounts", "friends", "search", username, mode, query],
    subscriptions: (username: string) =>
      ["accounts", "subscriptions", username],
    followCount: (username: string) =>
      ["accounts", "follow-count", username],
    recoveries: (username: string) =>
      ["accounts", "recoveries", username],
    pendingRecovery: (username: string) =>
      ["accounts", "recoveries", username, "pending-request"],
    checkWalletPending: (username: string, code: string | null) =>
      ["accounts", "check-wallet-pending", username, code],
    mutedUsers: (username: string) =>
      ["accounts", "muted-users", username],
    following: (
      follower: string,
      startFollowing: string,
      followType: string,
      limit: number
    ) =>
      [
        "accounts",
        "following",
        follower,
        startFollowing,
        followType,
        limit,
      ],
    followers: (
      following: string,
      startFollower: string,
      followType: string,
      limit: number
    ) =>
      [
        "accounts",
        "followers",
        following,
        startFollower,
        followType,
        limit,
      ],
    search: (query: string, excludeList?: string[]) =>
      ["accounts", "search", query, excludeList],
    profiles: (accounts: string[], observer: string) =>
      ["accounts", "profiles", accounts, observer],
    lookup: (query: string, limit: number) =>
      ["accounts", "lookup", query, limit],
    transactions: (username: string, group: string, limit: number) =>
      ["accounts", "transactions", username, group, limit],
    favourites: (activeUsername?: string) =>
      ["accounts", "favourites", activeUsername],
    favouritesInfinite: (activeUsername?: string, limit?: number) =>
      ["accounts", "favourites", "infinite", activeUsername, limit],
    checkFavourite: (activeUsername: string, targetUsername: string) =>
      [
        "accounts",
        "favourites",
        "check",
        activeUsername,
        targetUsername,
      ],
    relations: (reference: string, target: string) =>
      ["accounts", "relations", reference, target],
    bots: () => ["accounts", "bots"],
    voteHistory: (username: string, limit: number) =>
      ["accounts", "vote-history", username, limit],
    reputations: (query: string, limit: number) =>
      ["accounts", "reputations", query, limit],
    bookmarks: (activeUsername?: string) =>
      ["accounts", "bookmarks", activeUsername],
    bookmarksInfinite: (activeUsername?: string, limit?: number) =>
      ["accounts", "bookmarks", "infinite", activeUsername, limit],
    referrals: (username: string) =>
      ["accounts", "referrals", username],
    referralsStats: (username: string) =>
      ["accounts", "referrals-stats", username],
    _prefix: ["accounts"],
  },

  // ===========================================================================
  // Notifications
  // ===========================================================================
  notifications: {
    announcements: () => ["notifications", "announcements"],
    list: (activeUsername?: string, filter?: string) =>
      ["notifications", activeUsername, filter],
    unreadCount: (activeUsername?: string) =>
      ["notifications", "unread", activeUsername],
    settings: (activeUsername?: string) =>
      ["notifications", "settings", activeUsername],
    _prefix: ["notifications"],
  },

  // ===========================================================================
  // Core
  // ===========================================================================
  core: {
    rewardFund: (fundName: string) =>
      ["core", "reward-fund", fundName],
    dynamicProps: () => ["core", "dynamic-props"],
    chainProperties: () => ["core", "chain-properties"],
    _prefix: ["core"],
  },

  // ===========================================================================
  // Communities
  // ===========================================================================
  communities: {
    single: (name?: string, observer?: string) =>
      ["community", "single", name, observer],
    /** Prefix key for matching all observer variants of a community */
    singlePrefix: (name: string) =>
      ["community", "single", name] as const,
    context: (username: string, communityName: string) =>
      ["community", "context", username, communityName],
    rewarded: () => ["communities", "rewarded"],
    list: (sort: string, query: string, limit: number) =>
      ["communities", "list", sort, query, limit],
    subscribers: (communityName: string) =>
      ["communities", "subscribers", communityName],
    accountNotifications: (account: string, limit: number) =>
      ["communities", "account-notifications", account, limit],
  },

  // ===========================================================================
  // Proposals
  // ===========================================================================
  proposals: {
    list: () => ["proposals", "list"],
    proposal: (id: number) => ["proposals", "proposal", id],
    votes: (proposalId: number, voter: string, limit: number) =>
      ["proposals", "votes", proposalId, voter, limit],
    votesByUser: (voter: string) =>
      ["proposals", "votes", "by-user", voter],
  },

  // ===========================================================================
  // Search
  // ===========================================================================
  search: {
    topics: (q: string) => ["search", "topics", q],
    path: (q: string) => ["search", "path", q],
    account: (q: string, limit: number) =>
      ["search", "account", q, limit],
    results: (
      q: string,
      sort: string,
      hideLow: boolean,
      since?: string,
      scrollId?: string,
      votes?: number
    ) => ["search", q, sort, hideLow, since, scrollId, votes],
    controversialRising: (what: string, tag: string) =>
      ["search", "controversial-rising", what, tag],
    similarEntries: (author: string, permlink: string, query: string) =>
      ["search", "similar-entries", author, permlink, query],
    api: (
      q: string,
      sort: string,
      hideLow: boolean,
      since?: string,
      votes?: number
    ) => ["search", "api", q, sort, hideLow, since, votes],
  },

  // ===========================================================================
  // Witnesses
  // ===========================================================================
  witnesses: {
    list: (limit: number) => ["witnesses", "list", limit],
  },

  // ===========================================================================
  // Wallet
  // ===========================================================================
  wallet: {
    outgoingRcDelegations: (username: string, limit: number) =>
      ["wallet", "outgoing-rc-delegations", username, limit],
    vestingDelegations: (username: string, limit: number) =>
      ["wallet", "vesting-delegations", username, limit],
    withdrawRoutes: (account: string) =>
      ["wallet", "withdraw-routes", account],
    incomingRc: (username: string) =>
      ["wallet", "incoming-rc", username],
    conversionRequests: (account: string) =>
      ["wallet", "conversion-requests", account],
    receivedVestingShares: (username: string) =>
      ["wallet", "received-vesting-shares", username],
    savingsWithdraw: (account: string) =>
      ["wallet", "savings-withdraw", account],
    openOrders: (user: string) =>
      ["wallet", "open-orders", user],
    collateralizedConversionRequests: (account: string) =>
      ["wallet", "collateralized-conversion-requests", account],
    recurrentTransfers: (username: string) =>
      ["wallet", "recurrent-transfers", username],
    portfolio: (
      username: string,
      onlyEnabled: string,
      currency: string
    ) =>
      ["wallet", "portfolio", "v2", username, onlyEnabled, currency],
  },

  // ===========================================================================
  // Assets
  // ===========================================================================
  assets: {
    hiveGeneralInfo: (username: string) =>
      ["assets", "hive", "general-info", username],
    hiveTransactions: (username: string, limit: number, filterKey: string) =>
      ["assets", "hive", "transactions", username, limit, filterKey],
    hiveWithdrawalRoutes: (username: string) =>
      ["assets", "hive", "withdrawal-routes", username],
    hiveMetrics: (bucketSeconds: number) =>
      ["assets", "hive", "metrics", bucketSeconds],
    hbdGeneralInfo: (username: string) =>
      ["assets", "hbd", "general-info", username],
    hbdTransactions: (
      username: string,
      limit: number,
      filterKey: string
    ) => ["assets", "hbd", "transactions", username, limit, filterKey],
    hivePowerGeneralInfo: (username: string) =>
      ["assets", "hive-power", "general-info", username],
    hivePowerDelegates: (username: string) =>
      ["assets", "hive-power", "delegates", username],
    hivePowerDelegatings: (username: string) =>
      ["assets", "hive-power", "delegatings", username],
    hivePowerTransactions: (
      username: string,
      limit: number,
      filterKey: string
    ) =>
      [
        "assets",
        "hive-power",
        "transactions",
        username,
        limit,
        filterKey,
      ],
    pointsGeneralInfo: (username: string) =>
      ["assets", "points", "general-info", username],
    pointsTransactions: (username: string, type: string) =>
      ["assets", "points", "transactions", username, type],
    ecencyAssetInfo: (username: string, asset: string, currency: string) =>
      ["ecency-wallets", "asset-info", username, asset, currency],
  },

  // ===========================================================================
  // Market
  // ===========================================================================
  market: {
    statistics: () => ["market", "statistics"],
    orderBook: (limit: number) => ["market", "order-book", limit],
    history: (seconds: number, startDate: number, endDate: number) =>
      ["market", "history", seconds, startDate, endDate],
    feedHistory: () => ["market", "feed-history"],
    hiveHbdStats: () => ["market", "hive-hbd-stats"],
    data: (
      coin: string,
      vsCurrency: string,
      fromTs: number,
      toTs: number
    ) => ["market", "data", coin, vsCurrency, fromTs, toTs],
    tradeHistory: (limit: number, start: number, end: number) =>
      ["market", "trade-history", limit, start, end],
    currentMedianHistoryPrice: () =>
      ["market", "current-median-history-price"],
  },

  // ===========================================================================
  // Analytics
  // ===========================================================================
  analytics: {
    discoverCuration: (duration: string) =>
      ["analytics", "discover-curation", duration],
    pageStats: (
      url: string,
      dimensions: string,
      metrics: string,
      dateRange: string
    ) =>
      ["analytics", "page-stats", url, dimensions, metrics, dateRange],
    discoverLeaderboard: (duration: string) =>
      ["analytics", "discover-leaderboard", duration],
  },

  // ===========================================================================
  // Promotions
  // ===========================================================================
  promotions: {
    promotePrice: () => ["promotions", "promote-price"],
    boostPlusPrices: () => ["promotions", "boost-plus-prices"],
    boostPlusAccounts: (account: string) =>
      ["promotions", "boost-plus-accounts", account],
  },

  // ===========================================================================
  // Resource Credits
  // ===========================================================================
  resourceCredits: {
    account: (username: string) =>
      ["resource-credits", "account", username],
    stats: () => ["resource-credits", "stats"],
  },

  // ===========================================================================
  // Points
  // ===========================================================================
  points: {
    points: (username: string, filter: number) =>
      ["points", username, filter],
  },

  // ===========================================================================
  // Operations
  // ===========================================================================
  operations: {
    chainProperties: () => ["operations", "chain-properties"],
  },

  // ===========================================================================
  // Games
  // ===========================================================================
  games: {
    statusCheck: (gameType: string, username: string) =>
      ["games", "status-check", gameType, username],
  },
} as const;
