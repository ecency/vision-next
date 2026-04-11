export function getPurePostText(text: string) {
  // Remove code blocks (```...``` and `...`)
  text = text.replace(/```[\s\S]*?```|`[^`]*`/g, "");

  // Remove images (![alt](url))
  text = text.replace(/!\[.*?\]\(.*?\)/g, "");

  // Remove links ([text](url)), keep link text
  text = text.replace(/\[([^\]]*)\]\(.*?\)/g, "$1");

  // Remove headers (#), lists (-, *, 1.), blockquotes (>), tables
  text = text.replace(/^[#*-]|\d+\.\s|^>\s/gm, "").replace(/\|.*?\|/g, "");

  // Remove inline Markdown formatting (**bold**, *italic*, _italic_)
  text = text.replace(/(\*\*|__|\*|_)(.*?)\1/g, "$2");

  // Remove HTML tags, including attributes (e.g., <div class="abc">)
  text = text.replace(/<[^>]+>/g, "");

  // Remove comments
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // Remove URLs (http:// or https://)
  text = text.replace(/https?:\/\/[^\s/$.?#].[^\s]*/g, "");

  return text;
}

/**
 * Version for word counting that tokenizes CJK characters as individual words.
 */
export function getPurePostTextForWordCount(text: string) {
  text = getPurePostText(text);
  // Treat each CJK character as a separate word for counting
  text = text.replace(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g, " $& ");
  return text;
}
