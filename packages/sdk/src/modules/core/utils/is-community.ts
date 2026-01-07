export function isCommunity(value: unknown) {
  return typeof value === "string" ? value.match(/^hive-\d+/) !== null : false;
}
