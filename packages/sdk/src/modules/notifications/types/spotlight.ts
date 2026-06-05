// Wire shape of /private-api/spotlights. Keep in sync with the source of truth in
// vision-api (src/server/handlers/spotlights.ts).
export interface Spotlight {
  id: string;
  feature: string;
  title: string;
  description: string;
  icon?: string;
  button_text: string;
  button_link: string;
  path?: string | Array<string>;
  auth?: boolean;
  start?: string;
  end?: string;
  weight?: number;
  locales?: {
    [lang: string]: Pick<Spotlight, "title" | "description" | "button_text">;
  };
}
