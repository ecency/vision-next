"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { Button } from "@/features/ui";
import { UilArrowLeft } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Link from "next/link";
import { useState } from "react";
import { PromotePostIntro, PromotePostSetup, PromoteSuccess } from "./_components";
import { usePromoteMutation } from "@/api/sdk-mutations";
import { usePreCheckPromote } from "@/api/mutations";
import { EcencyAnalytics } from "@ecency/sdk";
import { error } from "@/features/shared/feedback";
import { formatError } from "@/api/format-error";

export function PromotePost() {
  const { activeUser } = useActiveAccount();

  const [step, setStep] = useState<"intro" | "setup" | "success">("intro");
  const [path, setPath] = useState("");
  const [duration, setDuration] = useState(0);

  const { mutateAsync: promote, isPending: isPromotePending } = usePromoteMutation();
  const { mutateAsync: preCheck, isPending: isPreCheckPending } = usePreCheckPromote(() => {});
  const isPending = isPromotePending || isPreCheckPending;
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "perks-promote"
  );

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
          isPending={isPending}
          onSuccess={async (path, duration) => {
            setPath(path);
            setDuration(duration);
            try {
              await preCheck(path);
            } catch {
              // preCheck's own onError handler already shows the toast
              return;
            }
            try {
              const [author, permlink] = path.replace("@", "").split("/");
              await promote({ author, permlink, duration });
              recordActivity().catch(() => {});
              setStep("success");
            } catch (e) {
              error(...formatError(e));
            }
          }}
        />
      )}
      {step === "success" && <PromoteSuccess />}
    </div>
  );
}
