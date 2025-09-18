import { Button, FormControl } from "@/features/ui";
import {
  UilArrowRight,
  UilCheckCircle,
  UilFileUpload,
  UilTrash
} from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useLoginByKey } from "./hooks";
import clsx from "clsx";
import { error } from "../feedback";

interface Props {
  username: string;
}

export function LoginUserByKey({ username }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [key, setKey] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [option, setOption] = useState<"key" | "seed">("key");
  const [seed, setSeed] = useState<string>();
  const [seedFilename, setSeedfilename] = useState<string>();

  const loginKey = useMemo(
    () => (option === "seed" ? seed ?? "" : key),
    [option, seed, key]
  );
  const { mutateAsync: loginByKey, isPending } = useLoginByKey(
    username,
    loginKey,
    isVerified
  );

  const handleLogin = () => {
    loginByKey().catch(() => {
      /* Already handled in onError of the mutation */
    });
  };

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    try {
      const files = e.target.files;
      const firstFile = files?.item(0)!;
      const raw = await firstFile.text();

      // Process case with Ecency generated seed
      if (raw.startsWith("Seed:")) {
        const [seed] = raw.split("\n");
        const words = seed.replace("Seed: ", "").split(" ");
        if (words.length === 12) {
          setSeed(seed.replace("Seed: ", ""));
        } else {
          throw new Error();
        }
      }
      // Process raw seed phrase file with 12 words only
      else {
        const words = raw.split(" ");
        if (words.length === 12) {
          setSeed(raw);
        } else {
          throw new Error();
        }
      }

      setSeedfilename(firstFile.name);
    } catch (e) {
      error(i18next.t("login.invalid-seed-file"));
    }
  }

  return (
    <motion.div className="w-full" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
      {option === "key" && (
        <>
          <FormControl
            className="mb-2"
            type="password"
            value={key}
            autoComplete="off"
            onChange={(e) => setKey(e.target.value.trim())}
            placeholder={i18next.t("login.key-placeholder")}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          <div className="pl-2 text-xs">
            {i18next.t("login.login-info-1")}{" "}
            <Link target="_blank" href="/faq#how-to-signin">
              {i18next.t("login.login-info-2")}
            </Link>
          </div>
        </>
      )}
      {option === "seed" && (
        <>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
          <div
            className={clsx(
              "duration-300  bg-gray-100 dark:bg-dark-default  rounded-xl p-8 w-full flex flex-col items-center justify-center gap-4 text-sm cursor-pointer text-center",
              seed
                ? "border border-green text-green"
                : "border-dashed border border-[--border-color] hover:border-blue-dark-sky hover:text-blue-dark-sky"
            )}
            onClick={() => !seed && fileInputRef.current?.click()}
          >
            {seed ? <UilCheckCircle className="w-8 h-8" /> : <UilFileUpload className="w-8 h-8" />}
            {seed ? (
              <div className="border border-dashed border-green bg-green bg-opacity-10 rounded-lg p-2 flex items-center gap-2">
                {seedFilename}
                <UilTrash
                  onClick={() => {
                    setSeed(undefined);
                    setSeedfilename(undefined);
                  }}
                  className="cursor-pointer text-red hover:rotate-3 hover:scale-110 w-4 h-4 duration-300"
                />
              </div>
            ) : (
              i18next.t("login.seed-file-placeholder")
            )}
          </div>
          <div className="pt-2 text-xs">{i18next.t("login.seed-info")}</div>
        </>
      )}

      <div className="google-recaptcha">
        <ReCAPTCHA
          sitekey="6LdEi_4iAAAAAO_PD6H4SubH5Jd2JjgbIq8VGwKR"
          onChange={(v) => setIsVerified(!!v)}
          size="normal"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          appearance="secondary"
          outline={true}
          full={true}
          size="lg"
          className="block"
          onClick={() => setOption(option === "key" ? "seed" : "key")}
          disabled={isPending}
        >
          {i18next.t(option === "key" ? "login.use-seed" : "login.use-key")}
        </Button>
        <Button
          full={true}
          size="lg"
          icon={<UilArrowRight />}
          disabled={!isVerified}
          className="block"
          onClick={handleLogin}
          isLoading={isPending}
        >
          {i18next.t("g.login")}
        </Button>
      </div>
    </motion.div>
  );
}
