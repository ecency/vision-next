import { Fragment } from "../types";

/**
 * Build the cache entry for an edited fragment.
 *
 * The `/private-api/fragments-update` endpoint returns only a minimal
 * acknowledgement, not the full fragment. Writing that response straight into
 * the query cache blanked out the edited snippet (the reported bug), so the
 * updated record is built from the values the user actually submitted, merged
 * over whatever fields the response does carry, on top of the existing cached
 * fragment (preserving id/created).
 */
export function applyFragmentUpdate(
  existing: Fragment,
  response: Partial<Fragment> | null | undefined,
  vars: { title: string; body: string }
): Fragment {
  return {
    ...existing,
    ...(response ?? {}),
    title: vars.title,
    body: vars.body
  };
}

/**
 * Build the cache entry for a newly added fragment. Reaffirms the submitted
 * title/body over the server acknowledgement so a fresh snippet never renders
 * blank if the response omits them, while keeping any server-provided
 * id/timestamps.
 */
export function buildAddedFragment(
  response: Fragment,
  vars: { title: string; body: string }
): Fragment {
  return {
    ...response,
    title: vars.title,
    body: vars.body
  };
}
