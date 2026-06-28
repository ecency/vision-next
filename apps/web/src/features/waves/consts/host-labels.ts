import { WaveHosts } from "@/features/waves/enums";

// Sentinel "source" for the Shorts (reels) tab. Not a real container host: it
// selects the cross-container video feed (esync /api/waves/shorts) and a reels
// renderer. Lives in WAVE_HOST_LABELS so it shows in the picker + tab bar like
// any other source; the waves page routes this value to the reels view.
export const SHORTS_SOURCE = "shorts";

export const WAVE_HOST_LABELS: Record<string, string> = {
  [WaveHosts.Waves]: "Waves",
  [WaveHosts.Leo]: "Threads",
  [WaveHosts.Liketu]: "Moments",
  [WaveHosts.PeakSnaps]: "Snaps",
  [SHORTS_SOURCE]: "Shorts"
};
