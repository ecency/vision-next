// Browser shim for @xmldom/xmldom
// Uses native DOMParser/XMLSerializer but wraps them to match xmldom's API behavior

class BrowserDOMParser {
  // Accept and ignore xmldom-specific options like onError
  constructor(_options?: unknown) {}

  parseFromString(source: string, mimeType: string): Document {
    const parser = new globalThis.DOMParser();
    return parser.parseFromString(source, mimeType as DOMParserSupportedType);
  }
}

class BrowserXMLSerializer {
  serializeToString(node: Node): string {
    // xmldom serializes just the node, but native XMLSerializer on a full Document
    // includes the doctype and html/head wrappers. Match xmldom behavior by
    // serializing just the target node (typically a <body> element).
    if (node.nodeType === Node.DOCUMENT_NODE) {
      const body = (node as Document).body || (node as Document).documentElement;
      return new globalThis.XMLSerializer().serializeToString(body);
    }
    return new globalThis.XMLSerializer().serializeToString(node);
  }
}

export { BrowserDOMParser as DOMParser, BrowserXMLSerializer as XMLSerializer };
