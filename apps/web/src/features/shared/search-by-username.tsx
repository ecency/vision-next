import { useActiveAccount } from "@/core/hooks/use-active-account";
import { UserAvatar } from "@/features/shared/user-avatar";
import { getSearchAccountsByUsernameQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { FormControl, InputGroup } from "@ui/input";
import { Spinner } from "@ui/spinner";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "react-use";
import { Popover } from "../ui";

interface Props {
  username?: string;
  setUsername: (value: string) => void;
  excludeActiveUser?: boolean;
  recent?: string[];
}

export const SearchByUsername = ({ setUsername, excludeActiveUser, username }: Props) => {
  const { activeUser } = useActiveAccount();

  const rootRef = useRef<HTMLDivElement>(null);

  const [usernameInput, setUsernameInput] = useState(username || "");
  const [query, setQuery] = useState("");
  const [show, setShow] = useState(false);

  const { data: usernameData, isLoading: isUsernameDataLoading } = useQuery(
    getSearchAccountsByUsernameQueryOptions(query)
  );

  useDebounce(() => setQuery(usernameInput), 500, [usernameInput]);

  useEffect(() => {
    if (activeUser && !excludeActiveUser) {
      setUsername(activeUser.username);
      setUsernameInput(activeUser.username);
    }
  }, [activeUser, excludeActiveUser]);

  return (
    <Popover
      behavior="click"
      show={show}
      directContent={
        <div ref={rootRef}>
          <InputGroup prepend={isUsernameDataLoading ? <Spinner /> : "@"}>
            <FormControl
              type="text"
              placeholder=""
              value={usernameInput}
              onFocus={() => setShow(true)}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameInput(e.target.value);
              }}
            />
          </InputGroup>
        </div>
      }
    >
      <div
        className="w-full"
        style={{
          width: rootRef.current?.clientWidth
        }}
      >
        {usernameData?.map((username) => (
          <div
            key={username}
            className="border-b border-[--border-color] last:border-0 p-2 md:p-4 flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-gray-200 dark:hover-bg-gray-800"
            onClick={() => {
              setUsername(username);
              setUsernameInput(username);
              setShow(false);
            }}
          >
            <UserAvatar size="small" username={username} />
            <div>{username}</div>
          </div>
        ))}
      </div>
    </Popover>
  );
};
