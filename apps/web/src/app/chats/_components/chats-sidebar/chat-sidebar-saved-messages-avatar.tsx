import React from "react";
import { savedMessagesSvg } from "@/assets/img/svg";

export function ChatSidebarSavedMessagesAvatar({
  width = 40,
  height = 40
}: {
  width?: number;
  height?: number;
}) {
  return (
    <div
      className="text-white flex items-center justify-center bg-blue-dark-sky rounded-full"
      style={{
        width,
        height
      }}
    >
      {savedMessagesSvg}
    </div>
  );
}
