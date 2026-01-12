export function p(el: HTMLElement): void {
  const dir = el.getAttribute('dir')
  if (!dir) {
    el.setAttribute('dir', 'auto')
  }
}
