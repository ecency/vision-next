import '@testing-library/jest-dom/vitest';

// Mock canvas for WebP detection tests
HTMLCanvasElement.prototype.toDataURL = function (type?: string) {
  if (type === 'image/webp') {
    return 'data:image/webp;base64,';
  }
  return 'data:image/png;base64,';
};
