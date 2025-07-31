import { WaveFormLoading } from "@/features/waves";
import { WavesNavigationLayout } from "@/app/waves/_components";

export default function WavesDetailsLoading() {
  return (
    <div className="flex flex-col gap-4 lg:gap-6 xl:gap-8">
      <div className="rounded-2xl bg-white dark:bg-dark-200 mb-4 lg:mb-6 xl:mb-8">
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
