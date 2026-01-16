interface Entry {
  author?: string;
  permlink?: string;
  last_update?: string;
  body: any;
  json_metadata?: any;
}

const cache = new Map<string, Entry>();

export async function getCachedPost(username: string, permlink: string) {
  if (cache.has(`${username}/${permlink}`)) {
    return cache.get(`${username}/${permlink}`);
  }

  const response = (await (window as any).dHiveClient.call(
    "condenser_api",
    "get_content",
    [username, permlink],
  )) as Entry;

  cache.set(`${username}/${permlink}`, response);
  return response;
}
