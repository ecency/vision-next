import { AiUsageBadge, EcencySourceBadge } from "@/features/shared";
import { Tsx } from "@/features/i18n/helper";
import { Entry } from "@/entities";
import { appName } from "@/utils";
import React from "react";

interface Props {
  entry: Entry;
}

export function EntryFooterInfo({ entry }: Props) {
  const app = appName(entry.json_metadata?.app);
  const appShort = app.split("/")[0].split(" ")[0];
  const isEcency = app.toLowerCase().includes("ecency");

  return (
    // Time, author and reputation are NOT repeated here: the masthead at the top
    // of the same surface already carries all three. What is left is what only
    // the colophon says, the app the post was published from and how it was made.
    <div className="entry-info text-sm">
      {app && (
        <div className="app" title={app}>
          <Tsx k="entry.via-app" args={{ app: appShort }}>
            <a href="/faq#source-label" />
          </Tsx>
          <EcencySourceBadge
            app={entry.json_metadata?.app}
            className="inline-block align-text-bottom ml-1"
          />
        </div>
      )}
      {(entry.json_metadata?.ai_tools?.media_generation ||
        entry.json_metadata?.ai_tools?.writing_edit) && (
        <>
          {app && <span className="separator circle-separator" />}
          <AiUsageBadge
            aiTools={entry.json_metadata?.ai_tools}
            className="align-text-bottom"
          />
        </>
      )}
        {app && !isEcency && (
            <div className="post-disclaimer-print">
                <Tsx k="entry.disclaimer" args={{ appName: appShort }}>
                    <a href="/faq#source-label" />
                </Tsx>
            </div>
        )}
    </div>
  );
}
