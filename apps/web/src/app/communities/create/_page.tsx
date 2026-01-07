"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

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
import { delay, getAccessToken, parseAsset, random } from "@/utils";
import { EcencyAnalytics, getChainPropertiesQueryOptions, useAccountUpdate } from "@ecency/sdk";
import { cryptoUtils } from "@hiveio/dhive";
import { useQuery } from "@tanstack/react-query";
import { UilSpinner } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import numeral from "numeral";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const { activeUser } = useActiveAccount();
  const addUser = useGlobalStore((s) => s.addUser);

  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [communityType, setCommunityType] = useState(CommunityTypes.Topic);
  const [username, setUsername] = useState(generateUsername(communityType));
  const [wif, setWif] = useState(generateWif());
  const [progress, setProgress] = useState("");
  const [step, setStep] = useState(CommunityStepperSteps.INTRO);
  const [communityAccessToken, setCommunityAccessToken] = useState<string | undefined>(
    () => getAccessToken(username)
  );
  const [defaultBeneficiary, setDefaultBeneficiary] = useState<{
    username: string;
    reward: number;
  }>({ username: "", reward: 0 });

  const { data: fee } = useQuery({
    ...getChainPropertiesQueryOptions(),
    select: (data) => {
      const asset = parseAsset(data.account_creation_fee.toString());
      return `${numeral(asset.amount).format("0.000")} ${asset.symbol}`;
    }
  });
  const { mutateAsync: updateAccount } = useAccountUpdate(
    username,
    communityAccessToken
  );
  const { mutateAsync: hsTokenRenew } = useHsLoginRefresh();
  const { mutateAsync: updateCommunity } = useUpdateCommunity(username);
  const { mutateAsync: setUserRole } = useCommunitySetUserRole(username);
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    activeUser?.username,
    "community-created" as any
  );
  const updateAccountRef = useRef(updateAccount);
  const tokenWaiterRef = useRef<((token: string) => void) | null>(null);
  const communityAccessTokenRef = useRef(communityAccessToken);

  useEffect(() => {
    setUsername(generateUsername(communityType));
  }, [communityType]);

  useEffect(() => {
    setCommunityAccessToken(getAccessToken(username));
  }, [username]);

  useEffect(() => {
    updateAccountRef.current = updateAccount;
  }, [updateAccount]);

  useEffect(() => {
    communityAccessTokenRef.current = communityAccessToken;
    if (communityAccessTokenRef.current && tokenWaiterRef.current) {
      tokenWaiterRef.current(communityAccessTokenRef.current);
      tokenWaiterRef.current = null;
    }
  }, [communityAccessToken]);

  const waitForCommunityToken = useCallback(() => {
    if (communityAccessTokenRef.current) {
      return Promise.resolve(communityAccessTokenRef.current);
    }
    return new Promise<string>((resolve) => {
      tokenWaiterRef.current = resolve;
    });
  }, []);

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
        postingKey: null,
        loginType: "hivesigner"
      });
      setCommunityAccessToken(renewOpts.access_token);

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

      if (defaultBeneficiary.username && defaultBeneficiary.reward) {
        await waitForCommunityToken();
        await updateAccountRef.current({
          profile: {
            beneficiary: {
              account: defaultBeneficiary.username,
              weight: defaultBeneficiary.reward * 100
            }
          }
        });
      }

      // wait 3 seconds to hivemind synchronize community data
      await delay(3000);

      recordActivity();
      setStep(CommunityStepperSteps.DONE);
    },
    [
      activeUser,
      hsTokenRenew,
      addUser,
      setUserRole,
      username,
      updateCommunity,
      title,
      about,
      updateAccount,
      defaultBeneficiary,
      recordActivity,
      waitForCommunityToken
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
          fee={fee}
          wif={wif}
          defaultBeneficiary={defaultBeneficiary}
          setDefaultBeneficiary={setDefaultBeneficiary}
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
