"use client";

import { useUploadImageMutation } from "@/api/sdk-mutations";

/**
 * Legacy export for backward compatibility.
 * Now uses SDK mutation hooks internally.
 */
export function useUploadPostImage() {
  return useUploadImageMutation();
}
