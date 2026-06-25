import i18next from "i18next";
import { EXCHANGE_ACCOUNTS } from "@/consts";

export function getUsernameError(username: string): string | null {
    if (!username) return i18next.t("sign-up.username-required");
    if (username.length > 16) return i18next.t("sign-up.username-max-length-error");

    const segments = username.split(".");

    for (const segment of segments) {
        if (segment.length < 3) {
            return i18next.t("sign-up.username-min-length-error");
        }
        if (!/^[\x00-\x7F]/.test(segment[0])) {
            return i18next.t("sign-up.username-no-ascii-first-letter-error");
        }
        if (!/^[a-z0-9-]+$/.test(segment)) {
            return i18next.t("sign-up.username-contains-symbols-error");
        }
        if (/^\d/.test(segment)) {
            return i18next.t("sign-up.username-starts-number");
        }
        if (segment.startsWith("-") || segment.endsWith("-")) {
            return i18next.t("sign-up.username-invalid-hyphen-position");
        }
    }

    // Block names that impersonate or are easily confused with a known exchange
    // deposit account. Sending funds to a look-alike account is unrecoverable, so
    // we steer the user to a more distinctive name. Checked last, after the
    // chain-validity rules, so a malformed name shows its format error first.
    if (isExchangeLikeUsername(username)) {
        return i18next.t("sign-up.username-resembles-exchange");
    }

    // Block the "uid" + digits pattern commonly abused for impersonation/phishing.
    if (hasRestrictedUsernamePrefix(username)) {
        return i18next.t("sign-up.username-restricted-prefix");
    }

    return null;
}

// Names of the form "uid" + digits (e.g. "uid12345") mimic the numeric user IDs
// that exchanges and services assign, and have been used to impersonate them.
// The check is separator/case-insensitive so "u.i.d.1"-style evasion still trips
// it, but plain words like "uidev" or "fluid" are left alone.
export function hasRestrictedUsernamePrefix(username: string): boolean {
    return /^uid\d/.test(normalizeForExchangeMatch(username));
}

// Strip everything but lowercase letters and digits so separator-only variations
// ("huobi-pro" vs "huobipro") and casing collapse to the same comparable form.
function normalizeForExchangeMatch(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Generic tails that exchanges append to a brand when naming a deposit account.
const GENERIC_EXCHANGE_SUFFIXES = ["deposit", "exchange", "steem", "hive", "pro"];

// Reduce a normalized account name to its distinctive brand, dropping a trailing
// generic suffix and trailing digits ("gateiodeposit" -> "gateio",
// "deepcrypto8" -> "deepcrypto"). Single-token names without such a tail
// ("bittrex", "blocktrades", "changelly") are returned unchanged, so their
// ordinary-word prefixes ("block", "change") never become a match target.
// Strips a single (outermost) suffix, which covers every account in the current
// list; a future account with a compounded tail (e.g. "brandproexchange") would
// need this extended to strip iteratively.
function exchangeBrandCore(normalized: string): string {
    const core = normalized.replace(/\d+$/, "");
    const suffix = GENERIC_EXCHANGE_SUFFIXES.find(
        (s) => core.length > s.length && core.endsWith(s)
    );
    return suffix ? core.slice(0, -suffix.length) : core;
}

// Classic iterative Levenshtein (single rolling row) for short username strings.
function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 0; i < a.length; i++) {
        const curr = [i + 1];
        for (let j = 0; j < b.length; j++) {
            const cost = a[i] === b[j] ? 0 : 1;
            curr.push(Math.min(prev[j + 1] + 1, curr[j] + 1, prev[j] + cost));
        }
        prev = curr;
    }
    return prev[b.length];
}

/**
 * True when `username` is identical or close enough to a known exchange deposit
 * account that it could be mistaken for one. Matching is intentionally
 * conservative to avoid false positives on ordinary names:
 *   1. exact match against the full account or its brand core, ignoring
 *      separators/casing ("huobi-pro" ~ "huobipro", "coinex" -> coinexdeposit);
 *   2. the chosen name embeds the full account name ("mybittrex") or, when the
 *      brand is distinct from the full name, the brand core ("upbitcoin");
 *   3. a single-character typo of the full account name ("bittrx").
 */
export function isExchangeLikeUsername(username: string): boolean {
    const candidate = normalizeForExchangeMatch(username);
    // Cheap early-out for 1-2 char inputs; anything still short simply fails every
    // rule below (brand cores are >= 4, full names >= 7, embed/typo need length).
    if (candidate.length < 3) return false;

    return EXCHANGE_ACCOUNTS.some((account) => {
        const exchange = normalizeForExchangeMatch(account);
        if (!exchange) return false;
        const core = exchangeBrandCore(exchange);

        // 1. exact match against the full account or its (>= 4 char) brand core.
        //    The >= 4 guard drops the only sub-4 core ("mxc", from "mxchive"), so a
        //    3-char fragment can't over-match; "mxchive" is still caught in full.
        if (candidate === exchange) return true;
        if (core.length >= 4 && candidate === core) return true;

        // 2. the chosen name wraps the whole account name, or the distinct brand core
        if (candidate.length > exchange.length && candidate.includes(exchange)) return true;
        if (
            core !== exchange &&
            core.length >= 4 &&
            candidate.length > core.length &&
            candidate.includes(core)
        ) {
            return true;
        }

        // 3. single-character typo of the full account name at comparable length
        if (Math.abs(candidate.length - exchange.length) <= 1 && levenshtein(candidate, exchange) <= 1) {
            return true;
        }

        return false;
    });
}
