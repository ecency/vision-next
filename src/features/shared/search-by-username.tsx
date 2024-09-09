import React, { useEffect, useState } from "react";
import { FormControl, InputGroup } from "@ui/input";
import { Spinner } from "@ui/spinner";
import { useGlobalStore } from "@/core/global-store";
import { UserAvatar } from "@/features/shared/user-avatar";
import { SuggestionList } from "@/features/shared/suggestion-list";
import i18next from "i18next";
import { useSearchByUsernameQuery } from "@/api/queries";
import { useDebounce } from "react-use";

interface Props {
  username?: string;
  setUsername: (value: string) => void;
  excludeActiveUser?: boolean;
  recent?: string[];
}

export const SearchByUsername = ({ setUsername, excludeActiveUser, recent, username }: Props) => {
  const activeUser = useGlobalStore((state) => state.activeUser);

  const [prefilledUsername, setPrefilledUsername] = useState(username || "");
  const [usernameInput, setUsernameInput] = useState(username || "");
  const [isActiveUserSet, setIsActiveUserSet] = useState(false);

  const [query, setQuery] = useState("");

  const { data: usernameData, isLoading: isUsernameDataLoading } = useSearchByUsernameQuery(
    query,
    !isActiveUserSet
  );

  useDebounce(() => setQuery(usernameInput), 500, [usernameInput]);

  useEffect(() => {
    if (activeUser && !excludeActiveUser) {
      setIsActiveUserSet(true);
      setUsername(activeUser.username);
      setUsernameInput(activeUser.username);
    }
  }, [activeUser, excludeActiveUser, setUsername]);

  useEffect(() => {
    if (usernameInput !== prefilledUsername) {
      setPrefilledUsername("");
    }
  }, [prefilledUsername, usernameInput]);

  const suggestionProps = {
    renderer: (i: any) => {
      return (
        <>
          <UserAvatar username={i.username || i} size="medium" />{" "}
          <span style={{ marginLeft: "4px" }}>{i}</span>
        </>
      );
    },
    onSelect: (selectedText: any) => {
      setUsernameInput(selectedText);
      setUsername(selectedText);
    }
  };

  return (
    <SuggestionList
      items={usernameData ?? []}
      {...suggestionProps}
      header={!usernameInput ? i18next.t("transfer.recent-transfers") : ""}
    >
      <InputGroup prepend={isUsernameDataLoading ? <Spinner /> : "@"}>
        <FormControl
          type="text"
          autoFocus={true}
          placeholder=""
          value={usernameInput}
          onChange={(e) => {
            setUsernameInput(e.target.value);
            setUsername(e.target.value);
          }}
        />
      </InputGroup>
    </SuggestionList>
  );
};
