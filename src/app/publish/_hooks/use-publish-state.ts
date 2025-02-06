import { useState } from "react";

export function usePublishState() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return {
    title,
    content,
    setTitle,
    setContent
  };
}
