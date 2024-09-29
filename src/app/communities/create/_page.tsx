"use client";

import base58 from "bs58";

import { cryptoUtils } from "@hiveio/dhive";
import { Button } from "@ui/button";
import { Form } from "@ui/form";
import { LoginRequired } from "@/features/shared";
import i18next from "i18next";
import Link from "next/link";
import { useGlobalStore } from "@/core/global-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { random } from "@/utils";
import {
  CommunityCreateDetailsForm,
  CommunityCreateDone,
  CommunityCreateImage,
  CommunityCreateSignDialog,
  CommunityCreateWifForm
} from "@/app/communities/create/_components";
import { getChainPropertiesQuery } from "@/api/queries";
import { useCommunitySetUserRole, useHsLoginRefresh, useUpdateCommunity } from "@/api/mutations";

export function CreateCommunityPage() {
  const formRef = useRef<HTMLFormElement>(null);

  const activeUser = useGlobalStore((s) => s.activeUser);
  const addUser = useGlobalStore((s) => s.addUser);

  const [fee, setFee] = useState("");
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [username, setUsername] = useState("");
  const [wif, setWif] = useState("");
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [done, setDone] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [progress, setProgress] = useState("");

  const { data: chainPropertiesFee } = getChainPropertiesQuery().useClientQuery();
  const { mutateAsync: hsTokenRenew } = useHsLoginRefresh();
  const { mutateAsync: updateCommunity } = useUpdateCommunity(username);
  const { mutateAsync: setUserRole } = useCommunitySetUserRole(username);

  useEffect(() => {
    if (chainPropertiesFee) {
      setFee(chainPropertiesFee);
    }
  }, [chainPropertiesFee]);

  const genUsername = useCallback(() => `hive-${Math.floor(Math.random() * 100000) + 100000}`, []);
  const genWif = useCallback(() => "P" + base58.encode(cryptoUtils.sha256(random())), []);

  const finalizeSubmit = useCallback(
    async (code: string) => {
      if (!activeUser) {
        throw new Error("[Community][Create][FinalSubmit] Active user isn't provided");
      }

      setInProgress(true);
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

      setInProgress(false);
      setDone(true);
    },
    [about, activeUser, addUser, hsTokenRenew, setUserRole, title, updateCommunity, username]
  );

  const submitForm = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!formRef.current?.checkValidity()) {
        return;
      }

      if (wif === "") {
        setUsername(genUsername());
        setWif(genWif());
        return;
      }

      setShowSignDialog(true);
    },
    [genUsername, genWif, wif]
  );

  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-6 xl:gap-8 items-center justify-center w-full">
      <CommunityCreateImage />
      <div className="col-span-12 md:col-span-8 lg:col-span-6 p-4 lg:p-6 xl:p-8 border border-[--border-color] rounded-2xl bg-white dark:bg-gray-900 w-full md:w-[600px] mx-auto">
        <h1 className="text-[2.5rem] font-bold community-title mb-4 hidden lg:block">
          {i18next.t("communities-create.page-title")}
        </h1>
        <h1 className={`community-title ${wif ? "mb-5" : ""} lg:hidden text-[2rem] font-bold`}>
          {i18next.t("communities-create.page-title")}
        </h1>
        {(!wif || !activeUser) && (
          <>
            <ul className="descriptive-list list-disc ml-6">
              <li>{i18next.t("communities-create.reason-one")}</li>
              <li>{i18next.t("communities-create.reason-two")}</li>
              <li>{i18next.t("communities-create.reason-three")}</li>
            </ul>
            <div className="learn-more mt-2 mb-4">
              {i18next.t("g.learn-more")} <Link href="/faq">{i18next.t("g.faq")}</Link>
            </div>
          </>
        )}
        <Form
          ref={formRef}
          className={`community-form ${inProgress ? "in-progress" : ""}`}
          onSubmit={submitForm}
        >
          {done && <CommunityCreateDone url={`/created/${username}`} />}
          {!done && (
            <>
              {!wif && (
                <CommunityCreateDetailsForm
                  title={title}
                  about={about}
                  setAbout={setAbout}
                  setTitle={setTitle}
                />
              )}
              {activeUser && wif && (
                <CommunityCreateWifForm
                  progress={progress}
                  wif={wif}
                  username={username}
                  fee={fee}
                  setUsername={setUsername}
                  setWif={setWif}
                  inProgress={inProgress}
                />
              )}
              {activeUser && !wif && (
                <div className="mb-4">
                  <Button type="submit" size="lg" full={true}>
                    {i18next.t("g.next")}
                  </Button>
                </div>
              )}
              {!wif && !activeUser && (
                <div className="mb-4">
                  <LoginRequired>
                    <Button type="button" full={true}>
                      {i18next.t("g.next")}
                    </Button>
                  </LoginRequired>
                </div>
              )}
            </>
          )}
        </Form>
      </div>
      <CommunityCreateSignDialog
        title={title}
        fee={fee}
        setShow={setShowSignDialog}
        show={showSignDialog}
        username={username}
        about={about}
        setProgress={setProgress}
        wif={wif}
        onSubmit={finalizeSubmit}
      />
    </div>
  );
}
