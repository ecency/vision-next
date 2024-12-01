import i18next from "i18next";
import { Button } from "@ui/button";

export function WavePromoteCard() {
  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden text-white"
      style={{
        backgroundImage: `url(/assets/promote-wave-bg.jpg)`
      }}
    >
      <div className="relative flex flex-col gap-4">
        <div className="font-semibold text-lg">{i18next.t("waves.promote.title")}</div>
        <div className="text-sm mb-8">{i18next.t("waves.promote.subtitle")}</div>
        <Button className="text-sm font-semibold" size="lg" appearance="white">
          {i18next.t("waves.promote.button")}
        </Button>
      </div>
    </div>
  );
}
