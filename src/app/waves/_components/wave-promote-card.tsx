import i18next from "i18next";

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
        {/*<LoginRequired>*/}
        {/*  <Button disabled={true} className="text-sm font-semibold" size="lg" appearance="white">*/}
        <div className="flex items-center justify-center text-sm font-semibold">
          {i18next.t("waves.promote.coming-soon")}
        </div>
        {/*</Button>*/}
        {/*</LoginRequired>*/}
      </div>
    </div>
  );
}
