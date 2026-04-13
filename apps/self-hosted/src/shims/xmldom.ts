// Browser shim for @xmldom/xmldom
// In the browser we use the native DOMParser and XMLSerializer
// instead of the Node.js xmldom polyfill
export const DOMParser = globalThis.DOMParser;
export const XMLSerializer = globalThis.XMLSerializer;
