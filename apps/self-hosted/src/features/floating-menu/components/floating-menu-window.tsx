import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InstanceConfigManager } from '@/core';
import { configFieldsMap } from '../config-fields';
import { FLOATING_MENU_THEME } from '../constants';
import type { ConfigValue } from '../types';
import { downloadJson, updateNestedPath } from '../utils';
import { ConfigEditor } from './config-editor';

interface OriginalState {
  theme: string;
  styleTemplate: string;
  sidebarPlacement: string;
  /** Complete snapshot of all body classes at capture time */
  allBodyClasses: string[];
  pageTitle: string;
  language: string;
  instanceType: string;
  showFollowers: string;
  showFollowing: string;
  showHiveInfo: string;
  listType: string | null;
}

function applyPreviewConfig(config: Record<string, ConfigValue>) {
  const configuration = config.configuration as Record<string, ConfigValue>;
  const general = configuration?.general as Record<string, ConfigValue>;
  const instanceConfiguration = configuration?.instanceConfiguration as Record<
    string,
    ConfigValue
  >;

  if (!general) return;

  // Apply theme
  const theme = (general.theme as string) || 'light';
  if (theme === 'system') {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    document.documentElement.setAttribute(
      'data-theme',
      prefersDark ? 'dark' : 'light',
    );
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Apply style template
  const styleTemplate = (general.styleTemplate as string) || 'medium';
  document.documentElement.setAttribute('data-style-template', styleTemplate);

  // Apply language
  const language = (general.language as string) || 'en';
  document.documentElement.setAttribute('lang', language);
  document.documentElement.setAttribute('data-language', language);

  // Apply sidebar placement
  const layout = instanceConfiguration?.layout as Record<string, ConfigValue>;
  const sidebar = layout?.sidebar as Record<string, ConfigValue>;
  const sidebarPlacement = (sidebar?.placement as string) || 'right';
  document.documentElement.setAttribute(
    'data-sidebar-placement',
    sidebarPlacement,
  );

  // Apply list type
  const listType = (layout?.listType as string) || 'grid';
  document.documentElement.setAttribute('data-list-type', listType);

  // Apply meta title to page
  const meta = instanceConfiguration?.meta as Record<string, ConfigValue>;
  const title = (meta?.title as string) || '';
  if (title) {
    document.title = title;
  }

  // Apply background styles
  const styles = general.styles as Record<string, ConfigValue>;
  const background = (styles?.background as string) || '';

  // Remove old background classes and add new ones
  const bodyClasses = Array.from(document.body.classList);
  for (const c of bodyClasses) {
    if (c.startsWith('bg-') || c.startsWith('from-') || c.startsWith('to-')) {
      document.body.classList.remove(c);
    }
  }

  if (background) {
    for (const className of background.split(' ')) {
      if (className) document.body.classList.add(className);
    }
  }

  // Apply instance type
  const instanceType = (instanceConfiguration?.type as string) || 'blog';
  document.documentElement.setAttribute('data-instance-type', instanceType);

  // Apply sidebar section visibility
  const followers = sidebar?.followers as Record<string, ConfigValue>;
  const following = sidebar?.following as Record<string, ConfigValue>;
  const hiveInfo = sidebar?.hiveInformation as Record<string, ConfigValue>;

  document.documentElement.setAttribute(
    'data-show-followers',
    followers?.enabled !== false ? 'true' : 'false',
  );
  document.documentElement.setAttribute(
    'data-show-following',
    following?.enabled !== false ? 'true' : 'false',
  );
  document.documentElement.setAttribute(
    'data-show-hive-info',
    hiveInfo?.enabled !== false ? 'true' : 'false',
  );
}

function restoreOriginalState(original: OriginalState) {
  // Restore theme
  document.documentElement.setAttribute('data-theme', original.theme);

  // Restore style template
  document.documentElement.setAttribute(
    'data-style-template',
    original.styleTemplate,
  );

  // Restore sidebar placement
  document.documentElement.setAttribute(
    'data-sidebar-placement',
    original.sidebarPlacement,
  );

  // Restore language
  document.documentElement.setAttribute('lang', original.language);
  document.documentElement.setAttribute('data-language', original.language);

  // Restore page title
  document.title = original.pageTitle;

  // Restore all body classes to original state
  // Remove all current classes and restore the original snapshot
  const currentClasses = Array.from(document.body.classList);
  for (const c of currentClasses) {
    document.body.classList.remove(c);
  }
  for (const c of original.allBodyClasses) {
    document.body.classList.add(c);
  }

  // Restore instance type
  document.documentElement.setAttribute('data-instance-type', original.instanceType);

  // Restore sidebar section visibility
  document.documentElement.setAttribute('data-show-followers', original.showFollowers);
  document.documentElement.setAttribute('data-show-following', original.showFollowing);
  document.documentElement.setAttribute('data-show-hive-info', original.showHiveInfo);

  // Restore list type
  if (original.listType !== null) {
    document.documentElement.setAttribute('data-list-type', original.listType);
  } else {
    document.documentElement.removeAttribute('data-list-type');
  }
}

interface FloatingMenuWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingMenuWindow({
  isOpen,
  onClose,
}: FloatingMenuWindowProps) {
  const [config, setConfig] = useState<Record<string, ConfigValue>>(() => {
    return InstanceConfigManager.getConfig() as unknown as Record<string, ConfigValue>;
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const originalStateRef = useRef<OriginalState | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the dialog when it opens for keyboard accessibility
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  const handleUpdate = useCallback((path: string, value: ConfigValue) => {
    setConfig((prev) => {
      let updated = updateNestedPath(prev, path, value);

      // Auto-fill postsFilters when instance type changes
      if (path === 'configuration.instanceConfiguration.type') {
        const blogFilters = ['blog', 'posts', 'comments', 'replies'];
        const communityFilters = ['trending', 'hot', 'new'];
        const filters = value === 'community' ? communityFilters : blogFilters;
        updated = updateNestedPath(
          updated,
          'configuration.instanceConfiguration.features.postsFilters',
          filters,
        );
      }

      return updated;
    });
  }, []);

  const handleDownload = useCallback(() => {
    downloadJson(config, 'config.json');
  }, [config]);

  const handleTogglePreview = useCallback(() => {
    setIsPreviewMode((prev) => {
      if (!prev) {
        // Entering preview mode - save original state
        originalStateRef.current = {
          theme: document.documentElement.getAttribute('data-theme') || 'light',
          styleTemplate:
            document.documentElement.getAttribute('data-style-template') ||
            'medium',
          sidebarPlacement:
            document.documentElement.getAttribute('data-sidebar-placement') ||
            'right',
          allBodyClasses: Array.from(document.body.classList),
          pageTitle: document.title,
          language: document.documentElement.getAttribute('lang') || 'en',
          instanceType:
            document.documentElement.getAttribute('data-instance-type') || 'blog',
          showFollowers:
            document.documentElement.getAttribute('data-show-followers') || 'true',
          showFollowing:
            document.documentElement.getAttribute('data-show-following') || 'true',
          showHiveInfo:
            document.documentElement.getAttribute('data-show-hive-info') || 'true',
          listType: document.documentElement.getAttribute('data-list-type'),
        };
        applyPreviewConfig(config);
      } else {
        // Exiting preview mode - restore original state
        if (originalStateRef.current) {
          restoreOriginalState(originalStateRef.current);
          originalStateRef.current = null;
        }
      }
      return !prev;
    });
  }, [config]);

  // Apply preview when config changes (if in preview mode)
  // Uses originalStateRef (set in handleTogglePreview) for cleanup to ensure
  // the true pre-preview state is restored, not re-captured preview state
  useEffect(() => {
    if (!isPreviewMode) {
      return;
    }

    applyPreviewConfig(config);

    // Cleanup: restore original state on unmount or when isPreviewMode becomes false
    // Uses the snapshot captured in handleTogglePreview when entering preview mode
    return () => {
      if (originalStateRef.current) {
        restoreOriginalState(originalStateRef.current);
      }
    };
  }, [config, isPreviewMode]);

  const handleExitPreview = useCallback(() => {
    if (originalStateRef.current) {
      restoreOriginalState(originalStateRef.current);
      originalStateRef.current = null;
    }
    setIsPreviewMode(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  const windowClassName = useMemo(
    () =>
      `absolute bottom-0 left-0 right-0 shadow-2xl transition-all duration-300 ease-in-out pointer-events-auto overflow-hidden ${
        isOpen ? 'h-[80vh] rounded-t-2xl' : 'h-0'
      }`,
    [isOpen],
  );

  // Preview indicator component (shown regardless of menu state)
  const previewIndicator = isPreviewMode && (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <button
        type="button"
        onClick={handleExitPreview}
        className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-sans font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer group"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}
        aria-label="Exit preview mode"
      >
        <span
          className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
          aria-hidden="true"
        />
        <span>Preview Mode</span>
        <svg
          className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity"
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
  );

  if (!isOpen) {
    return (
      <div className="fixed inset-0 z-40 pointer-events-none">
        {previewIndicator}
        <div
          className={windowClassName}
          style={{
            maxHeight: '80vh',
            backgroundColor: FLOATING_MENU_THEME.background,
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-40 pointer-events-none"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-editor-title"
    >
      {previewIndicator}

      <div
        className={windowClassName}
        style={{
          maxHeight: '80vh',
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
            <h2 id="config-editor-title" className="text-sm font-semibold font-sans text-white">
              Configuration Editor
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePreview}
                className={`text-sm font-sans px-3 py-1.5 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1.5 ${
                  isPreviewMode
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-gray-300 hover:text-gray-100'
                }`}
                style={{
                  backgroundColor: isPreviewMode
                    ? 'rgba(16, 185, 129, 0.2)'
                    : FLOATING_MENU_THEME.buttonBackground,
                }}
                type="button"
                aria-label={
                  isPreviewMode ? 'Exit preview mode' : 'Preview configuration'
                }
                aria-pressed={isPreviewMode}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                {isPreviewMode ? 'Exit Preview' : 'Preview'}
              </button>
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
