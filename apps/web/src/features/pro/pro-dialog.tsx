"use client";

import { QueryKeys, type ProMembersResponse } from "@ecency/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { Alert } from "@ui/alert";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { useState } from "react";
import { ProCheckout } from "./pro-checkout";

interface Props {
  /** The authenticated buyer. */
  username: string;
  onHide: () => void;
  /** Set when reopened after a redirect-based payment return, to resume the grant poll. */
  resumePaymentIntent?: string;
}

/**
 * Ecency Pro purchase dialog. Dynamically imported from the perks hub (ssr:false) so
 * @stripe/stripe-js stays out of the perks bundle until the user opens it.
 */
export function ProDialog({ username, onHide, resumePaymentIntent }: Props) {
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  // On activation, reflect the new membership immediately. The /perks card and every ProBadge
  // read the shared pro-members roster (5-min stale window), so without this a just-paid user
  // would still see "Go Pro" and no badge until a later refetch. Optimistically add them, then
  // invalidate so the authoritative roster catches up.
  const handleActivated = () => {
    setDone(true);
    queryClient.setQueryData<ProMembersResponse>(QueryKeys.accounts.proMembers(), (prev) => {
      const members = prev?.members ?? [];
      if (members.includes(username)) return prev;
      return { members: [...members, username], count: (prev?.count ?? 0) + 1 };
    });
    queryClient.invalidateQueries({ queryKey: QueryKeys.accounts.proMembers() });
  };

  // Redirect-based methods send the buyer to /perks and Stripe re-appends payment_intent; the
  // perks page reopens this dialog to resume, so anchor the returnUrl there with a marker.
  const returnUrl = typeof window !== "undefined" ? `${window.location.origin}/perks?pro=1` : "";

  return (
    <Modal show={true} centered={true} onHide={onHide} size="md">
      <ModalHeader closeButton={true}>{i18next.t("pro.title")}</ModalHeader>
      <ModalBody>
        {done ? (
          <Alert appearance="success">
            <div className="flex flex-col gap-1">
              <strong>{i18next.t("pro.success-title")}</strong>
              <span>{i18next.t("pro.success-body")}</span>
            </div>
          </Alert>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="opacity-75 text-sm">{i18next.t("pro.subtitle")}</p>
            <ul className="text-sm flex flex-col gap-1 list-disc pl-5">
              <li>{i18next.t("pro.benefit-badge")}</li>
              <li>{i18next.t("pro.benefit-support")}</li>
              <li>{i18next.t("pro.benefit-early")}</li>
            </ul>
            <ProCheckout
              username={username}
              returnUrl={returnUrl}
              resumePaymentIntent={resumePaymentIntent}
              onActivated={handleActivated}
            />
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}

export default ProDialog;
