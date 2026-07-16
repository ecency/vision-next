export function truncate(str: string, num: number): string {
  if (str.length <= num) {
    return str;
  }
  // Never cut through a surrogate pair (emoji etc.): a dangling high
  // surrogate renders as a replacement character.
  return str.slice(0, num).replace(/[\uD800-\uDBFF]$/, "") + "...";
}
