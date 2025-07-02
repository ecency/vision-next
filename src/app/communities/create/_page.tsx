"use client";

import base58 from "bs58";

import { useCommunitySetUserRole, useHsLoginRefresh, useUpdateCommunity } from "@/api/mutations";
import {
  CommunityCreateAccountStep,
  CommunityCreateCardLayout,
  CommunityCreateDetailsStep,
  CommunityCreateSignStep,
  CommunityCreateStepper,
  CommunityStepperSteps
} from "@/app/communities/create/_components";
import { useGlobalStore } from "@/core/global-store";
import { parseAsset, random } from "@/utils";
import { getChainPropertiesQueryOptions } from "@ecency/sdk";
import { cryptoUtils } from "@hiveio/dhive";
import { useQuery } from "@tanstack/react-query";
import { UilCheckCircle, UilSpinner } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import numeral from "numeral";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/features/ui";

function generateUsername() {
  return `hive-${Math.floor(Math.random() * 100000) + 100000}`;
}

function generateWif() {
  return "P" + base58.encode(cryptoUtils.sha256(random()));
}

export function CreateCommunityPage() {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const addUser = useGlobalStore((s) => s.addUser);

  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [username, setUsername] = useState(generateUsername());
  const [wif, setWif] = useState(generateWif());
  const [progress, setProgress] = useState("");
  const [step, setStep] = useState(CommunityStepperSteps.INTRO);

  const { data: fee } = useQuery({
    ...getChainPropertiesQueryOptions(),
    select: (data) => {
      const asset = parseAsset(data.account_creation_fee.toString());
      return `${numeral(asset.amount).format("0.000")} ${asset.symbol}`;
    }
  });
  const { mutateAsync: hsTokenRenew } = useHsLoginRefresh();
  const { mutateAsync: updateCommunity } = useUpdateCommunity(username);
  const { mutateAsync: setUserRole } = useCommunitySetUserRole(username);

  const prepareCreatedCommunity = useCallback(
    async (code: string) => {
      if (!activeUser) {
        throw new Error("[Community][Create][FinalSubmit] Active user isn't provided");
      }

      setStep(CommunityStepperSteps.CREATING);

      // get access token from code and create user object
      const renewOpts = await hsTokenRenew({ code });
      addUser({
        username: renewOpts.username,
        accessToken: renewOpts.access_token,
        refreshToken: renewOpts.refresh_token,
        expiresIn: renewOpts.expires_in,
        postingKey: null
      });

      // set admin role
      setProgress(i18next.t("communities-create.progress-role", { u: activeUser.username }));
      await setUserRole({
        user: username,
        role: "admin"
      });

      // update community props
      setProgress(i18next.t("communities-create.progress-props"));

      await updateCommunity({
        username,
        payload: {
          title,
          about,
          lang: "en",
          description: "",
          flag_text: "",
          is_nsfw: false
        }
      });

      // wait 3 seconds to hivemind synchronize community data
      await new Promise((r) => {
        setTimeout(() => {
          r(true);
        }, 3000);
      });

      setStep(CommunityStepperSteps.DONE);
    },
    [about, activeUser, addUser, hsTokenRenew, setUserRole, title, updateCommunity, username]
  );

  return (
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 lg:gap-10 xl:gap-12 items-start">
      <CommunityCreateStepper step={step} />
      {step === CommunityStepperSteps.INTRO && (
        <CommunityCreateDetailsStep
          title={title}
          setTitle={setTitle}
          about={about}
          setAbout={setAbout}
          onContinue={() => setStep(CommunityStepperSteps.CREATE_ACCOUNT)}
        />
      )}
      {step === CommunityStepperSteps.CREATE_ACCOUNT && (
        <CommunityCreateAccountStep
          username={username}
          setUsername={setUsername}
          title={title}
          fee={fee}
          wif={wif}
          onSubmit={() => setStep(CommunityStepperSteps.SIGN)}
        />
      )}
      {step === CommunityStepperSteps.SIGN && (
        <CommunityCreateSignStep
          username={username}
          wif={wif}
          fee={fee}
          title={title}
          about={about}
          onSubmit={prepareCreatedCommunity}
        />
      )}
      {step === CommunityStepperSteps.CREATING && (
        <CommunityCreateCardLayout hideTitle={true}>
          <div className="md:py-16 flex flex-col items-center gap-4">
            <UilSpinner className="animate-spin w-12 h-12 text-blue-dark-sky" />
            <div className="text-xl text-blue-dark-sky">{progress}</div>
          </div>
        </CommunityCreateCardLayout>
      )}
      {step === CommunityStepperSteps.DONE && (
        <CommunityCreateCardLayout hideTitle={true}>
          <div className="md:py-16 flex flex-col gap-4 md:gap-8">
            <div className="flex flex-col items-center justify-center gap-2">
              <UilCheckCircle className="text-green w-12 h-12" />
              <div className="text-xl font-bold">{i18next.t("communities-create.done")}</div>
              <div className="text-gray-600 dark:text-gray-400 text-center max-w-[500px]">
                {i18next.t("communities-create.done-hint")}
              </div>
            </div>

            <div className="flex justify-center items-center gap-4">
              <Link href="/communities">
                <Button appearance="gray" size="sm">
                  {i18next.t("communities-create.back-to-communities")}
                </Button>
              </Link>
              <Link href={`/created/${username}`}>
                <Button size="sm">{i18next.t("communities-create.open-community")}</Button>
              </Link>
            </div>
          </div>
        </CommunityCreateCardLayout>
      )}
    </div>
  );
}
