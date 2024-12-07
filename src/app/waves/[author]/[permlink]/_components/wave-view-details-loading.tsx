import { WaveListItemHeaderLoading } from "@/app/waves/_components";
import { WaveActionsLoading, WaveFormLoading } from "@/features/waves";

export function WaveViewDetailsLoading() {
  return (
    <div className="relative z-10 rounded-2xl bg-white dark:bg-dark-200 cursor-pointer">
      <WaveListItemHeaderLoading />
      <div className="flex flex-col w-full mt-4 gap-2 px-4">
        <div className="animate-pulse h-[16px] rounded-lg w-full bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="animate-pulse h-[16px] rounded-lg w-full bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="animate-pulse h-[16px] rounded-lg w-full bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="animate-pulse h-[16px] rounded-lg w-[48px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>
      <div className="p-4 border-b border-[--border-color]">
        <WaveActionsLoading />
      </div>
      <WaveFormLoading isReply={true} />
    </div>
  );
}
