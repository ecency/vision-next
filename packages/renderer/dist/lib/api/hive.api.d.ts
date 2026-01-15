interface Entry {
    author?: string;
    permlink?: string;
    last_update?: string;
    body: any;
    json_metadata?: any;
}
export declare function getCachedPost(username: string, permlink: string): Promise<Entry | undefined>;
export {};
