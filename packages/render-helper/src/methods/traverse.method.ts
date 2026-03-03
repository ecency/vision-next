import { a } from './a.method'
import { iframe } from './iframe.method'
import { img } from './img.method'
import { p } from './p.method'
import { text } from './text.method'
import { SeoContext } from '../types'

export function traverse(node: Node, forApp: boolean, depth = 0, state = { firstImageFound: false }, parentDomain: string = 'ecency.com', seoContext?: SeoContext): void {
  if (!node || !node.childNodes) {
    return
  }

  // Snapshot childNodes into a static array before iterating.
  // node.childNodes is a live NodeList: when a handler removes or replaces a
  // child the indices shift, causing subsequent iterations to skip nodes or
  // visit the wrong ones — ultimately leaving orphaned elements whose
  // parentNode is null and crashing any code that later reads it.
  const children = Array.from(node.childNodes);

  children.forEach(child => {
    if (!child) return;

    if (child.nodeName.toLowerCase() === 'a') {
      a(<HTMLElement>child, forApp, parentDomain, seoContext)
    }
    if (child.nodeName.toLowerCase() === 'iframe') {
      iframe(<HTMLElement>child, parentDomain)
    }
    if (child.nodeName === '#text') {
      text(<HTMLElement>child, forApp)
    }
    if (child.nodeName.toLowerCase() === 'img') {
      img(<HTMLElement>child, state)
    }
    if (child.nodeName.toLowerCase() === 'p') {
      p(<HTMLElement>child)
    }

    // Only recurse if the child is still attached to the DOM.
    // A handler (e.g. text(), iframe()) may have removed or replaced the node,
    // setting its parentNode to null.  Recursing into a detached node can cause
    // descendant handlers to crash when they access el.parentNode.
    if (child.parentNode) {
      traverse(child, forApp, depth + 1, state, parentDomain, seoContext)
    }
  })
}
