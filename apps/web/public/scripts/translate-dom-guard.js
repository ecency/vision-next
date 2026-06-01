/**
 * Browser-translation DOM-mutation guard.
 *
 * Google Translate / Chrome "Translate this page" (and similar in-page
 * translators) rewrite text nodes and wrap them in <font> elements, moving
 * nodes out from under React. React's next commit then calls insertBefore or
 * removeChild against a node whose parent has changed underneath it, throwing
 *
 *   NotFoundError: Failed to execute 'removeChild'/'insertBefore' on 'Node':
 *   The node ... is not a child of this node.
 *
 * That throw happens in React's commit phase, so it escapes render-time error
 * boundaries and crashes the whole route (full-page 500). It is unfixable at
 * the source because the mutation comes from the browser, not our code. See
 * facebook/react#11538.
 *
 * This makes those two DOM operations defensive: when the node isn't actually a
 * child of the expected parent, no-op instead of throwing. React reconciles
 * correctly on its next render, so the page keeps working and translation stays
 * enabled. Must load BEFORE React so the patch is in place before hydration.
 */
(function () {
  if (typeof Node !== "function" || !Node.prototype) {
    return;
  }

  function warn(message, node, parent) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[translate-dom-guard] " + message, node, parent);
    }
  }

  var originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      warn("removeChild: node is not a child of the expected parent; skipping", child, this);
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  var originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      warn(
        "insertBefore: reference node is not a child of the expected parent; skipping",
        referenceNode,
        this
      );
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
})();
