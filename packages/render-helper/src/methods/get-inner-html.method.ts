import { XMLSerializer } from '../consts'

export function getSerializedInnerHTML(node: Node): string {
  const serializer = new XMLSerializer()

  if (node.childNodes[0]) {
    // xmldom's ChildNode isn't structurally assignable to its Node param type; it is a Node.
    return serializer.serializeToString(node.childNodes[0] as any)
  }

  return ''
}
