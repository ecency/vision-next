"use client";

import { useEffect } from 'react';

/**
 * Global chunk loading error handler component
 * Handles chunk loading errors that occur outside of React error boundaries
 */
export function ChunkLoadErrorHandler() {
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const handleChunkError = (event: Event) => {
      const target = event.target as HTMLScriptElement | HTMLLinkElement;
      
      // Check if this is a chunk loading error
      if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        const src = target.tagName === 'SCRIPT' ? (target as HTMLScriptElement).src : (target as HTMLLinkElement).href;
        
        // Check if it's a Next.js chunk
        if (src && (src.includes('/_next/static/chunks/') || src.includes('/_next/static/css/'))) {
          console.warn('Chunk loading failed:', src);
          
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying chunk load (${retryCount}/${maxRetries}):`, src);
            
            // Retry with exponential backoff
            setTimeout(() => {
              const newElement = target.cloneNode(true) as HTMLScriptElement | HTMLLinkElement;
              
              // Add cache-busting parameter
              const url = new URL(src);
              url.searchParams.set('retry', retryCount.toString());
              url.searchParams.set('t', Date.now().toString());
              
              if (newElement.tagName === 'SCRIPT') {
                (newElement as HTMLScriptElement).src = url.toString();
              } else {
                (newElement as HTMLLinkElement).href = url.toString();
              }
              
              // Replace the failed element
              target.parentNode?.replaceChild(newElement, target);
            }, Math.pow(2, retryCount - 1) * 1000);
          } else {
            console.error('Max retries exceeded for chunk:', src);
            
            // Show user-friendly error and offer page reload
            const shouldReload = confirm(
              'There was an issue loading the application. Would you like to reload the page?'
            );
            
            if (shouldReload) {
              // Clear caches and reload
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                  window.location.reload();
                });
              } else {
                window.location.reload();
              }
            }
          }
        }
      }
    };

    // Listen for script/link loading errors
    document.addEventListener('error', handleChunkError, true);

    // Handle unhandled promise rejections (for dynamic imports)
    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      if (error && (
        error.name === 'ChunkLoadError' ||
        (typeof error.message === 'string' && error.message.includes('Loading chunk'))
      )) {
        console.warn('Chunk loading promise rejection:', error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Attempting page reload due to chunk error (${retryCount}/${maxRetries})`);
          
          // For dynamic import failures, we need to reload the page
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
        
        // Prevent the error from being logged as unhandled
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handlePromiseRejection);

    // Cleanup
    return () => {
      document.removeEventListener('error', handleChunkError, true);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);

  return null;
}