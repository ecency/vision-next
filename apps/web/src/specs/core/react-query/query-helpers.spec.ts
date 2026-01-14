import {
  prefetchQuery,
  prefetchInfiniteQuery,
  getQueryData,
  getInfiniteQueryData,
  withFeatureFlag
} from "../../../core/react-query/query-helpers";
import { QueryClient } from "@tanstack/react-query";

// Mock the getQueryClient function
jest.mock("../../../core/react-query/index", () => ({
  getQueryClient: jest.fn()
}));

// Mock the EcencyConfigManager
jest.mock("../../../config", () => ({
  EcencyConfigManager: {
    CONFIG: {
      visionFeatures: {
        points: { enabled: true },
        promoted: { enabled: true }
      }
    }
  }
}));

import { getQueryClient } from "../../../core/react-query/index";
import { EcencyConfigManager } from "../../../config";

describe("Query Helpers", () => {
  let mockQueryClient: jest.Mocked<QueryClient>;

  beforeEach(() => {
    mockQueryClient = {
      prefetchQuery: jest.fn().mockResolvedValue(undefined),
      prefetchInfiniteQuery: jest.fn().mockResolvedValue(undefined),
      getQueryData: jest.fn(),
      fetchQuery: jest.fn()
    } as any;

    (getQueryClient as jest.Mock).mockReturnValue(mockQueryClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("prefetchQuery", () => {
    it("should prefetch query and return cached data", async () => {
      const mockData = { id: 1, title: "Test Post" };
      const queryOptions = {
        queryKey: ["post", "author", "permlink"],
        queryFn: jest.fn()
      };

      mockQueryClient.getQueryData.mockReturnValue(mockData);

      const result = await prefetchQuery(queryOptions);

      expect(mockQueryClient.prefetchQuery).toHaveBeenCalledWith(queryOptions);
      expect(mockQueryClient.getQueryData).toHaveBeenCalledWith(queryOptions.queryKey);
      expect(result).toEqual(mockData);
    });

    it("should handle undefined cached data", async () => {
      const queryOptions = {
        queryKey: ["post", "author", "permlink"],
        queryFn: jest.fn()
      };

      mockQueryClient.getQueryData.mockReturnValue(undefined);

      const result = await prefetchQuery(queryOptions);

      expect(result).toBeUndefined();
    });
  });

  describe("prefetchInfiniteQuery", () => {
    it("should prefetch infinite query and return cached data", async () => {
      const mockData = {
        pages: [{ items: [1, 2, 3] }],
        pageParams: [undefined]
      };
      const queryOptions = {
        queryKey: ["posts", "username"],
        queryFn: jest.fn(),
        initialPageParam: undefined,
        getNextPageParam: jest.fn()
      };

      mockQueryClient.getQueryData.mockReturnValue(mockData);

      const result = await prefetchInfiniteQuery(queryOptions);

      expect(mockQueryClient.prefetchInfiniteQuery).toHaveBeenCalledWith(queryOptions);
      expect(mockQueryClient.getQueryData).toHaveBeenCalledWith(queryOptions.queryKey);
      expect(result).toEqual(mockData);
    });
  });

  describe("getQueryData", () => {
    it("should retrieve cached query data", () => {
      const mockData = { id: 1, title: "Cached Post" };
      const queryOptions = {
        queryKey: ["post", "author", "permlink"]
      };

      mockQueryClient.getQueryData.mockReturnValue(mockData);

      const result = getQueryData(queryOptions);

      expect(mockQueryClient.getQueryData).toHaveBeenCalledWith(queryOptions.queryKey);
      expect(result).toEqual(mockData);
    });

    it("should return undefined for missing cache", () => {
      const queryOptions = {
        queryKey: ["post", "author", "permlink"]
      };

      mockQueryClient.getQueryData.mockReturnValue(undefined);

      const result = getQueryData(queryOptions);

      expect(result).toBeUndefined();
    });
  });

  describe("getInfiniteQueryData", () => {
    it("should retrieve cached infinite query data", () => {
      const mockData = {
        pages: [{ items: [1, 2, 3] }, { items: [4, 5, 6] }],
        pageParams: [undefined, 3]
      };
      const queryOptions = {
        queryKey: ["posts", "username"]
      };

      mockQueryClient.getQueryData.mockReturnValue(mockData);

      const result = getInfiniteQueryData(queryOptions);

      expect(mockQueryClient.getQueryData).toHaveBeenCalledWith(queryOptions.queryKey);
      expect(result).toEqual(mockData);
    });
  });

  describe("withFeatureFlag", () => {
    it("should enable query when feature flag is true", () => {
      const queryOptions = {
        queryKey: ["points", "username"],
        queryFn: jest.fn()
      };

      const result = withFeatureFlag(
        (config) => config.visionFeatures.points.enabled,
        queryOptions
      );

      expect(result).toHaveProperty("enabled");
      expect(typeof result.enabled).toBe("boolean");
      expect(result.enabled).toBe(true);
    });

    it("should disable query when feature flag is false", () => {
      // Temporarily override the config to have points disabled
      const originalConfig = EcencyConfigManager.CONFIG;
      (EcencyConfigManager as any).CONFIG = {
        visionFeatures: {
          points: { enabled: false },
          promoted: { enabled: true }
        }
      };

      const queryOptions = {
        queryKey: ["points", "username"],
        queryFn: jest.fn()
      };

      const result = withFeatureFlag(
        (config) => config.visionFeatures.points.enabled,
        queryOptions
      );

      expect(result).toHaveProperty("enabled");
      expect(typeof result.enabled).toBe("boolean");
      expect(result.enabled).toBe(false);

      // Restore original config
      (EcencyConfigManager as any).CONFIG = originalConfig;
    });

    it("should preserve existing enabled state when feature flag is true", () => {
      const queryOptions = {
        queryKey: ["points", "username"],
        queryFn: jest.fn(),
        enabled: false
      };

      const result = withFeatureFlag((config) => config.visionFeatures.points.enabled, queryOptions);

      // The result should still respect the original enabled: false
      expect(result).toHaveProperty("enabled");
      expect(typeof result.enabled).toBe("boolean");
      expect(result.enabled).toBe(false);
    });

    it("should work with infinite query options", () => {
      const queryOptions = {
        queryKey: ["promoted"],
        queryFn: jest.fn(),
        initialPageParam: undefined,
        getNextPageParam: jest.fn()
      };

      const result = withFeatureFlag(
        (config) => config.visionFeatures.promoted.enabled,
        queryOptions
      );

      expect(result).toHaveProperty("enabled");
      expect(typeof result.enabled).toBe("boolean");
      expect(result.enabled).toBe(true);
      expect(result).toHaveProperty("queryKey");
      expect(result).toHaveProperty("initialPageParam");
    });
  });
});
