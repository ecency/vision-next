import Image from "next/image";

export function ProfileCardLoading() {
  return (
    <div className="rounded-xl w-full overflow-hidden relative p-4">
      <Image
        className="absolute top-0 left-0 w-full h-[96px] object-cover"
        src="/assets/promote-wave-bg.jpg"
        alt=""
        width={300}
        height={200}
      />

      <div className="relative flex flex-col mt-10 gap-2">
        <div className="bg-white rounded-full w-[80px] h-[80px] p-4">
          <Image src="/assets/avatar-placeholder.svg" width={80} height={80} alt="" />
        </div>

        <div className="flex flex-col gap-1">
          <div className="w-full rounded-lg animate-pulse h-[24px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          <div className="font-semibold flex items-center flex-wrap gap-2"></div>
          <div className="w-[50%] rounded-lg animate-pulse h-[20px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          <div className="w-full rounded-lg animate-pulse h-[20px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        </div>

        <div className="grid grid-cols-2 pb-4 gap-4">
          <div className="w-full rounded-lg animate-pulse h-[44px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          <div className="w-full rounded-lg animate-pulse h-[44px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="w-[20%] rounded-lg animate-pulse h-[32px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="w-[20%] rounded-lg animate-pulse h-[32px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>

      <div className="-mx-4 border-y border-[--border-color] px-4 py-4">
        <div className="w-full rounded-lg animate-pulse h-[44px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>

      <div className="flex flex-col w-full gap-4 py-4">
        <div className="w-full rounded-lg animate-pulse h-[40px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="w-full rounded-lg animate-pulse h-[40px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>
    </div>
  );
}
