"use client";

import base58 from "bs58";

import { useCommunitySetUserRole, useHsLoginRefresh, useUpdateCommunity } from "@/api/mutations";
import {
  CommunityCreateAccountStep,
  CommunityCreateCardLayout,
  CommunityCreateDetailsStep,
  CommunityCreateDoneStep,
  CommunityCreateSignStep,
  CommunityCreateStepper,
  CommunityStepperSteps
} from "@/app/communities/create/_components";
import { useGlobalStore } from "@/core/global-store";
import { CommunityTypes } from "@/enums";
import { delay, parseAsset, random } from "@/utils";
import { EcencyAnalytics, getChainPropertiesQueryOptions } from "@ecency/sdk";
import { cryptoUtils } from "@hiveio/dhive";
import { useQuery } from "@tanstack/react-query";
import { UilSpinner } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import numeral from "numeral";
import { useCallback, useEffect, useState } from "react";

function generateUsername(type: CommunityTypes) {
  switch (type) {
    case CommunityTypes.Council:
      return `hive-${Math.floor(Math.random() * 100000) + 300000}`;
    case CommunityTypes.Journal:
      return `hive-${Math.floor(Math.random() * 100000) + 200000}`;
    case CommunityTypes.Topic:
    default:
      return `hive-${Math.floor(Math.random() * 100000) + 100000}`;
  }
}

function generateWif() {
  return "P" + base58.encode(cryptoUtils.sha256(random()));
}

export function CreateCommunityPage() {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const addUser = useGlobalStore((s) => s.addUser);

  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [communityType, setCommunityType] = useState(CommunityTypes.Topic);
  const [username, setUsername] = useState(generateUsername(communityType));
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
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "community-created" as any
  );

  useEffect(() => {
    setUsername(generateUsername(communityType));
  }, [communityType]);

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
      await delay(3000);

      recordActivity();
      setStep(CommunityStepperSteps.DONE);
    },
    [
      about,
      activeUser,
      addUser,
      hsTokenRenew,
      setUserRole,
      title,
      updateCommunity,
      username,
      recordActivity
    ]
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
          communityType={communityType}
          setCommunityType={setCommunityType}
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
      {step === CommunityStepperSteps.DONE && <CommunityCreateDoneStep username={username} />}
    </div>
  );
}
