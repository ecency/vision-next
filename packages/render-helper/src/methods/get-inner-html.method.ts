import xmldom from 'xmldom'

export function getSerializedInnerHTML(node: Node): string {
  const XMLSerializer = new xmldom.XMLSerializer()

  if (node.childNodes[0]) {
    return XMLSerializer.serializeToString(node.childNodes[0])
  }

  return ''
}
