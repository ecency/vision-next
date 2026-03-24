"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { ensureValidToken, getRefreshToken, getUser } from "@/utils/user-token";
import { UilExclamationTriangle, UilEye, UilSpinner } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useCallback, useEffect, useState } from "react";
import { Button, Modal, ModalBody, ModalHeader } from "@/features/ui";
import qrcode from "qrcode";

function buildAuthTransferUri(
  username: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): string {
  const params = new URLSearchParams({
    username,
    accessToken,
    refreshToken,
    expiresIn: String(expiresIn)
  });
  return `ecency://auth-transfer?${params.toString()}`;
}

interface Props {
  show: boolean;
  onHide: () => void;
}

export function MobileLoginQrDialog({ show, onHide }: Props) {
  const { activeUser } = useActiveAccount();
  const [revealed, setRevealed] = useState(false);
  const [qrSrc, setQrSrc] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  // Reset state when dialog closes
  useEffect(() => {
    if (!show) {
      setRevealed(false);
      setQrSrc(undefined);
      setError(undefined);
      setIsLoading(false);
    }
  }, [show]);

  const generateQr = useCallback(async () => {
    if (!activeUser?.username) return;

    setIsLoading(true);
    setError(undefined);

    try {
      const accessToken = await ensureValidToken(activeUser.username);
      const refreshToken = getRefreshToken(activeUser.username);
      const user = getUser(activeUser.username);

      if (!accessToken || !refreshToken) {
        setError(i18next.t("mobile-login-qr.error-no-token", {
          defaultValue: "Unable to generate login QR. Please try logging out and back in."
        }));
        setIsLoading(false);
        return;
      }

      const uri = buildAuthTransferUri(
        activeUser.username,
        accessToken,
        refreshToken,
        user?.expiresIn ?? 86400
      );

      const src = await qrcode.toDataURL(uri, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M"
      });

      setQrSrc(src);
      setRevealed(true);
    } catch {
      setError(i18next.t("mobile-login-qr.error-generate", {
        defaultValue: "Failed to generate QR code. Please try again."
      }));
    } finally {
      setIsLoading(false);
    }
  }, [activeUser?.username]);

  return (
    <Modal centered={true} show={show} onHide={onHide}>
      <ModalHeader closeButton={true}>
        <div className="font-semibold">
          {i18next.t("mobile-login-qr.title", { defaultValue: "Login to Mobile App" })}
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="flex flex-col gap-4">
          {!revealed && !isLoading && (
            <>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <div className="flex gap-3">
                  <UilExclamationTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-semibold">
                      {i18next.t("mobile-login-qr.warning-title", {
                        defaultValue: "This QR code contains your session credentials"
                      })}
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        {i18next.t("mobile-login-qr.warning-1", {
                          defaultValue: "Do not scan in public spaces where others can see your screen"
                        })}
                      </li>
                      <li>
                        {i18next.t("mobile-login-qr.warning-2", {
                          defaultValue: "Do not share or screenshot the QR code"
                        })}
                      </li>
                      <li>
                        {i18next.t("mobile-login-qr.warning-3", {
                          defaultValue: "Disable screen recording or mirroring before revealing"
                        })}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                full={true}
                size="lg"
                onClick={generateQr}
                icon={<UilEye className="w-5 h-5" />}
              >
                {i18next.t("mobile-login-qr.reveal-button", {
                  defaultValue: "I understand, reveal QR code"
                })}
              </Button>
            </>
          )}

          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <UilSpinner className="w-8 h-8 animate-spin text-blue-dark-sky" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {i18next.t("mobile-login-qr.generating", { defaultValue: "Generating secure QR code..." })}
              </div>
            </div>
          )}

          {revealed && qrSrc && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {i18next.t("mobile-login-qr.instructions", {
                  defaultValue: "Open Ecency mobile app, tap the QR scanner, and scan this code to login."
                })}
              </p>

              <div className="bg-white p-4 rounded-2xl border border-[--border-color]">
                <img
                  src={qrSrc}
                  alt="Login QR"
                  className="w-[260px] h-[260px]"
                />
              </div>

              <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
                {i18next.t("mobile-login-qr.logged-in-as", {
                  defaultValue: "Logged in as @{{username}}",
                  username: activeUser?.username
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 text-center py-4">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button appearance="secondary" onClick={onHide}>
              {i18next.t("g.close")}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
