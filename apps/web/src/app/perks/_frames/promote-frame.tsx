"use client";

export function PromoteFrame() {
  return (
    <div className="grid items-end gap-2 grid-cols-6 h-[240px]">
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">jan</div>
        <div className="h-[10%] bg-gray-200 dark:bg-gray-800 rounded-lg text-xs flex items-center justify-center text-gray-700 dark:text-gray-300">
          +10
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">feb</div>
        <div className="h-[20%] bg-gray-200 dark:bg-gray-800 rounded-lg text-xs flex items-center justify-center text-gray-700 dark:text-gray-300">
          +20
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">mar</div>
        <div className="h-[15%] bg-gray-200 dark:bg-gray-800 rounded-lg text-xs flex items-center justify-center text-gray-700 dark:text-gray-300">
          +15
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">apr</div>
        <div className="h-[25%] bg-gray-200 dark:bg-gray-800 rounded-lg text-xs flex items-center justify-center text-gray-700 dark:text-gray-300">
          +25
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">may</div>
        <div className="h-[35%] bg-gray-200 dark:bg-gray-800 rounded-lg text-xs flex items-center justify-center text-gray-700 dark:text-gray-300">
          +35
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">jun</div>
        <div className="h-full bg-blue-dark-sky rounded-lg text-xs flex items-center justify-center text-[#ffffff]">
          +120
        </div>
      </div>
    </div>
  );
}
