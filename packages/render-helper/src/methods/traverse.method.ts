import { a } from './a.method'
import { iframe } from './iframe.method'
import { img } from './img.method'
import { p } from './p.method'
import { text } from './text.method'

export function traverse(node: Node, forApp: boolean, depth = 0, webp = false, state = { firstImageFound: false }, parentDomain: string = 'ecency.com'): void {
  if (!node || !node.childNodes) {
    return
  }

  Array.from(Array(node.childNodes.length).keys()).forEach(i => {
    const child = node.childNodes[i];
    if (!child) return; // Child might have been removed

    if (child.nodeName.toLowerCase() === 'a') {
      a(<HTMLElement>child, forApp, webp, parentDomain)
    }
    if (child.nodeName.toLowerCase() === 'iframe') {
      iframe(<HTMLElement>child, parentDomain)
    }
    if (child.nodeName === '#text') {
      text(<HTMLElement>child, forApp, webp)
    }
    if (child.nodeName.toLowerCase() === 'img') {
      img(<HTMLElement>child, webp, state)
    }
    if (child.nodeName.toLowerCase() === 'p') {
      p(<HTMLElement>child)
    }

    // Recapture child reference in case handler replaced it
    const currentChild = node.childNodes[i];
    if (currentChild) {
      traverse(currentChild, forApp, depth + 1, webp, state, parentDomain)
    }
  })
}
