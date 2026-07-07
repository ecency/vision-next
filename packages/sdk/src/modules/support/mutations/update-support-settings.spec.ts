import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryKeys } from "@/modules/core";
import { getSupportSettingsRequest } from "../queries/get-support-settings-query-options";
import {
  applySupportSettingsUpdate,
  updateSupportSettingsRequest,
} from "./update-support-settings";

const SETTINGS = {
  username: "alice",
  beneficiary_percent: 5,
  curation_percent: 10,
  created: "2026-07-07T00:00:00",
  modified: "2026-07-07T00:00:00",
};

describe("support settings requests", () => {
  // getBoundFetch() caches the bound fetch on first call, so reuse one stable mock
  // and reset it per test (a fresh mock each test wouldn't be picked up).
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getSupportSettingsRequest", () => {
    it("POSTs to /private-api/support-settings with only the code", async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => SETTINGS });

      const result = await getSupportSettingsRequest("hs-token");

      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain("/private-api/support-settings");
      expect(String(url)).not.toContain("support-settings-update");
      expect((init as RequestInit).method).toBe("POST");
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({ code: "hs-token" });
      expect(result).toEqual(SETTINGS);
    });

    it("rethrows a non-2xx with status + server data attached", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      });

      await expect(getSupportSettingsRequest("bad")).rejects.toMatchObject({
        status: 401,
        data: { message: "Unauthorized" },
      });
    });
  });

  describe("updateSupportSettingsRequest", () => {
    it("POSTs to /private-api/support-settings-update with code and both percents", async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => SETTINGS });

      const result = await updateSupportSettingsRequest("hs-token", {
        beneficiary_percent: 5,
        curation_percent: 10,
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain("/private-api/support-settings-update");
      expect((init as RequestInit).method).toBe("POST");
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({
        code: "hs-token",
        beneficiary_percent: 5,
        curation_percent: 10,
      });
      expect(result).toEqual(SETTINGS);
    });

    it("sends explicit zeros so an opt-out is persisted", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...SETTINGS, beneficiary_percent: 0, curation_percent: 0 }),
      });

      await updateSupportSettingsRequest("hs-token", {
        beneficiary_percent: 0,
        curation_percent: 0,
      });

      const payload = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
      expect(payload.beneficiary_percent).toBe(0);
      expect(payload.curation_percent).toBe(0);
    });

    it("rethrows a 400 validation error with the gateway's plain message", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "beneficiary_percent must be an integer between 0 and 100" }),
      });

      await expect(
        updateSupportSettingsRequest("hs-token", { beneficiary_percent: 101, curation_percent: 0 })
      ).rejects.toMatchObject({
        status: 400,
        message: "beneficiary_percent must be an integer between 0 and 100",
      });
    });

    it("does not throw on a non-JSON error body (keeps the status)", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("not json");
        },
      });

      await expect(
        updateSupportSettingsRequest("hs-token", { beneficiary_percent: 5, curation_percent: 0 })
      ).rejects.toMatchObject({ status: 500 });
    });
  });

  describe("applySupportSettingsUpdate", () => {
    it("seeds the fresh settings and invalidates the settings query key", async () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(QueryKeys.support.settings("alice"), {
        ...SETTINGS,
        beneficiary_percent: 0,
        curation_percent: 0,
      });
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await applySupportSettingsUpdate(queryClient, "alice", SETTINGS);

      expect(queryClient.getQueryData(QueryKeys.support.settings("alice"))).toEqual(SETTINGS);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QueryKeys.support.settings("alice"),
      });
      expect(
        queryClient.getQueryState(QueryKeys.support.settings("alice"))?.isInvalidated
      ).toBe(true);
    });
  });
});
