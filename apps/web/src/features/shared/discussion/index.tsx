"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDiscussionsQuery } from "@/api/queries";
import { getBotsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { FormControl } from "@ui/input";
import { Button } from "@ui/button";
import { DiscussionList } from "./discussion-list";
import { DiscussionBots } from "./discussion-bots";
import { Community, Entry } from "@/entities";
import { commentSvg } from "@ui/svg";
import i18next from "i18next";
import { LinearProgress, LoginRequired } from "@/features/shared";
import { SortOrder } from "@/enums";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { UilComment } from "@tooni/iconscout-unicons-react";
import defaults from "@/defaults";
import { setProxyBase } from "@ecency/render-helper";
import "./_index.scss";

setProxyBase(defaults.imageServer);

interface Props {
  parent: Entry;
  community: Community | null;
  isRawContent: boolean;
  hideControls: boolean;
  onTopLevelCommentsChange?: (hasComments: boolean) => void;
}

export function Discussion({ parent, community, isRawContent, hideControls, onTopLevelCommentsChange }: Props) {
  const { activeUser } = useActiveAccount();
  const [order, setOrder] = useState(SortOrder.created);
  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();
  const processedCommentsRef = useRef<Set<string>>(new Set());
  const parentIdRef = useRef(`${parent.author}/${parent.permlink}`);

  // Clear processed comments when parent changes
  const currentParentId = `${parent.author}/${parent.permlink}`;
  if (parentIdRef.current !== currentParentId) {
    processedCommentsRef.current.clear();
    parentIdRef.current = currentParentId;
  }

  const { data: allComments = [], isLoading } = getDiscussionsQuery(
      parent,
      order,
      true,
      activeUser?.username
  ).useClientQuery();

  const { data: botsList } = useQuery(getBotsQueryOptions());

  const topLevelComments = useMemo(
      () =>
          allComments.filter(
              (x) =>
                  x.parent_author === parent.author && x.parent_permlink === parent.permlink
          ),
      [allComments, parent]
  );

  const strCount = useMemo(() => {
    return topLevelComments.length > 1
        ? i18next.t("discussion.n-replies", { n: topLevelComments.length })
        : i18next.t("discussion.replies");
  }, [topLevelComments]);

  const botsData = useMemo(
      () =>
          allComments?.filter(
              (entry) => botsList?.includes(entry.author) && entry.children === 0
          ) ?? [],
      [allComments, botsList]
  );

  useEffect(() => {
    // Only update cache for new comments we haven't processed yet
    const newComments = allComments.filter((comment) => {
      const id = `${comment.author}/${comment.permlink}`;
      return !processedCommentsRef.current.has(id);
    });

    if (newComments.length > 0) {
      updateEntryQueryData(newComments);
      // Track processed comments
      newComments.forEach((comment) => {
        processedCommentsRef.current.add(`${comment.author}/${comment.permlink}`);
      });
    }
  }, [allComments, updateEntryQueryData]);

  useEffect(() => {
    onTopLevelCommentsChange?.(topLevelComments.length > 0);
    // Intentionally omitting onTopLevelCommentsChange from deps to avoid infinite loops
    // when parent doesn't memoize the callback. We only want to trigger when count changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topLevelComments.length]);

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
                  backgroundImage: "url(/assets/promote-wave-bg.jpg)",
                }}
            >
              <div className="text-white flex items-center flex-wrap gap-4">
                <UilComment />
                <div
                    className="max-w-[300px]"
                    style={{
                      textShadow: "rgba(0,0,0,.25) 0 0 4px",
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

        {topLevelComments.length > 0 && (
            <div className="discussion" id="discussion">
              <div className="discussion-header">
                <div className="count mr-4">
                  {commentSvg} {strCount}
                </div>
                <DiscussionBots entries={botsData} />
                <span className="flex-spacer" />
                {!hideControls && (
                    <div className="order">
                      <span className="order-label">{i18next.t("discussion.order")}</span>
                      <FormControl
                          type="select"
                          value={order}
                          onChange={(e: any) => setOrder(e.target.value)}
                          disabled={isLoading}
                      >
                        <option value="trending">
                          {i18next.t("discussion.order-trending")}
                        </option>
                        <option value="author_reputation">
                          {i18next.t("discussion.order-reputation")}
                        </option>
                        <option value="votes">
                          {i18next.t("discussion.order-votes")}
                        </option>
                        <option value="created">
                          {i18next.t("discussion.order-created")}
                        </option>
                      </FormControl>
                    </div>
                )}
              </div>

              <DiscussionList
                  root={parent}
                  discussionList={allComments}
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
