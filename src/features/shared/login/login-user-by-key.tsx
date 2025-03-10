import { Button, FormControl } from "@/features/ui";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";
import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useLoginByKey } from "./hooks";

interface Props {
  username: string;
}

export function LoginUserByKey({ username }: Props) {
  const [key, setKey] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const { mutateAsync: loginByKey, isPending } = useLoginByKey(username, key, isVerified);

  return (
    <motion.div className="w-full" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
      <FormControl
        className="mb-2"
        type="password"
        value={key}
        autoComplete="off"
        onChange={(e) => setKey(e.target.value.trim())}
        placeholder={i18next.t("login.key-placeholder")}
        onKeyDown={(e) => e.key === "Enter" && loginByKey()}
      />
      <div className="pl-2 text-sm">
        {i18next.t("login.login-info-1")}{" "}
        <Link target="_blank" href="/faq#how-to-signin">
          {i18next.t("login.login-info-2")}
        </Link>
      </div>

      <div className="google-recaptcha">
        <ReCAPTCHA
          sitekey="6LdEi_4iAAAAAO_PD6H4SubH5Jd2JjgbIq8VGwKR"
          onChange={(v) => setIsVerified(!!v)}
          size="normal"
        />
      </div>
      <Button
        full={true}
        size="lg"
        icon={<UilArrowRight />}
        disabled={!isVerified}
        className="block"
        onClick={() => loginByKey()}
        isLoading={isPending}
      >
        {i18next.t("g.login")}
      </Button>
    </motion.div>
  );
}
