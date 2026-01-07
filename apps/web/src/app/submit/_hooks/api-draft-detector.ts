import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import usePrevious from "react-use/lib/usePrevious";
import { PollsContext } from "./polls-manager";
import { Draft } from "@/entities";
import { getDraftsQueryOptions } from "@ecency/sdk";
import { QueryIdentifiers } from "@/core/react-query";
import { useLocation } from "react-use";
import { useActiveAccount } from "@/core/hooks/use-active-account";

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

  const draftsQuery = useQuery({
    ...getDraftsQueryOptions(activeUser?.username),
    placeholderData: [],
    refetchOnMount: true
  });
  const draftQuery = useQuery({
    queryKey: [QueryIdentifiers.BY_DRAFT_ID, draftId],
    queryFn: () => {
      const existingDraft = draftsQuery.data.find((draft) => draft._id === draftId);

      if (!existingDraft) {
        onInvalidDraft();
        return;
      }

      return existingDraft;
    },
    enabled: draftsQuery.data.length > 0 && !!draftId
  });

  useEffect(() => {
    if (draftQuery.data) {
      onDraftLoaded(draftQuery.data);
      setActivePoll(draftQuery.data.meta?.poll);
    }
  }, [draftQuery.data, onDraftLoaded, setActivePoll]);

  useEffect(() => {
    // location change. only occurs once a draft picked on drafts dialog
    if (location.pathname !== previousLocation?.pathname) {
      queryClient.invalidateQueries({
        queryKey: [QueryIdentifiers.BY_DRAFT_ID, draftId]
      });
    }
  }, [location.pathname, draftId, previousLocation?.pathname, queryClient]);
}
