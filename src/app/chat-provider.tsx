import defaults from "@/defaults.json";
import { PropsWithChildren, useMemo } from "react";
import { ChatContextProvider } from "@ecency/ns-query";
import {getAccountFullQuery, useClientActiveUser} from "@/api/queries";
import { getAccessToken } from "@/utils";

export function ChatProvider(props: PropsWithChildren) {
  const activeUser = useClientActiveUser()

  const { data: activeUserAccount } = getAccountFullQuery(activeUser?.username).useClientQuery();
  const accessToken = useMemo(
    () => (activeUser ? getAccessToken(activeUser.username) ?? "" : ""),
    [activeUser]
  );

  return (
    <ChatContextProvider
      storage={typeof window !== "undefined" ? window.localStorage : undefined}
      privateApiHost={defaults.base}
      activeUsername={activeUser?.username}
      activeUserData={activeUserAccount ?? undefined}
      ecencyAccessToken={accessToken}
    >
      {props.children}
    </ChatContextProvider>
  );
}
