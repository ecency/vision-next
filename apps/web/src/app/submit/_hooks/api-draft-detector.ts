import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useRef } from "react";
import usePrevious from "react-use/lib/usePrevious";
import { PollsContext } from "./polls-manager";
import { Draft } from "@/entities";
import { getDraftsQueryOptions } from "@ecency/sdk";
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

  useEffect(() => {
    onDraftLoadedRef.current = onDraftLoaded;
    onInvalidDraftRef.current = onInvalidDraft;
  }, [onDraftLoaded, onInvalidDraft]);

  const existingDraft = useMemo(
    () => draftsQuery.data.find((draft) => draft._id === draftId),
    [draftId, draftsQuery.data]
  );

  useEffect(() => {
    if (existingDraft) {
      onDraftLoadedRef.current(existingDraft);
      setActivePoll(existingDraft.meta?.poll);
    }
  }, [existingDraft, setActivePoll]);

  useEffect(() => {
    if (draftId && draftsQuery.data.length > 0 && !existingDraft) {
      onInvalidDraftRef.current();
    }
  }, [draftId, draftsQuery.data.length, existingDraft]);

  useEffect(() => {
    // location change. only occurs once a draft picked on drafts dialog
    if (location.pathname !== previousLocation?.pathname) {
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
