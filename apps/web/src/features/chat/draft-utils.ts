const DRAFT_STORAGE_KEY = "ecency-chat-drafts";
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface DraftData {
  message: string;
  timestamp: number;
}

/**
 * Save a draft message for a channel
 */
export function saveDraft(channelId: string, message: string): void {
  if (typeof window === "undefined") return;

  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "{}");

    if (message.trim()) {
      drafts[channelId] = {
        message,
        timestamp: Date.now()
      };
    } else {
      delete drafts[channelId];
    }

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error("Failed to save draft:", error);
  }
}

/**
 * Load a draft message for a channel
 */
export function loadDraft(channelId: string): string {
  if (typeof window === "undefined") return "";

  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "{}");
    const draft = drafts[channelId] as DraftData | undefined;

    if (!draft) return "";

    // Check if draft is expired (older than 24 hours)
    if (Date.now() - draft.timestamp > DRAFT_EXPIRY_MS) {
      delete drafts[channelId];
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
      return "";
    }

    return draft.message;
  } catch (error) {
    console.error("Failed to load draft:", error);
    return "";
  }
}

/**
 * Clear a draft message for a channel
 */
export function clearDraft(channelId: string): void {
  if (typeof window === "undefined") return;

  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "{}");
    delete drafts[channelId];
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error("Failed to clear draft:", error);
  }
}
