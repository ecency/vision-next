/**
 * Global HTML position manager to prevent race conditions when multiple components
 * need to set the HTML element's position to 'relative'
 */
class HtmlPositionManager {
  private refCount = 0;
  private isClient = typeof window !== 'undefined';

  /**
   * Increment the reference count and set HTML position to 'relative' if this is the first reference
   */
  addReference(): void {
    if (!this.isClient) return;
    
    this.refCount++;
    
    // Only set position to 'relative' when going from 0 to 1 references
    if (this.refCount === 1) {
      const htmlElement = document.getElementsByTagName("html")[0];
      if (htmlElement) {
        htmlElement.style.position = "relative";
      }
    }
  }

  /**
   * Decrement the reference count and reset HTML position to 'unset' if this was the last reference
   */
  removeReference(): void {
    if (!this.isClient) return;
    
    this.refCount = Math.max(0, this.refCount - 1);
    
    // Only reset position to 'unset' when going from 1 to 0 references
    if (this.refCount === 0) {
      const htmlElement = document.getElementsByTagName("html")[0];
      if (htmlElement) {
        htmlElement.style.position = "unset";
      }
    }
  }

  /**
   * Get current reference count (for debugging purposes)
   */
  getRefCount(): number {
    return this.refCount;
  }
}

// Create a singleton instance
export const htmlPositionManager = new HtmlPositionManager();