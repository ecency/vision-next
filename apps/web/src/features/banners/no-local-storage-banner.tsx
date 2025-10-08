import { BannerLayout } from "@/features/banners/banner-layout";
import i18next from "i18next";
import { useState } from "react";
import { Button } from "@ui/button";
import { UilMultiply } from "@tooni/iconscout-unicons-react";

export function NoLocalStorageBanner() {
  const [show, setShow] = useState(true);

  return show ? (
    <BannerLayout>
      <div className="flex justify-between">
        <div className="font-bold">{i18next.t("banners.no-ls-title")}</div>
        <Button
          onClick={() => setShow(false)}
          appearance="white-link"
          icon={<UilMultiply className="w-4 h-4" />}
        />
      </div>
      <div className="text-sm opacity-75">{i18next.t("banners.no-ls-description")}</div>
    </BannerLayout>
  ) : (
    <></>
  );
}
