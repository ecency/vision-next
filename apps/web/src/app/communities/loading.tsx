import { UilSpinner } from "@tooni/iconscout-unicons-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center">
      <UilSpinner className="w-8 h-8 text-blue-dark-sky animate-spin" />
    </div>
  );
}
