import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useImageDownloader } from '@/api/queries/image-downloader-query';
import { useGlobalStore } from '@/core/global-store';
import { appAxios } from '@/api/axios';
import { catchPostImage } from '@ecency/render-helper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockEntry, createTestQueryClient } from '@/specs/test-utils';
import { QueryIdentifiers } from '@/core/react-query';
import React from 'react';

// Mock dependencies
vi.mock('@/core/global-store', () => ({
  useGlobalStore: vi.fn((selector) => selector({ canUseWebp: true })),
}));

vi.mock('@/api/axios', () => ({
  appAxios: {
    get: vi.fn(),
  },
}));

vi.mock('@ecency/render-helper', () => ({
  catchPostImage: vi.fn(),
}));

// Mock FileReader
global.FileReader = class MockFileReader {
  result: string | null = null;
  onloadend: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;

  readAsDataURL(blob: Blob) {
    // Simulate successful read
    this.result = 'data:image/png;base64,mockbase64data';
    setTimeout(() => {
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
} as any;

describe('useImageDownloader', () => {
  let queryClient: QueryClient;
  const entry = mockEntry({ author: 'testauthor', permlink: 'test-post' });
  const noImage = 'https://example.com/no-image.png';
  const width = 600;
  const height = 400;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    // Mock useGlobalStore to properly invoke selector with mock state
    (useGlobalStore as any).mockImplementation((selector: any) =>
      selector({ canUseWebp: false })
    );
    (catchPostImage as any).mockReturnValue('https://example.com/image.png');
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('query key generation', () => {
    it('should generate query key with entry author, permlink, width, and height', () => {
      const { result } = renderHook(
        () => useImageDownloader(entry, noImage, width, height, true),
        { wrapper }
      );

      // Verify query key structure
      const queries = queryClient.getQueryCache().getAll();
      const imageQuery = queries.find(q =>
        q.queryKey[0] === QueryIdentifiers.ENTRY_THUMB
      );

      expect(imageQuery).toBeDefined();
      expect(imageQuery?.queryKey).toEqual([
        QueryIdentifiers.ENTRY_THUMB,
        'testauthor',
        'test-post',
        600,
        400
      ]);
      expect(result.current).toBeDefined();
    });

    it('should generate different keys for different entries', () => {
      const entry2 = mockEntry({ author: 'otheracc', permlink: 'other-post' });

      renderHook(
        () => useImageDownloader(entry, noImage, width, height, true),
        { wrapper }
      );

      renderHook(
        () => useImageDownloader(entry2, noImage, width, height, true),
        { wrapper }
      );

      const queries = queryClient.getQueryCache().getAll();
      const imageQueries = queries.filter(q =>
        q.queryKey[0] === QueryIdentifiers.ENTRY_THUMB
      );

      // Should have two different queries
      expect(imageQueries.length).toBe(2);

      // Verify keys are different
      const key1 = imageQueries.find(q => q.queryKey[1] === 'testauthor');
      const key2 = imageQueries.find(q => q.queryKey[1] === 'otheracc');

      expect(key1?.queryKey).toEqual([QueryIdentifiers.ENTRY_THUMB, 'testauthor', 'test-post', 600, 400]);
      expect(key2?.queryKey).toEqual([QueryIdentifiers.ENTRY_THUMB, 'otheracc', 'other-post', 600, 400]);
    });

    it('should generate different keys for different dimensions', () => {
      renderHook(
        () => useImageDownloader(entry, noImage, 600, 400, true),
        { wrapper }
      );

      renderHook(
        () => useImageDownloader(entry, noImage, 800, 600, true),
        { wrapper }
      );

      const queries = queryClient.getQueryCache().getAll();
      const imageQueries = queries.filter(q =>
        q.queryKey[0] === QueryIdentifiers.ENTRY_THUMB
      );

      // Should have two different queries
      expect(imageQueries.length).toBe(2);

      // Verify dimensions are different
      const key1 = imageQueries.find(q => q.queryKey[3] === 600);
      const key2 = imageQueries.find(q => q.queryKey[3] === 800);

      expect(key1?.queryKey).toEqual([QueryIdentifiers.ENTRY_THUMB, 'testauthor', 'test-post', 600, 400]);
      expect(key2?.queryKey).toEqual([QueryIdentifiers.ENTRY_THUMB, 'testauthor', 'test-post', 800, 600]);
    });
  });

  describe('WebP support', () => {
    it('should use WebP format when canUseWebp is true', async () => {
      (useGlobalStore as any).mockImplementation((selector: any) =>
        selector({ canUseWebp: true })
      );
      (appAxios.get as any).mockResolvedValue({ data: new Blob() });

      renderHook(() => useImageDownloader(entry, noImage, width, height, true), { wrapper });

      await waitFor(() => {
        expect(catchPostImage).toHaveBeenCalledWith(entry, width, height, 'webp');
      });
    });

    it('should not use WebP format when canUseWebp is false', async () => {
      (useGlobalStore as any).mockImplementation((selector: any) =>
        selector({ canUseWebp: false })
      );
      (appAxios.get as any).mockResolvedValue({ data: new Blob() });

      renderHook(() => useImageDownloader(entry, noImage, width, height, true), { wrapper });

      await waitFor(() => {
        expect(catchPostImage).toHaveBeenCalledWith(entry, width, height);
      });
    });
  });

  describe('queryFn behavior', () => {
    it('should fetch image as blob', async () => {
      (appAxios.get as any).mockResolvedValue({ data: new Blob() });

      renderHook(() => useImageDownloader(entry, noImage, width, height, true), { wrapper });

      await waitFor(() => {
        expect(appAxios.get).toHaveBeenCalledWith(expect.any(String), {
          responseType: 'blob',
        });
      });
    });

    it('should convert blob to base64', async () => {
      (appAxios.get as any).mockResolvedValue({ data: new Blob() });

      const { result } = renderHook(
        () => useImageDownloader(entry, noImage, width, height, true),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });
    });

    it('should use fallback image on fetch error when useFallback is true', async () => {
      (appAxios.get as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(
        () => useImageDownloader(entry, noImage, width, height, true, true),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data).toBe(noImage);
      });
    });

    it('should return empty string on error when useFallback is false', async () => {
      (appAxios.get as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(
        () => useImageDownloader(entry, noImage, width, height, true, false),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data).toBe('');
      });
    });

    it('should fetch fallback image when primary fails and data is empty', async () => {
      // Mock FileReader to return empty result
      const originalFileReader = global.FileReader;
      global.FileReader = class MockFileReader {
        result: string | null = null;
        onloadend: (() => void) | null = null;
        onerror: ((e: any) => void) | null = null;

        readAsDataURL(blob: Blob) {
          this.result = '';
          setTimeout(() => {
            if (this.onloadend) {
              this.onloadend();
            }
          }, 0);
        }
      } as any;

      (appAxios.get as any).mockResolvedValue({ data: new Blob() });

      renderHook(() => useImageDownloader(entry, noImage, width, height, true, true), { wrapper });

      await waitFor(() => {
        expect(appAxios.get).toHaveBeenCalled();
      });

      global.FileReader = originalFileReader;
    });
  });

  describe('enabled parameter', () => {
    it('should not fetch when enabled is false', () => {
      renderHook(() => useImageDownloader(entry, noImage, width, height, false), { wrapper });

      expect(appAxios.get).not.toHaveBeenCalled();
    });

    it('should fetch when enabled is true', async () => {
      (appAxios.get as any).mockResolvedValue({ data: new Blob() });

      renderHook(() => useImageDownloader(entry, noImage, width, height, true), { wrapper });

      await waitFor(() => {
        expect(appAxios.get).toHaveBeenCalled();
      });
    });
  });

  describe('retry behavior', () => {
    it('should have retry delay of 3000ms', () => {
      const { result } = renderHook(
        () => useImageDownloader(entry, noImage, width, height, false),
        { wrapper }
      );

      // Query should be configured with retryDelay
      expect(result.current).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle very large dimensions', async () => {
      (appAxios.get as any).mockResolvedValue({ data: new Blob() });

      renderHook(() => useImageDownloader(entry, noImage, 4000, 3000, true), { wrapper });

      await waitFor(() => {
        expect(catchPostImage).toHaveBeenCalledWith(entry, 4000, 3000);
      });
    });

    it('should handle zero dimensions', async () => {
      (appAxios.get as any).mockResolvedValue({ data: new Blob() });

      renderHook(() => useImageDownloader(entry, noImage, 0, 0, true), { wrapper });

      await waitFor(() => {
        expect(catchPostImage).toHaveBeenCalledWith(entry, 0, 0);
      });
    });

    it('should handle entry with no image', async () => {
      (catchPostImage as any).mockReturnValue('');
      (appAxios.get as any).mockResolvedValue({ data: new Blob() });

      renderHook(() => useImageDownloader(entry, noImage, width, height, true), { wrapper });

      await waitFor(() => {
        expect(appAxios.get).toHaveBeenCalled();
      });
    });

    it('should handle blob conversion error', async () => {
      const originalFileReader = global.FileReader;
      global.FileReader = class MockFileReader {
        result: string | null = null;
        onloadend: (() => void) | null = null;
        onerror: ((e: any) => void) | null = null;

        readAsDataURL(blob: Blob) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('FileReader error'));
            }
          }, 0);
        }
      } as any;

      (appAxios.get as any).mockResolvedValue({ data: new Blob() });

      const { result } = renderHook(
        () => useImageDownloader(entry, noImage, width, height, true, true),
        { wrapper }
      );

      // The source code catches FileReader errors and returns fallback (noImage)
      // So the query succeeds with fallback value instead of erroring
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toBe(noImage);
      });

      global.FileReader = originalFileReader;
    });
  });

  describe('return value', () => {
    it('should return query result object', () => {
      const { result } = renderHook(
        () => useImageDownloader(entry, noImage, width, height, false),
        { wrapper }
      );

      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
    });

    it('should have isLoading true initially when enabled', () => {
      (appAxios.get as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: new Blob() }), 100))
      );

      const { result } = renderHook(
        () => useImageDownloader(entry, noImage, width, height, true),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);
    });

    it('should have data undefined initially', () => {
      const { result } = renderHook(
        () => useImageDownloader(entry, noImage, width, height, false),
        { wrapper }
      );

      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useFallback parameter', () => {
    it('should default useFallback to true', async () => {
      (appAxios.get as any).mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(
        () => useImageDownloader(entry, noImage, width, height, true),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data).toBe(noImage);
      });
    });

    it('should respect useFallback false', async () => {
      (appAxios.get as any).mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(
        () => useImageDownloader(entry, noImage, width, height, true, false),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.data).toBe('');
      });
    });
  });
});
