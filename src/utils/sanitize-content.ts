import DOMPurify from "dompurify";

/**
 * Sanitizes user-generated HTML content to prevent XSS attacks and security violations
 * 
 * This function addresses the root cause of "The operation is insecure" errors
 * by removing potentially dangerous elements and attributes that can cause
 * browser security violations.
 */
export function sanitizeContent(html: string): string {
  if (typeof window === "undefined") {
    // Server-side rendering - return original content or basic cleanup
    // DOMPurify requires a DOM environment, so we'll do basic cleanup
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove scripts
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "") // Remove iframes
      .replace(/javascript:/gi, "") // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, ""); // Remove event handlers
  }

  // Client-side sanitization with DOMPurify
  return DOMPurify.sanitize(html, {
    // Allowed tags - allowing most content formatting but blocking dangerous elements
    ALLOWED_TAGS: [
      'p', 'br', 'div', 'span', 'a', 'strong', 'b', 'em', 'i', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote',
      'img', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'center', 'hr', 'sub', 'sup', 'mark', 'del', 'ins', 'small', 'big'
    ],
    
    // Allowed attributes
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
      'class', 'id', 'style', 'align', 'border', 'cellpadding', 'cellspacing'
    ],
    
    // Block dangerous protocols
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    
    // Additional safety measures
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'frame', 'frameset', 'applet', 'form', 'input', 'button'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    
    // Sanitize DOM clobbering
    SANITIZE_DOM: true,
    
    // Keep relative URLs safe
    ALLOW_UNKNOWN_PROTOCOLS: false,
    
    // Return a clean string
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false
  });
}

/**
 * Enhanced sanitization specifically for post body content
 * Applies additional safety measures for blog post content
 */
export function sanitizePostBody(html: string): string {
  const sanitized = sanitizeContent(html);
  
  // Additional post-specific sanitization
  return sanitized
    // Remove any remaining cross-origin elements that might cause security errors
    .replace(/<iframe[^>]*>/gi, '') // Ensure iframes are completely removed
    .replace(/<embed[^>]*>/gi, '') // Remove embed elements
    .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove object elements
    // Clean up potentially problematic style attributes
    .replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '') // Remove CSS expressions
    .replace(/style\s*=\s*["'][^"']*javascript\s*:[^"']*["']/gi, ''); // Remove javascript in styles
}