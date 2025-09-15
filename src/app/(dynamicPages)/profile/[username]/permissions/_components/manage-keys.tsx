import i18next from "i18next";
import { ManageKey } from "./manage-key";

export function ManageKeys() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4 rounded-xl p-4 bg-white bg-opacity-75 pb-4">
      <div className="md:col-span-2 text-sm md:text-lg font-bold">
        {i18next.t("permissions.keys.title")}
      </div>

      <ManageKey keyName="owner" />
      <ManageKey keyName="active" />
      <ManageKey keyName="posting" />
      <ManageKey keyName="memo" />
    </div>
  );
}
