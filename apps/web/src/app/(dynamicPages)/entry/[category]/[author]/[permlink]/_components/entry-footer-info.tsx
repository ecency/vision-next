import { AiUsageBadge, EcencySourceBadge, ProfileLink, TimeLabel } from "@/features/shared";
import i18next from "i18next";
import { Tsx } from "@/features/i18n/helper";
import { Entry } from "@/entities";
import { accountReputation, appName, parseDate } from "@/utils";
import React from "react";

interface Props {
  entry: Entry;
}

export function EntryFooterInfo({ entry }: Props) {
  const app = appName(entry.json_metadata?.app);
  const appShort = app.split("/")[0].split(" ")[0];
  const isEcency = app.toLowerCase().includes("ecency");
  const reputation = accountReputation(entry.author_reputation ?? 0);

  return (
    <div className="entry-info text-sm">
      <TimeLabel created={entry.created} />
      <span className="separator circle-separator" />
      <ProfileLink username={entry.author}>
        <div className="author notranslate">
          <span className="author-name">{entry.author}</span>
          <span className="author-reputation" title={i18next.t("entry.author-reputation")}>
            ({reputation})
          </span>
        </div>
      </ProfileLink>
      {app && (
        <>
          <span className="separator circle-separator" />
          <div className="app" title={app}>
            <Tsx k="entry.via-app" args={{ app: appShort }}>
              <a href="/faq#source-label" />
            </Tsx>
            <EcencySourceBadge
              app={entry.json_metadata?.app}
              className="inline-block align-text-bottom ml-1"
            />
          </div>
        </>
      )}
      {(entry.json_metadata?.ai_tools?.media_generation ||
        entry.json_metadata?.ai_tools?.writing_edit) && (
        <>
          <span className="separator circle-separator" />
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
