"use client";

import React, { useState } from "react";
import "./_index.scss";
import { Popover, PopoverContent } from "@ui/popover";
import { EntryPayoutDetail } from "@/features/shared/entry-payout/entry-payout-detail";
import { parseAsset } from "@/utils";
import { FormattedCurrency } from "@/features/shared";
import { classNameObject } from "@ui/util";
import { Entry } from "@/entities";

interface Props {
  entry: Entry;
}

export const EntryPayout = ({ entry }: Props) => {
  const [showPopover, setShowPopover] = useState(false);

  const check = entry.max_accepted_payout;
  // Real search-API results expose a numeric `payout` and lack the asset-string
  // payout fields. Waves/RPC entries also carry an `id`, so detecting a search
  // result by id alone misrouted waves here and overrode the summed payout with a
  // missing numeric payout (rendering $0.000). Require the numeric payout AND the
  // absence of max_accepted_payout so only true search results take this branch.
  const isSearchResult =
    (entry.id || 0) > 0 && typeof entry.payout === "number" && !entry.max_accepted_payout;

  let isPayoutDeclined,
    pendingPayout,
    authorPayout,
    curatorPayout,
    maxPayout,
    totalPayout,
    payoutLimitHit,
    shownPayout;

  if (check) {
    isPayoutDeclined = parseAsset(entry.max_accepted_payout).amount === 0;

    pendingPayout = parseAsset(entry.pending_payout_value).amount;
    authorPayout = parseAsset(entry.author_payout_value).amount;
    curatorPayout = parseAsset(entry.curator_payout_value).amount;
    maxPayout = parseAsset(entry.max_accepted_payout).amount;
    totalPayout = pendingPayout + authorPayout + curatorPayout;
    payoutLimitHit = totalPayout >= maxPayout;
    shownPayout = payoutLimitHit && maxPayout > 0 ? maxPayout : totalPayout;
  }

  if (isSearchResult) {
    shownPayout = entry.payout;
  }

  return !isSearchResult ? (
    <div className="noselection">
      <Popover
        directContent={
          <div
            role="presentation"
            onMouseOver={() => setShowPopover(true)}
            onMouseLeave={() => setShowPopover(false)}
            className={classNameObject({
              "entry-payout notranslate": true,
              "payout-declined": isPayoutDeclined,
              "payout-limit-hit": payoutLimitHit
            })}
          >
            <FormattedCurrency value={shownPayout ?? 0} fixAt={3} />
          </div>
        }
        behavior="hover"
        show={showPopover}
        setShow={setShowPopover}
      >
        <PopoverContent>
          <EntryPayoutDetail entry={entry} />
        </PopoverContent>
      </Popover>
    </div>
  ) : (
    <div
      className={classNameObject({
        "entry-payout notranslate": true,
        "payout-declined": isPayoutDeclined,
        "payout-limit-hit": payoutLimitHit
      })}
    >
      <FormattedCurrency value={shownPayout ?? 0} fixAt={3} />
    </div>
  );
};
