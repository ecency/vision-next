import { LoginType } from "@/entities";
import { ExtensionAwareLoginType, resolveExtensionAwareLoginType } from "@/utils/login-extension";
import { classNameObject } from "@ui/util";
import { useEffect, useState } from "react";

// What the badge visually represents. This is display-only and intentionally
// separate from LoginType: all browser extensions (Keychain, Hive Keeper, Peak
// Vault) share the Keychain-compatible auth path and are persisted as login
// type "keychain", so the stored auth type must NOT be changed to tell them
// apart. The specific extension is read from the account's saved preference.
type BadgeKind = "metamask" | "keychain" | "keeper" | "peakvault" | "hivesigner" | "privateKey";

const ICONS: Record<BadgeKind, string | null> = {
  metamask: "/assets/metamask-fox.svg",
  keeper: "/assets/keeper.svg",
  peakvault: "/assets/peakvault.svg",
  keychain: "/assets/keychain.png",
  hivesigner: "/assets/hive-signer.svg",
  privateKey: null
};

const LABELS: Record<BadgeKind, string> = {
  metamask: "MetaMask",
  keeper: "Keeper",
  peakvault: "Vault",
  keychain: "Keychain",
  hivesigner: "HiveSigner",
  privateKey: "Private key"
};

function toBadgeKind(loginType?: ExtensionAwareLoginType | null): BadgeKind | undefined {
  switch (loginType) {
    case "metamask":
      return "metamask";
    case "hivesigner":
      return "hivesigner";
    case "privateKey":
      return "privateKey";
    case "keeper":
      return "keeper";
    case "peakvault":
      return "peakvault";
    case "keychain":
    case "keychain-mobile":
      return "keychain";
    default:
      return undefined;
  }
}

interface Props {
  username: string;
  loginType?: LoginType;
  compact?: boolean;
}

/**
 * Small badge overlaid on a user avatar showing which method that account
 * logged in with.
 *
 * Browser-extension logins are all stored as login type "keychain", so for a
 * desktop extension login the specific wallet (Keychain / Hive Keeper / Peak
 * Vault) is resolved from the account's saved per-user extension preference.
 * This runs in an effect to stay SSR-safe (the preference lives in localStorage)
 * and avoid a hydration mismatch: first paint uses the stored type, then the
 * client refines it. Only "keychain" is refined, never "keychain-mobile" -- the
 * mobile deep-link path is unrelated to the desktop extension preference.
 */
export function LoginTypeBadge({ username, loginType, compact = false }: Props) {
  // First paint uses the stored login type (deterministic / SSR-safe); the
  // effect then refines a desktop "keychain" login to the actual extension from
  // the account's saved preference (localStorage, client-only).
  const [kind, setKind] = useState<BadgeKind | undefined>(() => toBadgeKind(loginType));

  useEffect(() => {
    setKind(toBadgeKind(resolveExtensionAwareLoginType(loginType, username)));
  }, [username, loginType]);

  const src = (kind && ICONS[kind]) ?? "/assets/hive-logo.svg";
  const label = kind ? LABELS[kind] : loginType;

  return (
    <div
      className={classNameObject({
        "absolute -right-0.5 -bottom-0.5 rounded-full bg-white dark:bg-dark-200 flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden":
          true,
        "w-[13px] h-[13px]": compact,
        "w-4 h-4": !compact
      })}
      title={label}
    >
      <img
        src={src}
        alt=""
        className={classNameObject({
          "object-contain": true,
          "w-[9px] h-[9px]": compact,
          "w-[11px] h-[11px]": !compact
        })}
      />
    </div>
  );
}
