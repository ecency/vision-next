import { AiToolsMeta } from "@/entities";
import { StyledTooltip } from "@/features/ui";
import { UilRobot } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import i18next from "i18next";
import React from "react";

interface Props {
  /** The post's `json_metadata.ai_tools` (interoperable AI-usage disclosure). */
  aiTools: AiToolsMeta | null | undefined;
  /** Rendered icon size in px (square). Defaults to 14. */
  size?: number;
  className?: string;
}

/**
 * Small robot badge shown next to content whose author disclosed AI usage via the
 * interoperable `ai_tools` json_metadata. The tooltip lists what was disclosed.
 * Renders nothing when no AI usage is disclosed.
 */
export function AiUsageBadge({ aiTools, size = 14, className }: Props) {
  if (!aiTools) {
    return null;
  }

  const parts: string[] = [];
  if (aiTools.media_generation) parts.push(i18next.t("ai-usage.media-generation"));
  if (aiTools.writing_edit) parts.push(i18next.t("ai-usage.writing-edit"));

  if (parts.length === 0) {
    return null;
  }

  const label = `${i18next.t("ai-usage.badge-label")}: ${parts.join(", ")}`;

  return (
    <StyledTooltip content={label}>
      <span
        className={clsx(
          "ai-usage-badge inline-flex items-center text-gray-600 dark:text-gray-400",
          className
        )}
        role="img"
        aria-label={label}
      >
        <UilRobot width={size} height={size} />
      </span>
    </StyledTooltip>
  );
}
