import dynamic from "next/dynamic";

export const EmojiPicker = dynamic(
  () => import("./index").then((m) => ({ default: m.EmojiPicker })),
  {
    ssr: false,
    loading: () => <div className="emoji-picker-loading">Loading emojis...</div>
  }
);
