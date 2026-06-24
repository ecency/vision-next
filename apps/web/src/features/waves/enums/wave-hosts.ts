export enum WaveHosts {
  Testhreads = "testhreads",
  Flow = "hive.flow",
  Waves = "ecency.waves",
  Leo = "leothreads",
  Dbuzz = "dbuzz",
  Liketu = "liketu.moments",
  PeakSnaps = "peak.snaps"
}

/**
 * Ecency's own waves containers, in write-preference order. A new wave from the
 * standard composer is published into the first one that currently has a live
 * anchor post: `hive.flow` (the future unified waves+snaps account) once it
 * launches, otherwise the legacy `ecency.waves`. `hive.flow` is pre-provisioned
 * and inert today, so this resolves to `ecency.waves` for now and switches over
 * automatically when `hive.flow` starts posting. The unified feed reads every
 * container; only these are written to. (Mirrors mobile's `WAVES_HOSTS`.)
 */
export const ECENCY_WAVES_HOSTS: readonly string[] = [WaveHosts.Flow, WaveHosts.Waves];

/** True when `host` is one of Ecency's own waves containers (hive.flow / ecency.waves). */
export const isEcencyWavesHost = (host?: string | null): boolean =>
  !!host && ECENCY_WAVES_HOSTS.includes(host);
