import { EntryListLoadingItem } from "@/features/shared/entry-list-loading-item";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <EntryListLoadingItem />
    </div>
  );
}
