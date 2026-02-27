import { UilImage } from "@tooni/iconscout-unicons-react";

export function AiImageIcon() {
  return (
    <span className="relative inline-flex">
      <UilImage />
      <span className="absolute -top-1.5 -right-2.5 text-[8px] font-bold leading-none bg-blue-dark-sky text-white rounded px-0.5 py-px">
        AI
      </span>
    </span>
  );
}
