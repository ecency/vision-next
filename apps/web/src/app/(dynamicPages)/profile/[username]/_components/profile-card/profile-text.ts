/**
 * A profile field as a React-renderable string, or undefined when the stored
 * value is not a string at all.
 *
 * `AccountProfile` declares `about`, `location`, `name` and `website` as
 * strings, but the SDK builds the object by `JSON.parse`-ing the account's
 * `posting_json_metadata` and casting (`parsed.profile as AccountProfile`).
 * A profile published as `{"profile":{"about":{"x":1}}}` therefore arrives with
 * an object in a field typed `string`, and rendering an object as a React child
 * throws "Objects are not valid as a React child" - during SSR, from the
 * profile layout, i.e. for the whole document.
 *
 * Deliberately does NOT normalise strings: an empty string stays an empty
 * string so every `value && ...` and `value ?? fallback` at the call sites keeps
 * behaving exactly as it does today. The only values this changes are the ones
 * that currently throw.
 */
export function profileText(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
