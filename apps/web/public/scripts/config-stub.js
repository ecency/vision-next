/**
 * Defensive global CONFIG stub for Twitter/X in-app browser compatibility
 *
 * Twitter's widget scripts and in-app browser inject code that expects
 * a global window.CONFIG object to exist. This stub prevents
 * "ReferenceError: Can't find variable: CONFIG" errors.
 *
 * This is a separate file to avoid CSP violations from inline scripts.
 */
window.CONFIG = window.CONFIG || {};
