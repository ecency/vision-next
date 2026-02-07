"use client";

import { VoteButton as BaseVoteButton, type Vote } from "@ecency/ui";
import { UilHeart } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { t } from "@/core";
import { useAuth, useIsAuthenticated, useIsAuthEnabled } from "../hooks";
import { broadcast } from "../auth-actions";

interface VoteButtonProps {
  author: string;
  permlink: string;
  activeVotes: Vote[];
  showCount?: boolean;
  className?: string;
}

function HeartIcon({
  filled,
  className,
}: {
  filled?: boolean;
  className?: string;
}) {
  return <UilHeart className={clsx(className, filled && "fill-current")} />;
}

export function VoteButton({
  author,
  permlink,
  activeVotes,
  showCount = true,
  className,
}: VoteButtonProps) {
  const { user } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const isAuthEnabled = useIsAuthEnabled();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleVote = useCallback(
    async ({
      weight,
    }: {
      author: string;
      permlink: string;
      weight: number;
    }) => {
      if (!user) return;

      await broadcast([
        [
          "vote",
          {
            voter: user.username,
            author,
            permlink,
            weight,
          },
        ],
      ]);

      // Invalidate queries to refresh vote data
      queryClient.invalidateQueries({ queryKey: ["entry", author, permlink] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
    [user, author, permlink, broadcast, queryClient]
  );

  const handleAuthRequired = useCallback(() => {
    navigate({
      to: "/login",
      search: { redirect: `/@${author}/${permlink}` },
    });
  }, [navigate, author, permlink]);

  return (
    <BaseVoteButton
      author={author}
      permlink={permlink}
      activeVotes={activeVotes}
      currentUser={user?.username}
      isVotingEnabled={isAuthEnabled}
      isAuthenticated={isAuthenticated}
      onVote={handleVote}
      onAuthRequired={handleAuthRequired}
      showCount={showCount}
      className={className}
      labels={{
        likes: t("likes"),
        login: t("login_to_vote"),
      }}
      icon={<HeartIcon className="w-4 h-4" />}
    />
  );
}
