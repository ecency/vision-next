"use client";

import { FormEvent, useState } from "react";
import { subscribeEmail } from "@ecency/sdk";
import { error, success } from "@/features/shared/feedback";
import { LinearProgress } from "@/features/shared/linear-progress";
import i18next from "i18next";
import { handleInvalid, handleOnInput } from "@/utils";

export function LandingSubscribeForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await subscribeEmail(email);
      if (response && response.status >= 200 && response.status < 300) {
        success(i18next.t("landing-page.success-message-subscribe"));
      }
    } catch (err) {
      error(i18next.t("landing-page.error-occured"));
    } finally {
      setEmail("");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubscribe}>
      <input
        type="email"
        placeholder={i18next.t("landing-page.enter-your-email-adress")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required={true}
        onInvalid={(e: any) => handleInvalid(e, "landing-page.", "validation-email")}
        onInput={handleOnInput}
      />
      <button disabled={loading}>
        {loading ? (
          <span>
            <LinearProgress />
          </span>
        ) : (
          i18next.t("landing-page.send")
        )}
      </button>
    </form>
  );
}
