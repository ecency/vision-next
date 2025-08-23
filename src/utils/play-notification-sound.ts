"use client";

/**
 * Plays the notification sound in a browser-safe way without mutating the DOM.
 * Using the `Audio` constructor avoids React reconciliation issues caused by
 * manually inserting elements into the document during hydration.
 */
export function playNotificationSound() {
  // Guard against server-side execution or environments without the Audio API.
  if (typeof Audio === "undefined") {
    return;
  }

  const audio = new Audio("/assets/notification.mp3");
  const playPromise = audio.play();

  if (playPromise) {
    playPromise.catch((e) =>
      console.warn("Failed to play notification sound:", e)
    );
  }

  // Allow the element to be garbage collected once playback finishes.
  audio.addEventListener("ended", () => {
    audio.src = "";
  });
}

