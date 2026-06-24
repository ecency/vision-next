"use client";

import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Spinner } from "@ui/spinner";
import i18next from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGlobalStore } from "@/core/global-store";
import { Theme } from "@/enums";
import { EcencyConfigManager } from "@/config";
import { useUploadImageMutation } from "@/api/sdk-mutations";
import { dataUrlToFile } from "@/utils/data-url-to-file";
import { BeneficiaryRoute } from "@/entities";
import { error } from "@/features/shared";

export interface MemeCreatedPayload {
  url: string;
  alt: string;
  templateId: string;
  beneficiaries: BeneficiaryRoute[];
}

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onMemeCreated: (payload: MemeCreatedPayload) => void;
}

type Status = "loading" | "ready" | "uploading" | "error";

// If the widget never loads (offline / blocked / endpoint removed) we fall back
// to a friendly "unavailable" state instead of leaving the user staring at a
// blank frame.
const IFRAME_LOAD_TIMEOUT = 12_000;

function resolveWidgetTheme(theme: Theme): "light" | "dark" {
  if (theme === Theme.night) {
    return "dark";
  }
  if (theme === Theme.system && typeof window !== "undefined") {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  }
  return "light";
}

/**
 * Shared DecentMemes meme-maker dialog. Embeds the third-party widget as a
 * code-split iframe, talks to it over postMessage (strict origin check), and on
 * "Add to post" re-uploads the returned PNG through Ecency's own image pipeline
 * before handing the hosted URL + template + beneficiaries back to the caller.
 * Used by both the long-form publish composer and the Waves composer.
 */
export function MemeMakerDialog({ show, setShow, onMemeCreated }: Props) {
  const theme = useGlobalStore((s) => s.theme);
  const widgetTheme = resolveWidgetTheme(theme);

  const config = EcencyConfigManager.getConfigValue(
    ({ visionFeatures }) => visionFeatures.decentMemes
  );

  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const { mutateAsync: uploadImage } = useUploadImageMutation();

  // Keep the latest callback in a ref so the message listener doesn't need to
  // re-subscribe on every parent re-render.
  const onMemeCreatedRef = useRef(onMemeCreated);
  useEffect(() => {
    onMemeCreatedRef.current = onMemeCreated;
  }, [onMemeCreated]);

  const postToWidget = useCallback(
    (message: object) => {
      frameRef.current?.contentWindow?.postMessage(message, config.origin);
    },
    [config.origin]
  );

  // Push theme changes to the widget while it is open.
  useEffect(() => {
    if (status === "ready" || status === "uploading") {
      postToWidget({ type: "setTheme", theme: widgetTheme });
    }
  }, [widgetTheme, status, postToWidget]);

  // Listen for messages from the widget. Origin is validated strictly.
  useEffect(() => {
    if (!show) {
      return;
    }

    async function onMessage(event: MessageEvent) {
      if (event.origin !== config.origin) {
        return;
      }
      const data = event.data;
      if (!data || typeof data !== "object" || data.type !== "memeCreated") {
        return;
      }
      if (typeof data.imageDataUrl !== "string") {
        return;
      }

      try {
        setStatus("uploading");
        // The image is re-hosted on our own CDN here, so once this resolves we
        // have no further runtime dependency on the third-party widget.
        const file = await dataUrlToFile(data.imageDataUrl, data.imageFileName);
        const { url } = await uploadImage({ file });
        if (!url) {
          throw new Error("Upload returned no URL");
        }

        const rawBeneficiaries = Array.isArray(data?.beneficiaries?.post)
          ? data.beneficiaries.post
          : [];
        const beneficiaries: BeneficiaryRoute[] = rawBeneficiaries
          .filter((b: any) => b && typeof b.account === "string" && Number(b.weight) > 0)
          .map((b: any) => ({ account: b.account, weight: Math.round(Number(b.weight)) }));

        onMemeCreatedRef.current({
          url,
          alt: typeof data?.template?.name === "string" ? data.template.name : "meme",
          templateId: typeof data?.template?.id === "string" ? data.template.id : "",
          beneficiaries
        });
      } catch (e) {
        setStatus("ready");
        error(i18next.t("decentmemes.upload-error"));
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [show, config.origin, uploadImage]);

  // Reset status whenever the dialog is (re)opened, and arm the load timeout.
  useEffect(() => {
    if (!show) {
      setStatus("loading");
      return;
    }
    if (status !== "loading") {
      return;
    }
    const timer = setTimeout(
      () => setStatus((s) => (s === "loading" ? "error" : s)),
      IFRAME_LOAD_TIMEOUT
    );
    return () => clearTimeout(timer);
  }, [show, status]);

  const onFrameLoad = useCallback(() => {
    // Only the initial load moves us out of "loading" - a later reload must not
    // clobber an in-flight "uploading" (the spinner would vanish mid-upload).
    setStatus((s) => (s === "loading" ? "ready" : s));
    // Sending an `account` opts Ecency into the optional 1% "frontend"
    // beneficiary slot (routed to this Hive account by the widget).
    postToWidget({
      type: "frontendInit",
      theme: widgetTheme,
      account: config.frontendAccount
    });
  }, [postToWidget, widgetTheme, config.frontendAccount]);

  return (
    <Modal show={show} centered={true} onHide={() => setShow(false)} size="lg">
      <ModalHeader closeButton={true}>
        <ModalTitle>{i18next.t("decentmemes.dialog-title")}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        {status === "error" ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="text-lg font-semibold">
              {i18next.t("decentmemes.unavailable-title")}
            </div>
            <div className="opacity-75">{i18next.t("decentmemes.unavailable-description")}</div>
          </div>
        ) : (
          <div className="relative">
            <iframe
              ref={frameRef}
              src={config.widgetUrl}
              title="DecentMemes"
              className="w-full rounded-lg"
              style={{ height: 640, border: 0 }}
              allow="clipboard-write"
              // Sandboxed for defense-in-depth: blocks top-level navigation,
              // downloads, etc. `allow-same-origin` is kept so the widget can use
              // its own origin's storage; postMessage works regardless. Tightening
              // further (dropping same-origin) would need confirmation that the
              // widget does not rely on its own cookies/localStorage.
              sandbox="allow-scripts allow-same-origin allow-popups"
              onLoad={onFrameLoad}
              onError={() => setStatus("error")}
            />
            {(status === "loading" || status === "uploading") && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 dark:bg-black/70">
                <Spinner className="w-6 h-6" />
              </div>
            )}
            <div className="mt-2 text-xs opacity-60">
              {i18next.t("decentmemes.beneficiary-note")}
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
