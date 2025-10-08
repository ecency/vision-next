import i18next from "i18next";

export function EntryListContentLoading() {
  return (
    <div className="flex items-center justify-center p-4">
      {i18next.t("decks.columns.infinite-loading")}
    </div>
  );
}
