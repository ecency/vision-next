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
}

export function ImageUploadButton({
  onBegin,
  onEnd,
  size = "sm",
  className,
  appearance
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

      const response = await uploadImage({ file });
      onEnd(response.url);
    },
    [onBegin, onEnd, uploadImage]
  );

  return (
    <>
      <Button
        size={size}
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        icon={isPending ? <Spinner className="w-3.5 h-3.5" /> : uploadSvg}
        className={className}
        appearance={appearance}
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
