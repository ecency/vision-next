export function isCommunity(s: any) {
  return typeof s === "string" ? s.match(/^hive-\d+/) !== null : false;
}
