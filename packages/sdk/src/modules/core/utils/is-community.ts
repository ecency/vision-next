export function isCommunity(value: unknown) {
  return typeof value === "string" ? /^hive-\d+$/.test(value) : false;
}
