import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGifsQuery, GIPHY_API_KEY } from '@/api/queries/get-gifs-query';
import { QueryIdentifiers } from '@/core/react-query';
import { appAxios } from '@/api/axios';

// Mock axios
vi.mock('@/api/axios', () => ({
  appAxios: vi.fn(),
}));

describe('getGifsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('query key generation', () => {
    it('should generate query key with query and limit', () => {
      const options = getGifsQuery('funny cats', 20);

      expect(options.queryKey).toEqual([QueryIdentifiers.GIFS, 'funny cats', 20]);
    });

    it('should include query string in key', () => {
      const options = getGifsQuery('dogs', 10);

      expect(options.queryKey[1]).toBe('dogs');
    });

    it('should include limit in key', () => {
      const options = getGifsQuery('test', 50);

      expect(options.queryKey[2]).toBe(50);
    });

    it('should default limit to 20', () => {
      const options = getGifsQuery('test');

      expect(options.queryKey[2]).toBe(20);
    });

    it('should handle empty query string', () => {
      const options = getGifsQuery('');

      expect(options.queryKey[1]).toBe('');
    });

    it('should generate different keys for different queries', () => {
      const options1 = getGifsQuery('cats', 20);
      const options2 = getGifsQuery('dogs', 20);

      expect(options1.queryKey).not.toEqual(options2.queryKey);
    });
  });

  describe('initial state', () => {
    it('should have empty pages and pageParams', () => {
      const options = getGifsQuery('test');

      expect(options.initialData).toEqual({ pages: [], pageParams: [] });
    });

    it('should have initial page param of 0', () => {
      const options = getGifsQuery('test');

      expect(options.initialPageParam).toBe(0);
    });
  });

  describe('queryFn behavior', () => {
    it('should call search endpoint for non-empty query', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: '1', url: 'https://giphy.com/1' },
            { id: '2', url: 'https://giphy.com/2' },
          ],
        },
      };

      vi.mocked(appAxios).mockResolvedValue(mockResponse);

      const options = getGifsQuery('funny', 20);
      await options.queryFn({ pageParam: 0 });

      const callUrl = vi.mocked(appAxios).mock.calls[0][0];
      expect(callUrl).toContain('api.giphy.com/v1/gifs/search');
      expect(callUrl).toContain('q=funny');
    });

    it('should call trending endpoint for empty query', async () => {
      const mockResponse = {
        data: {
          data: [{ id: '1', url: 'https://giphy.com/1' }],
        },
      };

      vi.mocked(appAxios).mockResolvedValue(mockResponse);

      const options = getGifsQuery('', 20);
      await options.queryFn({ pageParam: 0 });

      const callUrl = vi.mocked(appAxios).mock.calls[0][0];
      expect(callUrl).toContain('api.giphy.com/v1/gifs/trending');
      expect(callUrl).not.toContain('q=');
    });

    it('should include API key in request', async () => {
      const mockResponse = { data: { data: [] } };
      vi.mocked(appAxios).mockResolvedValue(mockResponse);

      const options = getGifsQuery('test');
      await options.queryFn({ pageParam: 0 });

      const callUrl = vi.mocked(appAxios).mock.calls[0][0];
      expect(callUrl).toContain(`api_key=${GIPHY_API_KEY}`);
    });

    it('should include limit in request', async () => {
      const mockResponse = { data: { data: [] } };
      vi.mocked(appAxios).mockResolvedValue(mockResponse);

      const options = getGifsQuery('test', 30);
      await options.queryFn({ pageParam: 0 });

      const callUrl = vi.mocked(appAxios).mock.calls[0][0];
      expect(callUrl).toContain('limit=30');
    });

    it('should include offset from pageParam', async () => {
      const mockResponse = { data: { data: [] } };
      vi.mocked(appAxios).mockResolvedValue(mockResponse);

      const options = getGifsQuery('test', 20);
      await options.queryFn({ pageParam: 40 });

      const callUrl = vi.mocked(appAxios).mock.calls[0][0];
      expect(callUrl).toContain('offset=40');
    });

    it('should default offset to 0 when pageParam is 0', async () => {
      const mockResponse = { data: { data: [] } };
      vi.mocked(appAxios).mockResolvedValue(mockResponse);

      const options = getGifsQuery('test');
      await options.queryFn({ pageParam: 0 });

      const callUrl = vi.mocked(appAxios).mock.calls[0][0];
      expect(callUrl).toContain('offset=0');
    });

    it('should return gif data from response', async () => {
      const mockGifs = [
        { id: '1', url: 'https://giphy.com/1' },
        { id: '2', url: 'https://giphy.com/2' },
      ];

      const mockResponse = {
        data: {
          data: mockGifs,
        },
      };

      vi.mocked(appAxios).mockResolvedValue(mockResponse);

      const options = getGifsQuery('test');
      const result = await options.queryFn({ pageParam: 0 });

      expect(result).toEqual(mockGifs);
    });
  });

  describe('getNextPageParam', () => {
    it('should return undefined when last page is empty', () => {
      const options = getGifsQuery('test', 20);
      const result = options.getNextPageParam([], [], 0);

      expect(result).toBeUndefined();
    });

    it('should return undefined when last page has fewer items than limit', () => {
      const lastPage = [{ id: '1' }, { id: '2' }];
      const options = getGifsQuery('test', 20);
      const result = options.getNextPageParam(lastPage, [], 0);

      expect(result).toBeUndefined();
    });

    it('should return next offset when last page is full', () => {
      const lastPage = Array.from({ length: 20 }, (_, i) => ({ id: String(i) }));
      const options = getGifsQuery('test', 20);
      const result = options.getNextPageParam(lastPage, [], 0);

      expect(result).toBe(20);
    });

    it('should increment offset correctly', () => {
      const lastPage = Array.from({ length: 20 }, (_, i) => ({ id: String(i) }));
      const options = getGifsQuery('test', 20);
      const result = options.getNextPageParam(lastPage, [], 40);

      expect(result).toBe(60);
    });

    it('should handle custom limit', () => {
      const lastPage = Array.from({ length: 30 }, (_, i) => ({ id: String(i) }));
      const options = getGifsQuery('test', 30);
      const result = options.getNextPageParam(lastPage, [], 0);

      expect(result).toBe(30);
    });

    it('should return undefined when lastPage is null', () => {
      const options = getGifsQuery('test', 20);
      const result = options.getNextPageParam(null as any, [], 0);

      expect(result).toBeUndefined();
    });

    it('should handle first page correctly', () => {
      const lastPage = Array.from({ length: 20 }, (_, i) => ({ id: String(i) }));
      const options = getGifsQuery('test', 20);
      const result = options.getNextPageParam(lastPage, [], undefined);

      expect(result).toBe(20);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in query', async () => {
      const mockResponse = { data: { data: [] } };
      vi.mocked(appAxios).mockResolvedValue(mockResponse);

      const options = getGifsQuery('hello world!', 20);
      await options.queryFn({ pageParam: 0 });

      const callUrl = vi.mocked(appAxios).mock.calls[0][0];
      expect(callUrl).toContain('q=hello+world');
    });

    it('should handle very long query strings', async () => {
      const longQuery = 'a'.repeat(100);
      const mockResponse = { data: { data: [] } };
      vi.mocked(appAxios).mockResolvedValue(mockResponse);

      const options = getGifsQuery(longQuery, 20);
      await options.queryFn({ pageParam: 0 });

      expect(vi.mocked(appAxios)).toHaveBeenCalled();
    });

    it('should handle large limit values', () => {
      const options = getGifsQuery('test', 100);

      expect(options.queryKey[2]).toBe(100);
    });

    it('should handle zero limit', () => {
      const options = getGifsQuery('test', 0);

      expect(options.queryKey[2]).toBe(0);
    });

    it('should handle unicode in query', async () => {
      const mockResponse = { data: { data: [] } };
      vi.mocked(appAxios).mockResolvedValue(mockResponse);

      const options = getGifsQuery('猫', 20);
      await options.queryFn({ pageParam: 0 });

      expect(vi.mocked(appAxios)).toHaveBeenCalled();
    });
  });

  describe('API key', () => {
    it('should have valid API key constant', () => {
      expect(GIPHY_API_KEY).toBeDefined();
      expect(typeof GIPHY_API_KEY).toBe('string');
      expect(GIPHY_API_KEY.length).toBeGreaterThan(0);
    });
  });

  describe('return structure', () => {
    it('should return query options with all required fields', () => {
      const options = getGifsQuery('test');

      expect(options).toHaveProperty('queryKey');
      expect(options).toHaveProperty('queryFn');
      expect(options).toHaveProperty('initialData');
      expect(options).toHaveProperty('initialPageParam');
      expect(options).toHaveProperty('getNextPageParam');
    });

    it('should have queryFn that is a function', () => {
      const options = getGifsQuery('test');

      expect(typeof options.queryFn).toBe('function');
    });

    it('should have getNextPageParam that is a function', () => {
      const options = getGifsQuery('test');

      expect(typeof options.getNextPageParam).toBe('function');
    });
  });
});
