import React, { useContext, useState } from "react";
import { DeckGridContext } from "../../deck-manager";
import { DeckAddColumnSearchBox } from "./deck-add-column-search-box";
import { SettingsProps, UsernameDataItem } from "./common";
import { COMMUNITY_CONTENT_TYPES, ICONS } from "../../consts";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { Button } from "@ui/button";
import { UserAvatar } from "@/features/shared";
import i18next from "i18next";
import { PREFIX } from "@/utils/local-storage";

export const DeckAddColumnCommunitySettings = ({ deckKey }: SettingsProps) => {
  const { add } = useContext(DeckGridContext);

  const [username, setUsername] = useState("");
  const [tag, setTag] = useState("");
  const [contentType, setContentType] = useState<string | null>(null);
  const [recent, setRecent] = useLocalStorage<UsernameDataItem[]>(PREFIX + "_dcr", []);

  return (
    <div className="deck-add-column-user-settings p-3">
      <div className="helper-text">{i18next.t("decks.columns.add-username-text")}</div>
      <div className="subtitle py-3">{i18next.t("decks.columns.community")}</div>
      {username ? (
        <div className="selected-user" onClick={() => setUsername("")}>
          <UserAvatar size="medium" username={tag} />
          <div className="username">{username}</div>
          <div className="click-to-change">{i18next.t("decks.columns.click-to-change")}</div>
        </div>
      ) : (
        <DeckAddColumnSearchBox
          isCommunity={true}
          username={username}
          setUsername={(v) => {
            setUsername(v);
          }}
          recentList={recent ?? []}
          setRecentList={setRecent}
          setItem={({ tag }) => {
            setTag(tag ?? "");
          }}
        />
      )}
      {username !== "" ? (
        <>
          <div className="subtitle py-3 mt-3">{i18next.t("decks.content-type")}</div>
          <div className="content-type-list">
            {COMMUNITY_CONTENT_TYPES.map(({ title, type }) => (
              <div
                className={"content-type-item " + (contentType === type ? "selected" : "")}
                key={title}
                onClick={() => setContentType(type)}
              >
                {/*@ts-ignore*/}
                {ICONS.co[type]}
                <div className="title">{title}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <></>
      )}
      {username !== "" && contentType !== null ? (
        <Button
          disabled={!username || !contentType}
          className="w-full mt-5 sticky-bottom"
          onClick={() =>
            add({
              key: deckKey,
              type: "co",
              settings: {
                username,
                contentType,
                updateIntervalMs: 60000,
                tag
              }
            })
          }
        >
          {i18next.t("g.continue")}
        </Button>
      ) : (
        <></>
      )}
    </div>
  );
};
