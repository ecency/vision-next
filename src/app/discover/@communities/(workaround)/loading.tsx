import React from "react";

export default function CommunitiesLoading() {
  return (
    <div className="py-6 gap-4 overflow-y-auto relative grid grid-cols-12">
      <div className="col-span-12 md:col-span-4 lg:col-span-3 animate-pulse rounded-2xl bg-blue-dark-sky-040 dark:bg-blue-dark-grey h-[520px]" />
      <div className="col-span-12 md:col-span-8 lg:col-span-9 gap-4 grid grid-cols-12">
        <div className="col-span-6 lg:col-span-4 h-full animate-pulse rounded-2xl bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="col-span-6 lg:col-span-4 h-full animate-pulse rounded-2xl bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="col-span-6 lg:col-span-4 h-full animate-pulse rounded-2xl bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="col-span-6 lg:col-span-4 h-full animate-pulse rounded-2xl bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="col-span-6 lg:col-span-4 h-full animate-pulse rounded-2xl bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="col-span-6 lg:col-span-4 h-full animate-pulse rounded-2xl bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>
    </div>
  );
}
