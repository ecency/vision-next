"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { Button } from "@/features/ui";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Link from "next/link";
import { useCallback, useState } from "react";
import { PromotePostIntro, PromotePostSetup, PromoteSuccess } from "./_components";
import { KeyOrHot } from "@/features/shared";
import { usePreCheckPromote, usePromoteByApi, usePromoteByKeychain } from "@/api/mutations";
import { promoteHot } from "@/api/operations";
import { EcencyAnalytics } from "@ecency/sdk";

export function PromotePost() {
  const { activeUser } = useActiveAccount();

  const [step, setStep] = useState<"intro" | "setup" | "sign" | "success">("intro");
  const [path, setPath] = useState("");
  const [duration, setDuration] = useState(0);

  const { mutateAsync: promoteByKeychain, isPending: isKeychainPending } = usePromoteByKeychain();
  const { mutateAsync: promoteByApi, isPending: isApiPending } = usePromoteByApi();
  const { mutateAsync: next } = usePreCheckPromote(path, () => setStep("sign"));
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "perks-promote"
  );

  const hotSign = useCallback(() => {
    const [author, permlink] = path.replace("@", "").split("/");

    promoteHot(activeUser!.username, author, permlink, duration);
  }, [activeUser, duration, path]);

  return (
    <div className="p-2 md:p-4 lg:p-6 bg-white rounded-xl w-full flex flex-col gap-4">
      <div>
        <Link href="/perks">
          <Button
            size="sm"
            appearance="gray-link"
            icon={<UilArrowLeft />}
            iconPlacement="left"
            noPadding={true}
          >
            {i18next.t("g.back")}
          </Button>
        </Link>
        <h1 className="font-bold text-xl mt-2 md:mt-4 lg:mt-6">
          {i18next.t("perks.promote-title")}
        </h1>
        <h2 className="opacity-50 mb-4">{i18next.t("perks.promote-description")}</h2>
      </div>
      {step === "intro" && <PromotePostIntro onContinue={() => setStep("setup")} />}
      {step === "setup" && (
        <PromotePostSetup
          onSuccess={async (path, duration) => {
            setPath(path);
            setDuration(duration);
            await next();
          }}
        />
      )}
      {step === "sign" && (
        <div>
          <KeyOrHot
            inProgress={isKeychainPending || isApiPending}
            onKey={async (key) => {
              await promoteByApi({ path, duration, key });
              recordActivity();
              setStep("success");
            }}
            onHot={hotSign}
            onKc={async () => {
              await promoteByKeychain({ path, duration });
              recordActivity();
              setStep("success");
            }}
          />
        </div>
      )}
      {step === "success" && <PromoteSuccess />}
    </div>
  );
}
