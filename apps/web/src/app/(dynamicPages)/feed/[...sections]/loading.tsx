import { EntryListLoadingItem } from "@/features/shared/entry-list-loading-item";
import { LinearProgress } from "@/features/shared/linear-progress";

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
