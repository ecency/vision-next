import { useCallback, useState } from "react";
import { UilTimes } from "@tooni/iconscout-unicons-react";

const MAX_TAG_LENGTH = 24;
const MAX_TAGS = 10;

const specialCharMap: Record<string, string> = {
  æ: "ae",
  œ: "oe",
  ß: "ss",
  ø: "o",
  đ: "d",
  ł: "l",
  ð: "d",
  þ: "th",
};

const specialCharRegex = new RegExp(
  `[${Object.keys(specialCharMap).join("")}]`,
  "g"
);

function sanitizeTagInput(input: string): string {
  const normalized = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const lowerCased = normalized.toLowerCase();
  const transliterated = lowerCased.replace(
    specialCharRegex,
    (char) => specialCharMap[char] ?? ""
  );
  return transliterated
    .replace(/[,#]/g, " ")
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, " ")
    .trimStart();
}

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function PublishTagsSelector({ tags, onChange }: Props) {
  const [value, setValue] = useState("");
  const [warning, setWarning] = useState("");

  const validateTag = useCallback((tag: string): boolean => {
    if (tag.length > MAX_TAG_LENGTH) {
      setWarning(`Tag must be ${MAX_TAG_LENGTH} characters or less`);
      return false;
    }
    if (tag.split("-").length > 3) {
      setWarning("Tag can have at most 2 hyphens");
      return false;
    }
    if (!/^[a-z0-9-#]+$/.test(tag)) {
      setWarning("Use only lowercase letters, numbers, and hyphens");
      return false;
    }
    if (!/^[a-z-#]/.test(tag)) {
      setWarning("Tag must start with a letter or hyphen");
      return false;
    }
    if (!/[a-z0-9]$/.test(tag)) {
      setWarning("Tag must end with a letter or number");
      return false;
    }
    setWarning("");
    return true;
  }, []);

  const addTag = useCallback(
    (raw: string): boolean => {
      const tag = sanitizeTagInput(raw).slice(0, MAX_TAG_LENGTH).trim();
      if (!tag) return false;
      if (tags.includes(tag)) return false;
      if (tags.length >= MAX_TAGS) {
        setWarning(`Maximum ${MAX_TAGS} tags`);
        return false;
      }
      if (!validateTag(tag)) return false;
      onChange([...tags, tag]);
      setValue("");
      return true;
    },
    [tags, onChange, validateTag]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag));
      setWarning("");
    },
    [tags, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !value && tags.length > 0) {
        e.preventDefault();
        removeTag(tags[tags.length - 1]);
        return;
      }
      if (e.key === "Enter" || e.key === "," || e.key === " ") {
        e.preventDefault();
        addTag(value);
      }
    },
    [value, addTag, tags, removeTag]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = sanitizeTagInput(e.target.value);
      setValue(sanitized);
      if (warning) setWarning("");
    },
    [warning]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = sanitizeTagInput(e.clipboardData.getData("text"));
      const parts = pasted.trim().split(/\s+/);
      let next = [...tags];
      for (const part of parts) {
        if (next.length >= MAX_TAGS) break;
        const tag = part.slice(0, MAX_TAG_LENGTH).trim();
        if (tag && !next.includes(tag) && validateTag(tag)) next.push(tag);
      }
      onChange(next.slice(0, MAX_TAGS));
      setValue("");
      setWarning("");
    },
    [tags, onChange, validateTag]
  );

  return (
    <div className="flex flex-col gap-2 border-t border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-2 p-2 pt-3 min-h-[44px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-theme-tertiary text-sm"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="p-0.5 rounded hover:bg-theme-secondary"
              aria-label={`Remove ${tag}`}
            >
              <UilTimes className="w-4 h-4" />
            </button>
          </span>
        ))}
        {tags.length < MAX_TAGS && (
          <input
            tabIndex={0}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Tag"
            className="flex-1 min-w-[120px] px-2 py-1 bg-transparent outline-none text-sm"
            maxLength={MAX_TAG_LENGTH}
            autoComplete="off"
          />
        )}
      </div>
      {warning && (
        <span className="text-xs text-red-600 dark:text-red-400 px-2">
          {warning}
        </span>
      )}
    </div>
  );
}
