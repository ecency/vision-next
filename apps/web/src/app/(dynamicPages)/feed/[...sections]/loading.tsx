import { EntryListLoadingItem } from "@/features/shared";
import { LinearProgress } from "@/features/shared";

export default function Loading() {
  return (
    <div className="entry-list">
      <div className="entry-list-body">
        <LinearProgress />
        <EntryListLoadingItem />
      </div>
    </div>
  );
}
