import { XMLSerializer } from '../consts'

export function getSerializedInnerHTML(node: Node): string {
  const serializer = new XMLSerializer()

  if (node.childNodes[0]) {
    return serializer.serializeToString(node.childNodes[0])
  }

  return ''
}
