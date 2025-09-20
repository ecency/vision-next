import i18next from "i18next";

export function SetupExternalHeader() {
  return (
    <div className="grid grid-cols-12 my-4 md:mb-10 items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 p-2 sm:p-0 md:mt-16">
      <div className="col-span-12 md:col-span-6">
        <h1 className="text-blue-dark-sky text-xl md:text-3xl font-bold md:leading-[3rem]">
          {i18next.t("profile-wallet.external-wallets-offer.title")}
        </h1>
        <h2 className="text-lg md:text-2xl">
          {i18next.t("profile-wallet.external-wallets-offer.description")}
        </h2>
      </div>
      <div className="col-span-12 md:col-span-6">
        <p className="text-sm md:text-right md:ml-auto md:max-w-[320px]">
          {i18next.t("profile-wallet.external-wallets-offer.hint")}
        </p>
      </div>
    </div>
  );
}
