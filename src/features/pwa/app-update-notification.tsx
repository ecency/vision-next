"use client";

import { useState, useEffect } from "react";
import { useStaleServiceWorkerDetector } from "./stale-service-worker-detector";

interface AppUpdateNotificationProps {
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function AppUpdateNotification({ 
  autoHide = false, 
  autoHideDelay = 10000 
}: AppUpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isStale, forceRefresh } = useStaleServiceWorkerDetector();

  useEffect(() => {
    if (isStale) {
      setIsVisible(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isStale, autoHide, autoHideDelay]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await forceRefresh();
    } catch (error) {
      console.error("Failed to update app:", error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 z-50">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 border border-blue-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-sm">
              App Update Available
            </h3>
            <p className="text-xs text-blue-100 mt-1">
              A new version of Ecency is available. Update now for the best experience.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 text-blue-200 hover:text-white"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 bg-white text-blue-600 px-3 py-2 rounded text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Updating..." : "Update Now"}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-sm text-blue-200 hover:text-white"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Toast-style notification for app updates
 */
export function AppUpdateToast() {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isStale, forceRefresh } = useStaleServiceWorkerDetector();

  useEffect(() => {
    if (isStale) {
      setIsVisible(true);
      
      // Auto-hide after 15 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 15000);
      
      return () => clearTimeout(timer);
    }
  }, [isStale]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    await forceRefresh();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Update available
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Refresh to get the latest version
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
            >
              {isUpdating ? "Updating..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}