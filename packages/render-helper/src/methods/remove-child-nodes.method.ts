export function removeChildNodes(node: Node): void {
  // Remove children using stable snapshot to avoid live collection issues
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}
