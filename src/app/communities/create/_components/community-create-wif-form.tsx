import i18next from "i18next";
import { StyledTooltip } from "@ui/tooltip";
import { alertCircleSvg, checkSvg } from "@ui/svg";
import { FormControl, InputGroupCopyClipboard } from "@ui/input";
import { COMMUNITY_NAME_PATTERN } from "@/app/communities/create/_consts";
import { handleInvalid, handleOnInput } from "@/utils";
import { Button } from "@ui/button";
import { Spinner } from "@ui/spinner";
import { useGlobalStore } from "@/core/global-store";
import { useCallback, useEffect, useState } from "react";
import { getAccount } from "@/api/hive";
import { Badge } from "@ui/badge";
import { UilInfoCircle } from "@tooni/iconscout-unicons-react";
import { ProfileLink, UserAvatar } from "@/features/shared";

interface Props {
  fee: string;
  username: string;
  setUsername: (name: string) => void;
  wif: string;
  setWif: (wif: string) => void;
  inProgress: boolean;
  progress: string;
}

export function CommunityCreateWifForm({
  fee,
  username,
  setUsername,
  wif,
  setWif,
  inProgress,
  progress
}: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const [usernameStatus, setUsernameStatus] = useState<"ok" | "conflict" | "not-valid">();

  const checkUsername = useCallback(async () => {
    setUsernameStatus(undefined);

    const re = new RegExp(COMMUNITY_NAME_PATTERN);

    if (re.test(username)) {
      const r = await getAccount(username);
      setUsernameStatus(r ? "conflict" : "ok");
    } else {
      setUsernameStatus("not-valid");
    }
  }, [username]);

  useEffect(() => {
    checkUsername();
  }, [checkUsername]);

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center mb-1 gap-2">
          <div>{i18next.t("communities-create.fee")}</div>
          <StyledTooltip className="flex" content={i18next.t("communities-create.reason-four")}>
            <UilInfoCircle className="w-4 h-4 opacity-50 hover:opacity-100 pointer" />
          </StyledTooltip>
        </div>
        <Badge>{fee}</Badge>
      </div>
      <div className="mb-4">
        <div>{i18next.t("communities-create.creator")}</div>
        <ProfileLink
          target="_blank"
          className="block hover:opacity-75"
          username={activeUser?.username ?? ""}
        >
          <Badge className="flex items-center gap-1 !p-1 !pr-2">
            <UserAvatar size="small" username={activeUser?.username ?? ""} />
            <span>@{activeUser?.username}</span>
          </Badge>
        </ProfileLink>
      </div>
      <div className="mb-4">
        <label className="text-sm font-semibold px-4 mb-2">
          {i18next.t("communities-create.username")}
        </label>
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
          <small className="text-green flex p-2 items-center gap-2">
            <span className="w-6 h-6">{checkSvg}</span>
            {i18next.t("communities-create.username-available")}
          </small>
        )}
        {usernameStatus === "conflict" && (
          <small className="text-red">
            {alertCircleSvg} {i18next.t("communities-create.username-not-available")}
          </small>
        )}
        {usernameStatus === "not-valid" && (
          <small className="text-red">
            {alertCircleSvg} {i18next.t("communities-create.username-wrong-format")}
          </small>
        )}
      </div>
      <div className="mb-4">
        <label className="text-sm font-semibold px-4 mb-2">
          {i18next.t("communities-create.password")}
        </label>
        <div className="mb-4">
          <InputGroupCopyClipboard value={wif} />
        </div>
      </div>
      <div className="mb-4">
        <label className="label-text">
          <input
            type="checkbox"
            required={true}
            onInvalid={(e: any) => handleInvalid(e, "communities-create.", "checkbox-validation")}
            onInput={handleOnInput}
          />{" "}
          {i18next.t("communities-create.confirmation")}
        </label>
      </div>
      <div className="mb-4">
        <Button
          appearance="link"
          size="lg"
          full={true}
          onClick={() => setWif("")}
          id="black-on-night"
        >
          {i18next.t("g.back")}
        </Button>
      </div>
      <div className="mb-4">
        <Button
          type="submit"
          disabled={inProgress}
          size="lg"
          full={true}
          icon={inProgress && <Spinner className="w-3.5 h-3.5" />}
          iconPlacement="left"
        >
          {i18next.t("communities-create.submit")}
        </Button>
      </div>
      {inProgress && <p>{progress}</p>}
    </>
  );
}
