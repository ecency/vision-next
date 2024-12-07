import { UserAvatarLoading } from "@/features/shared";
import { ButtonLoading } from "@ui/button";

interface Props {
  isReply: boolean;
}

export function WaveFormLoading({ isReply }: Props) {
  return (
    <div className="wave-form relative flex items-start p-4 w-full gap-4">
      <UserAvatarLoading size={isReply ? "deck-item" : "medium"} />
      <div className="flex flex-col w-full gap-4 pt-1">
        <div className="animate-pulse h-[16px] rounded-lg w-[48px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="animate-pulse h-[8rem] rounded-lg w-full bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="animate-pulse h-[4px] rounded-lg w-full bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <div className="animate-pulse h-[20px] rounded-lg w-[20px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
            <div className="animate-pulse h-[20px] rounded-lg w-[20px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
            <div className="animate-pulse h-[20px] rounded-lg w-[20px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          </div>
          <div className="w-[96px]">
            <ButtonLoading />
          </div>
        </div>
      </div>
    </div>
  );
}
