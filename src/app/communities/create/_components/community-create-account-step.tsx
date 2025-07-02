import { getAccountsQuery } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { ProfileLink, UserAvatar } from "@/features/shared";
import { Badge, Button, FormControl, InputGroupCopyClipboard, StyledTooltip } from "@/features/ui";
import { Form } from "@/features/ui/form";
import i18next from "i18next";
import { useCallback, useMemo, useRef } from "react";
import { COMMUNITY_NAME_PATTERN } from "../_consts";
import { CommunityCreateCardLayout } from "./community-create-card-layout";

interface Props {
  title: string;
  fee: string | undefined;
  username: string;
  wif: string;
  setUsername: (v: string) => void;
  onSubmit: () => void;
}

export function CommunityCreateAccountStep({
  title,
  username,
  setUsername,
  fee,
  onSubmit,
  wif
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const activeUser = useGlobalStore((s) => s.activeUser);

  const { data: accounts } = getAccountsQuery([username]).useClientQuery();
  const usernameStatus = useMemo(() => {
    if (!new RegExp(COMMUNITY_NAME_PATTERN).test(username)) {
      return "not-valid";
    }

    if (accounts?.[0]?.name === username) {
      return "conflict";
    }

    return "ok";
  }, [username, accounts]);

  const submitForm = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!formRef.current?.checkValidity() || !username) {
      return;
    }

    onSubmit();
  }, []);

  return (
    <CommunityCreateCardLayout>
      <div className="rounded-xl border border-[--border-color] mb-4">
        <div className="px-3 py-1 sm:px-4 sm:py-2 flex justify-between items-center border-b border-[--border-color]">
          <div className="text-sm md:text-base opacity-50">
            {i18next.t("communities-create.creator")}
          </div>
          <ProfileLink
            target="_external"
            className="block hover:opacity-75"
            username={activeUser?.username ?? ""}
          >
            <Badge className="flex items-center gap-1 !p-1 !pr-2">
              <UserAvatar size="small" username={activeUser?.username ?? ""} />
              <span>@{activeUser?.username}</span>
            </Badge>
          </ProfileLink>
        </div>
        <div className="px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center">
          <StyledTooltip className="flex" content={i18next.t("communities-create.reason-four")}>
            <div className="text-sm md:text-base opacity-50">
              {i18next.t("communities-create.fee")}
            </div>
          </StyledTooltip>
          <Badge>{fee}</Badge>
        </div>
      </div>

      <Form ref={formRef} onSubmit={onSubmit}>
        <div className="mb-4">
          <div className="text-sm font-semibold px-3 mb-2">
            {i18next.t("communities-create.username")}
          </div>
          <FormControl
            type="text"
            autoComplete="off"
            value={username}
            maxLength={11}
            name="username"
            pattern={COMMUNITY_NAME_PATTERN}
            title={i18next.t("communities-create.username-wrong-format")}
            onChange={(e) => setUsername(e.target.value)}
          />

          {usernameStatus === "ok" && (
            <div className="text-sm px-3 text-green">
              {i18next.t("communities-create.username-available")}
            </div>
          )}
          {usernameStatus === "conflict" && (
            <div className="text-sm px-3 text-red">
              {i18next.t("communities-create.username-not-available")}
            </div>
          )}
          {usernameStatus === "not-valid" && (
            <div className="text-sm px-3 text-red">
              {i18next.t("communities-create.username-wrong-format")}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="text-sm font-semibold px-3 mb-2">
            {i18next.t("communities-create.password")}
          </div>

          <InputGroupCopyClipboard value={wif} />
        </div>

        <div className="mb-4">
          <label className="label-text">
            <input type="checkbox" required={true} disabled={true} checked />{" "}
            {i18next.t("communities-create.confirmation")}
          </label>
        </div>
      </Form>

      <div className="flex justify-end">
        <Button disabled={!username} onClick={submitForm}>
          {i18next.t("g.continue")}
        </Button>
      </div>
    </CommunityCreateCardLayout>
  );
}
