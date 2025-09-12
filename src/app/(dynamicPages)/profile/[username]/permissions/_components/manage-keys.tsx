import { ManageKey } from "./manage-key";

export function ManageKeys() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl bg-white bg-opacity-75">
      <div className="md:col-span-2 p-4 text-sm md:text-lg font-bold">Keys</div>
      <ManageKey keyName="owner" />
      <ManageKey keyName="active" />
      <ManageKey keyName="posting" />
      <ManageKey keyName="memo" />
    </div>
  );
}
