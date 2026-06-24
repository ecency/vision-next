import { describe, expect, it } from "vitest";
import {
  ECENCY_WAVES_HOSTS,
  isEcencyWavesHost,
  WaveHosts
} from "@/features/waves/enums/wave-hosts";

describe("ECENCY_WAVES_HOSTS", () => {
  it("publishes to hive.flow first, then ecency.waves", () => {
    // Write-preference order: a new wave goes to the first host with a live
    // container, so hive.flow must precede ecency.waves.
    expect(ECENCY_WAVES_HOSTS).toEqual([WaveHosts.Flow, WaveHosts.Waves]);
    expect(ECENCY_WAVES_HOSTS[0]).toBe("hive.flow");
    expect(ECENCY_WAVES_HOSTS[1]).toBe("ecency.waves");
  });
});

describe("isEcencyWavesHost", () => {
  it("recognises Ecency's own waves containers", () => {
    expect(isEcencyWavesHost("hive.flow")).toBe(true);
    expect(isEcencyWavesHost("ecency.waves")).toBe(true);
  });

  it("rejects third-party containers and empty values", () => {
    expect(isEcencyWavesHost("leothreads")).toBe(false);
    expect(isEcencyWavesHost("peak.snaps")).toBe(false);
    expect(isEcencyWavesHost("liketu.moments")).toBe(false);
    expect(isEcencyWavesHost("")).toBe(false);
    expect(isEcencyWavesHost(undefined)).toBe(false);
    expect(isEcencyWavesHost(null)).toBe(false);
  });
});
