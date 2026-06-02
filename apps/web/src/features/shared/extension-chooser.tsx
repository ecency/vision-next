"use client";

import Image from "next/image";
import i18next from "i18next";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import type { DetectedExtension, HiveExtensionId } from "@/utils/hive-extensions";

interface Props {
  extensions: DetectedExtension[];
  onSelect: (id: HiveExtensionId) => void;
}

/**
 * The "which extension do you want to use?" selection step, shown when more than
 * one Hive extension is installed. Shared by the login dialog and the
 * auth-upgrade (signing) dialog so the choice is the same everywhere.
 */
export function ExtensionChooser({ extensions, onSelect }: Props) {
  return (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {i18next.t("login.extensions-select-description")}
      </p>
      <div className="flex flex-col gap-3">
        {extensions.map((ext) => (
          <button
            key={ext.id}
            type="button"
            onClick={() => onSelect(ext.id)}
            className="flex items-center gap-3 p-3 rounded-lg border border-[--border-color] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left w-full"
          >
            <Image
              width={32}
              height={32}
              src={ext.icon}
              alt={ext.name}
              className="w-8 h-8 rounded"
            />
            <div className="flex-1 font-semibold text-sm">{ext.name}</div>
            <UilArrowRight className="w-4 h-4 opacity-50" />
          </button>
        ))}
      </div>
    </>
  );
}
