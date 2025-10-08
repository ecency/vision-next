import React from "react";
import { Profile } from "@ecency/ns-query";
import { classNameObject } from "@ui/util";
import { ProfileLink } from "@/features/shared";

interface Props {
  showUsername?: boolean;
  isGif: boolean;
  isEmoji: boolean;
  profile?: Profile;
}

export function ChatMessageUsernameLabel({ showUsername, isEmoji, isGif, profile }: Props) {
  return showUsername ? (
    <ProfileLink
      username={profile!.name}
      className={classNameObject({
        "font-semibold text-sm mb-2 text-blue-dark-sky": true,
        "px-2.5": isGif || isEmoji
      })}
    >
      <>{profile!.name}</>
    </ProfileLink>
  ) : (
    <></>
  );
}
