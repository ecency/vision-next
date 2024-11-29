import { WaveHosts } from "@/features/waves/enums";

export const AVAILABLE_THREAD_HOSTS = [
  ...(process.env.NODE_ENV === "development" ? [WaveHosts.Testhreads] : []),
  WaveHosts.Waves,
  WaveHosts.Liketu,
  WaveHosts.Leo,
  WaveHosts.Dbuzz
];
