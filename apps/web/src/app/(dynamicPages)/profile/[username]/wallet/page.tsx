// NO loading.tsx in this directory, on purpose.
//
// Every other profile tab got its own leaf loading module when the shared
// profile/[username]/loading.tsx was deleted (#1787), so each tab kept the
// pending UI it had. wallet/ is the one segment that deliberately gets none: a
// loading module applies to its segment AND to every segment nested under it,
// and the wallet token routes below this one
// (wallet/(token)/[token]/_components/hive-engine-token-history.tsx) render
// post bodies through EcencyRenderer. A boundary here would sit above that
// markdown renderer and reproduce exactly the defect this change removes -
// shell flushed with a skeleton, rendered body outlined into a hidden segment
// that a $RC swap script reveals only once the parser reaches it (#1783/#1778).
// The renderer sits on ONE route below here, wallet/(token)/[token], which
// serves /@user/wallet/<token> (hive, hbd, points and every Hive Engine
// token). The wallet index and /@user/wallet/hp carry no markdown, so either
// could take a pending state later — scoped by a route group the way
// app/waves/(feed) is, never by a module on this segment. Left out of #1787 to
// keep it to one decision per route; the spec forbids only the modules that
// would wrap the token route.

import {
  ProfileWalletExternalBanner,
  ProfileWalletTokenPicker
} from "./_components";
import { ProfileWalletSummaryWrapper } from "./_components/profile-wallet-summary-wrapper";
import { Button } from "@/features/ui";
import { UilExchange } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "../_helpers";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace(/%40/g, ""), "wallet");
}

export default async function WalletPage(props: Props) {
  const { username } = await props.params;

  // Prefetch account data to avoid waterfall
  await prefetchQuery(getAccountFullQueryOptions(username.replace(/%40/g, "")));

  return (
    <>
      <ProfileWalletExternalBanner />
      <div className="flex justify-end mb-2 gap-2">
        <Button
          size="sm"
          appearance="gray-link"
          href="/market/limit"
          icon={<UilExchange />}
        >
          {i18next.t("profile-wallet.trade-tokens", {
            defaultValue: i18next.t("market-data.trade"),
          })}
        </Button>
        <ProfileWalletTokenPicker />
      </div>
      <ProfileWalletSummaryWrapper />
    </>
  );
}
