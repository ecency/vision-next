"use client";

import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { ProBlogClaim } from "./pro-blog-claim";

interface Props {
  /** The authenticated Ecency Pro member. */
  username: string;
  onHide: () => void;
}

/**
 * Modal that lets an existing Ecency Pro member claim/open their bundled free blog. Opened from
 * the perks Pro card once the viewer is already a member (non-members open the checkout dialog).
 */
export function ProBlogDialog({ username, onHide }: Props) {
  return (
    <Modal show={true} centered={true} onHide={onHide} size="md">
      <ModalHeader closeButton={true}>{i18next.t("pro-blog.title")}</ModalHeader>
      <ModalBody>
        <ProBlogClaim username={username} />
      </ModalBody>
    </Modal>
  );
}

export default ProBlogDialog;
