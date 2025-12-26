import { useState, useCallback, useMemo } from "react";
import { ConfigEditor } from "./config-editor";
import { configFieldsMap } from "../config-fields";
import { InstanceConfigManager } from "@/core";
import { FLOATING_MENU_THEME } from "../constants";
import { updateNestedPath, downloadJson } from "../utils";
import type { ConfigValue } from "../types";

interface FloatingMenuWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingMenuWindow({
  isOpen,
  onClose,
}: FloatingMenuWindowProps) {
  const [config, setConfig] = useState<Record<string, ConfigValue>>(() => {
    return InstanceConfigManager.CONFIG as Record<string, ConfigValue>;
  });

  const handleUpdate = useCallback((path: string, value: ConfigValue) => {
    setConfig((prev) => updateNestedPath(prev, path, value));
  }, []);

  const handleDownload = useCallback(() => {
    downloadJson(config, "config.json");
  }, [config]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const windowClassName = useMemo(
    () =>
      `absolute bottom-0 left-0 right-0 shadow-2xl transition-all duration-300 ease-in-out pointer-events-auto overflow-hidden ${
        isOpen ? "h-[80vh] rounded-t-2xl" : "h-0"
      }`,
    [isOpen]
  );

  if (!isOpen) {
    return (
      <div className="fixed inset-0 z-40 pointer-events-none">
        <div
          className={windowClassName}
          style={{
            maxHeight: "80vh",
            backgroundColor: FLOATING_MENU_THEME.background,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 pointer-events-none"
      onKeyDown={handleKeyDown}
    >
      <div
        className={windowClassName}
        style={{
          maxHeight: "80vh",
          backgroundColor: FLOATING_MENU_THEME.background,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header
            className="flex items-center justify-between p-4 shrink-0 rounded-t-lg border-b"
            style={{
              borderColor: FLOATING_MENU_THEME.borderColor,
            }}
          >
            <h2 className="text-sm font-semibold font-sans text-white">
              Configuration Editor
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="text-sm font-sans px-3 py-1.5 text-gray-300 hover:text-gray-100 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: FLOATING_MENU_THEME.buttonBackground,
                }}
                type="button"
                aria-label="Download configuration"
              >
                Download
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                aria-label="Close editor"
                type="button"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6 min-h-0">
            <div className="container mx-auto max-w-7xl">
              <ConfigEditor
                config={config}
                fields={configFieldsMap}
                onUpdate={handleUpdate}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
