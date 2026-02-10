"use client";

import React, { useCallback, useRef } from "react";
import { Spinner } from "@ui/spinner";
import { Button, ButtonProps } from "@ui/button";
import { uploadSvg } from "@ui/svg";
import { useImageUpload } from "@/api/mutations";

interface UploadButtonProps {
  onBegin: () => void;
  onEnd: (url: string) => void;
  size?: ButtonProps["size"];
  className?: string;
  appearance?: ButtonProps["appearance"];
  "aria-label"?: string;
  title?: string;
  disabled?: boolean;
}

export function ImageUploadButton({
  onBegin,
  onEnd,
  size = "sm",
  className,
  appearance,
  disabled,
  ...restProps
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { mutateAsync: uploadImage, isPending } = useImageUpload();

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      // @ts-ignore
      const files = [...e.target.files];

      if (files.length === 0) {
        return;
      }

      const [file] = files;
      onBegin();

      try {
        const response = await uploadImage({ file });
        onEnd(response.url);
      } catch {
        // Upload failed — onEnd not called, but onBegin was balanced
      }
    },
    [onBegin, onEnd, uploadImage]
  );

  return (
    <>
      <Button
        size={size}
        disabled={isPending || disabled}
        onClick={() => inputRef.current?.click()}
        icon={isPending ? <Spinner className="w-3.5 h-3.5" /> : uploadSvg}
        className={className}
        appearance={appearance}
        aria-label={restProps["aria-label"]}
        title={restProps.title}
      />
      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileInput}
      />
    </>
  );
}
