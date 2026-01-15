"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { hsTokenRenew } from "@ecency/sdk";
import { setUserRole, updateCommunity } from "@/api/operations";
import { useGlobalStore } from "@/core/global-store";
import { User } from "@/entities";
import { delay } from "@/utils";
import { EcencyAnalytics } from "@ecency/sdk";
import { UilSpinner } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Head from "next/head";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import useMount from "react-use/lib/useMount";
import {
  CommunityCreateCardLayout,
  CommunityCreateDoneStep,
  CommunityCreateStepper,
  CommunityStepperSteps
} from "../create/_components";

export function CommunityCreateHsPage() {
  const router = useRouter();
  const params = useSearchParams();

  const { activeUser } = useActiveAccount();
  const addUser = useGlobalStore((s) => s.addUser);

  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "community-created" as any
  );

  const [username, setUsername] = useState("");
  const [step, setStep] = useState(CommunityStepperSteps.CREATING);

  const [progress, setProgress] = useState("");

  const handle = useCallback(async () => {
    const code = params?.get("code");
    const title = params?.get("title") ?? "";
    const about = params?.get("about") ?? "";

    if (!code || !activeUser) {
      router.push("/");
      return;
    }

    setProgress(i18next.t("communities-create.progress-user"));

    // get access token from code and create user object
    const response = await hsTokenRenew(code);
    const user = {
      username: response.username,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expires_in,
      postingKey: null,
      loginType: "hivesigner"
    } satisfies User;

    // add community user to reducer
    addUser(user);
    setUsername(user.username);

    // set admin role
    setProgress(i18next.t("communities-create.progress-role", { u: activeUser.username }));
    await setUserRole(user.username, user.username, activeUser.username, "admin");

    // update community props
    setProgress(i18next.t("communities-create.progress-props"));
    await updateCommunity(user.username, user.username, {
      title,
      about,
      lang: "en",
      description: "",
      flag_text: "",
      is_nsfw: false
    });

    // wait 3 seconds to hivemind synchronize community data
    await delay(3000);
    setStep(CommunityStepperSteps.DONE);
    recordActivity();
  }, [activeUser, addUser, params, recordActivity, router]);

  useMount(handle);

  return (
    <>
      <Head>
        <title>{i18next.t("communities-create.page-title")}</title>
        <meta name="description" content={i18next.t("communities-create.description")} />
      </Head>

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 lg:gap-10 xl:gap-12 items-start">
        <CommunityCreateStepper step={step} />
        {step === CommunityStepperSteps.CREATING && (
          <CommunityCreateCardLayout hideTitle={true}>
            <div className="md:py-16 flex flex-col items-center gap-4">
              <UilSpinner className="animate-spin w-12 h-12 text-blue-dark-sky" />
              <div className="text-xl text-blue-dark-sky">{progress}</div>
            </div>
          </CommunityCreateCardLayout>
        )}

        {step === CommunityStepperSteps.DONE && <CommunityCreateDoneStep username={username} />}
      </div>
    </>
  );
}
