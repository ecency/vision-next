import { useGlobalStore } from "@/core/global-store";
import { Button, FormControl } from "@/features/ui";
import i18next from "i18next";
import Link from "next/link";
import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useLoginByKey } from "./hooks";

interface Props {
  username: string;
}

export function LoginUserByKey({ username }: Props) {
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);

  const [key, setKey] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const { mutateAsync: loginByKey, isPending } = useLoginByKey(username, key, isVerified);

  return (
    <>
      <FormControl
        className="mb-4"
        type="password"
        value={key}
        autoComplete="off"
        onChange={(e) => setKey(e.target.value.trim())}
        placeholder={i18next.t("login.key-placeholder")}
        onKeyDown={(e) => e.key === "Enter" && loginByKey()}
      />

      <div className="google-recaptcha">
        <ReCAPTCHA
          sitekey="6LdEi_4iAAAAAO_PD6H4SubH5Jd2JjgbIq8VGwKR"
          onChange={(v) => setIsVerified(!!v)}
          size="normal"
        />
      </div>
      <p className="login-form-text my-3">
        {i18next.t("login.login-info-1")}{" "}
        <Link
          href="/faq#how-to-signin"
          onClick={(e) => {
            e.preventDefault();
            toggleUIProp("login");
          }}
        >
          {i18next.t("login.login-info-2")}
        </Link>
      </p>
      <Button
        full={true}
        disabled={!isVerified}
        className="block"
        onClick={() => loginByKey()}
        isLoading={isPending}
      >
        {i18next.t("g.login")}
      </Button>
    </>
  );
}
