import type { Entry } from "@/entities";

interface Props {
  entry: Entry;
  className?: string;
}

/**
 * The post body as escaped source text. Used for the ?raw view and as the
 * server-side fallback when the markdown renderer throws (see
 * EntryPageStaticBody). Keeps #post-body so the selection popover and the
 * body-viewer effect find the same element either way.
 */
export function EntryPageRawBody({ entry, className }: Props) {
  return (
    <pre
      id="post-body"
      className={`entry-body markdown-view user-selectable font-mono bg-gray-100 rounded text-sm !p-4 dark:bg-gray-900 whitespace-pre-wrap break-words${
        className ? ` ${className}` : ""
      }`}
    >
      {entry.body}
    </pre>
  );
}
