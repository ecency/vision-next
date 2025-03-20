"use client";

import React, { useEffect, useMemo, useState } from "react";
import { setProxyBase } from "@ecency/render-helper";
import "./_index.scss";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import { DiscussionList } from "./discussion-list";
import usePrevious from "react-use/lib/usePrevious";
import { DiscussionBots } from "./discussion-bots";
import defaults from "@/defaults.json";
import { Community, Entry } from "@/entities";
import { commentSvg } from "@ui/svg";
import i18next from "i18next";
import { useGlobalStore } from "@/core/global-store";
import { LinearProgress, LoginRequired } from "@/features/shared";
import { getBotsQuery } from "@/api/queries";
import { SortOrder } from "@/enums";
import { getDiscussionsQuery } from "@/api/queries/get-discussions-query";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { UilComment } from "@tooni/iconscout-unicons-react";

setProxyBase(defaults.imageServer);

interface Props {
  parent: Entry;
  community: Community | null;
  isRawContent: boolean;
  hideControls: boolean;
}

export function Discussion({ hideControls, isRawContent, parent, community }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const previousIsRawContent = usePrevious(isRawContent);

  const [order, setOrder] = useState(SortOrder.trending);
  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();

  const { isLoading, data } = getDiscussionsQuery(
    parent,
    order,
    !!parent,
    activeUser?.username
  ).useClientQuery();
  const { data: botsList } = getBotsQuery().useClientQuery();

  const filtered = useMemo(
    () =>
      data?.filter(
        (x) => x.parent_author === parent.author && x.parent_permlink === parent.permlink
      ) ?? [],
    [data, parent]
  );
  const strCount = useMemo(
    () =>
      filtered.length - 1 > 1
        ? i18next.t("discussion.n-replies", { n: filtered.length })
        : i18next.t("discussion.replies"),
    [filtered]
  );
  const botsData = useMemo(
    () => filtered?.filter((entry) => botsList?.includes(entry.author) && entry.children === 0),
    [botsList, filtered]
  );

  useEffect(() => {
    updateEntryQueryData(filtered);
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="discussion">
        <LinearProgress />
      </div>
    );
  }

  return (
    <>
      {!activeUser && (
        <div
          className="flex justify-between items-center bg-cover p-4 rounded-xl"
          style={{
            backgroundImage: "url(/assets/promote-wave-bg.jpg)"
          }}
        >
          <div className="text-white flex items-center flex-wrap gap-4">
            <UilComment />
            <div
              className="max-w-[300px]"
              style={{
                textShadow: "rgba(0,0,0, .25) 0 0 4px"
              }}
            >
              <div className="font-semibold">{i18next.t("discussion.join")}</div>
              <div className="text-sm">{i18next.t("discussion.join-hint")}</div>
            </div>
          </div>
          <LoginRequired>
            <Button appearance="white" icon="🔥" size="lg">
              {i18next.t("discussion.btn-join")}
            </Button>
          </LoginRequired>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="discussion" id="discussion">
          <div className="discussion-header">
            <div className="count mr-4">
              {" "}
              {commentSvg} {strCount}
            </div>
            <DiscussionBots entries={botsData ?? []} />
            <span className="flex-spacer" />
            {hideControls ? (
              <></>
            ) : (
              <div className="order">
                <span className="order-label">{i18next.t("discussion.order")}</span>
                <FormControl
                  type="select"
                  value={order}
                  onChange={(e: any) => setOrder(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="trending">{i18next.t("discussion.order-trending")}</option>
                  <option value="author_reputation">
                    {i18next.t("discussion.order-reputation")}
                  </option>
                  <option value="votes">{i18next.t("discussion.order-votes")}</option>
                  <option value="created">{i18next.t("discussion.order-created")}</option>
                </FormControl>
              </div>
            )}
          </div>
          <DiscussionList
            root={parent}
            discussionList={data ?? []}
            hideControls={hideControls}
            parent={parent}
            isRawContent={isRawContent}
            community={community}
          />
        </div>
      )}
    </>
  );
}
