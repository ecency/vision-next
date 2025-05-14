import i18next from "i18next";

export function PublishOnboardingPosting() {
  return (
    <div className="pt-4 flex flex-col gap-2">
      <div className="font-bold">{i18next.t("publish.get-started.posting-description")}</div>
      {i18next.t("publish.get-started.posting-text")}
    </div>
  );
}
