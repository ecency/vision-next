import i18next from "i18next";

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

    return null;
}
