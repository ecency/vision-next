import React from "react";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Account } from "@/entities";
import { FriendsList } from "@/app/(dynamicPages)/profile/[username]/_components/friends/friends-list";
import { getFriendsTitle } from "@/app/(dynamicPages)/profile/[username]/_components/friends/friends-title";

interface Props {
  account: Account;
  onHide: () => void;
}
export function Followers({ onHide, account }: Props) {
  return (
    <Modal onHide={onHide} show={true} centered={true} size="lg">
      <ModalHeader closeButton={true}>
        <ModalTitle>{getFriendsTitle(account, "followers")}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <FriendsList mode="followers" account={account} />
      </ModalBody>
    </Modal>
  );
}

export function Following({ onHide, account }: Props) {
  return (
    <Modal onHide={onHide} show={true} centered={true} size="lg">
      <ModalHeader closeButton={true}>
        <ModalTitle>{getFriendsTitle(account, "following")}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <FriendsList mode="following" account={account} />
      </ModalBody>
    </Modal>
  );
}
