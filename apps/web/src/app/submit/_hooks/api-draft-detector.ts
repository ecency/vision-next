import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useRef } from "react";
import usePrevious from "react-use/lib/usePrevious";
import { PollsContext } from "./polls-manager";
import { Draft } from "@/entities";
import { getDraftsQueryOptions, QueryKeys } from "@ecency/sdk";
import { useLocation } from "react-use";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";

export function useApiDraftDetector(
  draftId: string | undefined,
  onDraftLoaded: (draft: Draft) => void,
  onInvalidDraft: () => void
) {
  const { setActivePoll } = useContext(PollsContext);

  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();

  const location = useLocation();
  const previousLocation = usePrevious(location);

  const draftsQueryOptions = useMemo(
    () =>
      getDraftsQueryOptions(activeUser?.username, getAccessToken(activeUser?.username ?? "")),
    [activeUser?.username]
  );
  const draftsQuery = useQuery({
    ...draftsQueryOptions,
    placeholderData: [],
    refetchOnMount: true
  });
  const onDraftLoadedRef = useRef(onDraftLoaded);
  const onInvalidDraftRef = useRef(onInvalidDraft);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    onDraftLoadedRef.current = onDraftLoaded;
    onInvalidDraftRef.current = onInvalidDraft;
  }, [onDraftLoaded, onInvalidDraft]);

  // `placeholderData: []` only applies while the query is pending, so a failed drafts
  // request leaves `data` undefined. Everything below reads the list through this fallback.
  const drafts = useMemo(() => draftsQuery.data ?? [], [draftsQuery.data]);

  const existingDraft = useMemo(() => {
    // First, try to find the draft in the regular query
    const draftFromRegularQuery = drafts.find((draft) => draft._id === draftId);
    if (draftFromRegularQuery) {
      // The SDK query returns the SDK's Draft; the app keeps its own stricter local copy.
      return draftFromRegularQuery;
    }

    // If not found, check the infinite query cache (for paginated drafts)
    const infiniteQueryKey = QueryKeys.posts.draftsInfinite(activeUser?.username, 10);
    const infiniteQueryData = queryClient.getQueryData<{
      pages: Array<{ data: Draft[] }>;
    }>(infiniteQueryKey);

    if (infiniteQueryData?.pages) {
      for (const page of infiniteQueryData.pages) {
        const draft = page.data?.find((d) => d._id === draftId);
        if (draft) {
          return draft;
        }
      }
    }

    return undefined;
  }, [draftId, drafts, activeUser?.username, queryClient]);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [draftId]);

  useEffect(() => {
    if (existingDraft && !hasLoadedRef.current) {
      onDraftLoadedRef.current(existingDraft);
      setActivePoll(existingDraft.meta?.poll);
      hasLoadedRef.current = true;
    }
  }, [existingDraft, setActivePoll]);

  useEffect(() => {
    // Only check for invalid draft if we haven't already loaded it successfully.
    // This prevents stale cache updates (from concurrent auto-save responses or
    // server refetch with replication lag) from incorrectly triggering "no draft found".
    if (hasLoadedRef.current) return;
    // Only a successfully fetched list proves a draft is gone. While the query is
    // pending, or when it failed (private API 5xx, expired token), the absence of the
    // draft says nothing, so the editor is left alone rather than rejecting the draft.
    if (!draftsQuery.isSuccess) return;
    if (draftId && drafts.length > 0 && !existingDraft) {
      onInvalidDraftRef.current();
    }
  }, [draftId, draftsQuery.isSuccess, drafts.length, existingDraft]);

  useEffect(() => {
    // location change. only occurs once a draft picked on drafts dialog
    if (location.pathname !== previousLocation?.pathname) {
      hasLoadedRef.current = false;
      queryClient.invalidateQueries({
        queryKey: draftsQueryOptions.queryKey
      });
    }
  }, [
    location.pathname,
    previousLocation?.pathname,
    queryClient,
    draftsQueryOptions.queryKey
  ]);
}
