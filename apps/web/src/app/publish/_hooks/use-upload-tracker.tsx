"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from "react";

export type UploadStatus = "pending" | "completed" | "failed";

export interface UploadInfo {
  id: string;
  status: UploadStatus;
  abortController?: AbortController;
}

export interface UploadResult {
  completed: number;
  failed: number;
  timedOut: number;
  total: number;
  allSucceeded: boolean;
}

interface UploadTrackerContextValue {
  pendingUploads: Map<string, UploadInfo>;
  hasPendingUploads: boolean;
  registerUpload: (id: string, abortController?: AbortController) => void;
  markComplete: (id: string) => void;
  markFailed: (id: string) => void;
  waitForUploads: (timeoutMs?: number) => Promise<UploadResult>;
}

const UploadTrackerContext = createContext<UploadTrackerContextValue | undefined>(undefined);

const UPLOAD_TIMEOUT_MS = 30000; // 30 seconds per upload
const CHECK_INTERVAL_MS = 100; // Check every 100ms

export function UploadTrackerProvider({ children }: PropsWithChildren) {
  const [uploads, setUploads] = useState<Map<string, UploadInfo>>(new Map());
  const uploadsRef = useRef(uploads);

  // Keep ref in sync with state for callbacks
  uploadsRef.current = uploads;

  const registerUpload = useCallback((id: string, abortController?: AbortController) => {
    setUploads((prev) => {
      const next = new Map(prev);
      next.set(id, { id, status: "pending", abortController });
      return next;
    });
  }, []);

  const markComplete = useCallback((id: string) => {
    setUploads((prev) => {
      const next = new Map(prev);
      const upload = next.get(id);
      if (upload) {
        next.set(id, { ...upload, status: "completed" });
        // Remove completed upload after a short delay to ensure state updates propagate
        setTimeout(() => {
          setUploads((current) => {
            const updated = new Map(current);
            updated.delete(id);
            return updated;
          });
        }, 100);
      }
      return next;
    });
  }, []);

  const markFailed = useCallback((id: string) => {
    setUploads((prev) => {
      const next = new Map(prev);
      const upload = next.get(id);
      if (upload) {
        next.set(id, { ...upload, status: "failed" });
        // Remove failed upload after a short delay
        setTimeout(() => {
          setUploads((current) => {
            const updated = new Map(current);
            updated.delete(id);
            return updated;
          });
        }, 100);
      }
      return next;
    });
  }, []);

  const waitForUploads = useCallback(
    (timeoutMs: number = UPLOAD_TIMEOUT_MS): Promise<UploadResult> => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const uploadStartCount = uploadsRef.current.size;

        // If no uploads pending, resolve immediately with success
        if (uploadStartCount === 0) {
          resolve({
            completed: 0,
            failed: 0,
            timedOut: 0,
            total: 0,
            allSucceeded: true
          });
          return;
        }

        const checkInterval = setInterval(() => {
          const currentUploads = uploadsRef.current;
          const pendingCount = Array.from(currentUploads.values()).filter(
            (upload) => upload.status === "pending"
          ).length;

          // All uploads completed or failed
          if (pendingCount === 0) {
            clearInterval(checkInterval);

            // Calculate results
            const completed = Array.from(currentUploads.values()).filter(
              (u) => u.status === "completed"
            ).length;
            const failed = Array.from(currentUploads.values()).filter(
              (u) => u.status === "failed"
            ).length;

            resolve({
              completed,
              failed,
              timedOut: 0,
              total: uploadStartCount,
              allSucceeded: failed === 0
            });
            return;
          }

          // Timeout exceeded
          const elapsed = Date.now() - startTime;
          if (elapsed > timeoutMs * uploadStartCount) {
            clearInterval(checkInterval);

            const timedOutCount = pendingCount;
            console.warn(
              `Upload tracker timeout: ${timedOutCount} uploads still pending after ${elapsed}ms`
            );

            // Mark remaining uploads as failed
            currentUploads.forEach((upload) => {
              if (upload.status === "pending") {
                markFailed(upload.id);
              }
            });

            // Calculate results including timed out uploads
            const completed = Array.from(currentUploads.values()).filter(
              (u) => u.status === "completed"
            ).length;
            const failed = Array.from(currentUploads.values()).filter(
              (u) => u.status === "failed"
            ).length;

            resolve({
              completed,
              failed: failed - timedOutCount, // Subtract timed out from failed count
              timedOut: timedOutCount,
              total: uploadStartCount,
              allSucceeded: false
            });
          }
        }, CHECK_INTERVAL_MS);
      });
    },
    [markFailed]
  );

  const hasPendingUploads = useMemo(() => {
    return Array.from(uploads.values()).some((upload) => upload.status === "pending");
  }, [uploads]);

  const value = useMemo<UploadTrackerContextValue>(
    () => ({
      pendingUploads: uploads,
      hasPendingUploads,
      registerUpload,
      markComplete,
      markFailed,
      waitForUploads
    }),
    [uploads, hasPendingUploads, registerUpload, markComplete, markFailed, waitForUploads]
  );

  return <UploadTrackerContext.Provider value={value}>{children}</UploadTrackerContext.Provider>;
}

export function useUploadTracker(): UploadTrackerContextValue {
  const context = useContext(UploadTrackerContext);
  if (!context) {
    throw new Error("useUploadTracker must be used within UploadTrackerProvider");
  }
  return context;
}

// Optional hook that returns undefined if not in upload tracker context
// Useful for components that may or may not be wrapped in the provider
export function useOptionalUploadTracker(): UploadTrackerContextValue | undefined {
  return useContext(UploadTrackerContext);
}
