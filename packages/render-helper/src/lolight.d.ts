// lolight ships no type declarations. It's dynamically imported (Node-only) for syntax
// highlighting; we only use `tok(code)`, which returns [type, text] token pairs. Declaring
// that narrow shape keeps the highlight path typechecked instead of collapsing to `any`.
declare module 'lolight' {
  /** A `[type, text]` token pair. */
  export type LolightToken = string[]
  /** Tokenize source code into [type, text] pairs. */
  export function tok(code: string): LolightToken[]
  const lolight: { tok: typeof tok }
  export default lolight
}
