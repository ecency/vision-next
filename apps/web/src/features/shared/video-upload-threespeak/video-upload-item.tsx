import React, { useRef } from "react";
import { uploadSvgV } from "@ui/svg";
import i18next from "i18next";

interface Props {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type: "video" | "thumbnail";
  accept: string;
  label: string;
  completed: number;
  /** When true, a file has been selected (uploading or done). Hides the select prompt. */
  hasFile?: boolean;
}

export function VideoUploadItem({ onFileChange, type, accept, label, completed, hasFile }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  const isUploading = completed > 0 && completed < 100;
  const isDone = completed >= 100;

  // Hide the file selector once a file is chosen — prevents accidental re-selection
  if (hasFile) {
    return (
      <div className="flex items-center flex-col rounded-xl border border-[--border-color] p-3">
        {isDone ? (
          <div className="flex items-center gap-2 text-green-500 py-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {i18next.t("video-upload.uploaded")}
          </div>
        ) : (
          <div className="text-sm opacity-60 py-2">
            {label}
          </div>
        )}
        {isUploading && (
          <div className="relative bg-gray-200 dark:bg-gray-700 h-[1.25rem] mt-3 w-full rounded-lg overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-blue-dark-sky duration-300"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completed}
              style={{ width: `${completed}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow-sm">
              {completed}%
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-center flex-col rounded-xl border border-[--border-color] p-3 hover:bg-gray-100 dark:hover:bg-dark-default cursor-pointer duration-300"
      onClick={() => fileInput.current?.click()}
    >
      {uploadSvgV}
      {label}
      <input
        type="file"
        ref={fileInput}
        accept={accept}
        id={type + "-input"}
        style={{ display: "none" }}
        onChange={onFileChange}
      />
    </div>
  );
}
