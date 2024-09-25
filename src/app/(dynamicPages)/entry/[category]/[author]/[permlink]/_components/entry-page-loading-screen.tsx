"use client";

import React, { useContext } from "react";
import { LinearProgress } from "@/features/shared";
import { EntryPageContext } from "@/app/(dynamicPages)/entry/[category]/[author]/[permlink]/_components/context";

export const EntryPageLoadingScreen = () => {
  const { loading } = useContext(EntryPageContext);

  return (
    <>
      {loading && (
        <div className="mt-5">
          <div className="pt-2">
            <div className="mt-1">
              <LinearProgress />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
