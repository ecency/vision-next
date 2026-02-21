"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { hsTokenRenew, useSetCommunityRole, useUpdateCommunity } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useGlobalStore } from "@/core/global-store";
import { User } from "@/entities";
import { delay } from "@/utils";
import { EcencyAnalytics } from "@ecency/sdk";
import { UilSpinner } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import Head from "next/head";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useMount from "react-use/lib/useMount";
import {
  CommunityCreateCardLayout,
  CommunityCreateDoneStep,
  CommunityCreateStepper,
  CommunityStepperSteps
} from "../create/_components";

/**
 * Tracks the multi-step community creation flow after HiveSigner callback.
 *
 * Steps:
 * 1. "init"        - initial state, waiting to start
 * 2. "token"       - fetching HiveSigner token, creating community user
 * 3. "set-role"    - ready to set admin role (community user added to store)
 * 4. "update-props"- ready to update community properties
 * 5. "done"        - all operations complete
 */
type CreationPhase = "init" | "token" | "set-role" | "update-props" | "done";

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
  const [phase, setPhase] = useState<CreationPhase>("init");

  // Store creation params for use across effects
  const creationParams = useRef<{ title: string; about: string }>({ title: "", about: "" });

  // Guards to prevent double-execution of effects
  const roleSetRef = useRef(false);
  const propsUpdatedRef = useRef(false);

  // Singleton web broadcast adapter for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // SDK mutation hooks – we use the SDK hooks directly (not the web wrappers from
  // @/api/sdk-mutations) because this flow broadcasts AS the community account, not
  // as activeUser. The web wrappers hardcode activeUser?.username as the broadcaster.
  // Username updates via state after HiveSigner token acquisition, causing re-render
  // so hooks capture the correct community username before mutations fire.
  const { mutateAsync: setRole } = useSetCommunityRole(username, username, { adapter });
  const { mutateAsync: updateCommunity } = useUpdateCommunity(username, username, { adapter });

  // Phase 1: On mount, fetch HiveSigner token and create community user
  useMount(() => {
    const code = params?.get("code");
    const title = params?.get("title") ?? "";
    const about = params?.get("about") ?? "";

    if (!code || !activeUser) {
      router.push("/");
      return;
    }

    creationParams.current = { title, about };
    setPhase("token");
    setProgress(i18next.t("communities-create.progress-user"));

    hsTokenRenew(code).then((response) => {
      const user = {
        username: response.username,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
        postingKey: null,
        loginType: "hivesigner"
      } satisfies User;

      // Add community user to store so the web broadcast adapter can find its credentials
      addUser(user);
      setUsername(user.username);

      // Transition to next phase - will trigger re-render with correct username
      // so SDK mutation hooks capture the community username
      setPhase("set-role");
    });
  });

  // Phase 2: Set admin role (runs after re-render with correct username)
  useEffect(() => {
    if (phase !== "set-role" || !activeUser || !username || roleSetRef.current) return;
    roleSetRef.current = true;

    setProgress(i18next.t("communities-create.progress-role", { u: activeUser.username }));
    setRole({ account: activeUser.username, role: "admin" }).then(() => {
      setPhase("update-props");
    });
  }, [phase, activeUser, username, setRole]);

  // Phase 3: Update community properties (runs after role is set)
  useEffect(() => {
    if (phase !== "update-props" || !username || propsUpdatedRef.current) return;
    propsUpdatedRef.current = true;

    const { title, about } = creationParams.current;
    setProgress(i18next.t("communities-create.progress-props"));
    updateCommunity({
      title,
      about,
      lang: "en",
      description: "",
      flag_text: "",
      is_nsfw: false
    }).then(async () => {
      // Wait for hivemind to synchronize community data
      await delay(3000);
      setStep(CommunityStepperSteps.DONE);
      setPhase("done");
      recordActivity();
    });
  }, [phase, username, updateCommunity, recordActivity]);

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
