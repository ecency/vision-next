import React, { useRef } from "react";
import { uploadSvgV } from "@ui/svg";

interface Props {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type: "video" | "thumbnail";
  accept: string;
  label: string;
  completed: number;
}

export function VideoUploadItem({ onFileChange, type, accept, label, completed }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

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
      {completed ? (
        <div className="bg-gray-200 h-[1rem] mt-3 w-full text-white rounded-lg flex overflow-hidden">
          <div
            className="flex duration-300 justify-center overflow-hidden text-xs bg-blue-dark-sky"
            role="progressbar"
            style={{ width: `${completed}%` }}
          >
            {completed}%
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
