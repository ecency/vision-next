import { WaveFormLoading } from "@/features/waves";
import { WavesNavigationLayout } from "@/app/waves/_components";

// Scoped to the feed by the (feed) route group on purpose. A loading module
// applies to its segment AND every segment nested under it, so while this file
// sat at app/waves it also wrapped /waves/[author]/[permlink] in a Suspense
// boundary: the wave page awaits its entry, so the shell flushed with this
// skeleton and the wave itself arrived in a hidden segment that a $RC swap
// script revealed at 99% of the document (#1783). The group keeps the feed's
// instant loading state without putting a boundary above the wave body.
export default function WavesFeedLoading() {
  return (
    <div className="flex flex-col gap-4 lg:gap-6 xl:gap-8">
      <div className="rounded-2xl reading-surface mb-4 lg:mb-6 xl:mb-8">
        <WavesNavigationLayout>
          <div className="p-4 flex items-center justify-end">
            <div className="animate-pulse h-[20px] rounded-lg w-[20px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          </div>
        </WavesNavigationLayout>
        {/* <WaveFormLoading isReply={false} /> */}
      </div>
    </div>
  );
}
