export function isWaveLikePost(link: string) {
  try {
    const permlink = new URL(link, "https://ecency.com")
      .pathname.split("/")
      .filter(Boolean)
      .pop() ?? "";
    return (
      permlink.includes("re-ecencywaves") ||
      permlink.includes("re-leothreads") ||
      permlink.startsWith("wave-") ||
      permlink.startsWith("re-liketu-moments")
    );
  } catch {
    return false;
  }
}
