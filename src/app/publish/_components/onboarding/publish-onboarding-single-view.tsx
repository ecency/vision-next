import i18next from "i18next";

export function PublishOnboardingSingleView() {
  return (
    <div className="pt-4 flex flex-col gap-2">
      <div className="font-bold">{i18next.t("publish.get-started.single-view-description")}</div>
      {i18next.t("publish.get-started.single-view-text")}
    </div>
  );
}
