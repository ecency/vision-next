import React from "react";
import "./_index.scss";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { Entry } from "@/entities";
import {
  makeShareUrlFacebook,
  makeShareUrlLinkedin,
  makeShareUrlReddit,
  makeShareUrlDiscord,
  makeShareUrlChats,
  makeShareUrlWaves,
  makeShareUrlTwitter
} from "@/utils/url-share";
import i18next from "i18next";
import {
  facebookSvg,
  discordSvg,
  linkedinSvg,
  redditSvg,
  twitterSvg,
  wavesSvg
} from "@ui/svg";
import { chatSvg } from "@/assets/img/svg";

interface Props {
  entry: Entry;
  onHide: () => void;
}

export const shareReddit = (entry: Entry) => {
  const u = makeShareUrlReddit(entry.category, entry.author, entry.permlink, entry.title);
  window.open(u, "_blank");
};

export const shareTwitter = (entry: Entry) => {
  const u = makeShareUrlTwitter(entry.category, entry.author, entry.permlink, entry.title);
  window.open(u, "_blank");
};

export const shareFacebook = (entry: Entry) => {
  const u = makeShareUrlFacebook(entry.category, entry.author, entry.permlink);
  window.open(u, "_blank");
};

export const shareLinkedin = (entry: Entry) => {
  const u = makeShareUrlLinkedin(entry.category, entry.author, entry.permlink);
  window.open(u, "_blank");
};

export const shareDiscord = (entry: Entry) => {
  const u = makeShareUrlDiscord(entry.category, entry.author, entry.permlink, entry.title);
  window.open(u, "_blank");
};

export const shareChats = (entry: Entry) => {
  const u = makeShareUrlChats(entry.category, entry.author, entry.permlink, entry.title);
  window.open(u, "_blank");
};

export const shareWaves = (entry: Entry) => {
  const u = makeShareUrlWaves(entry.category, entry.author, entry.permlink, entry.title);
  window.open(u, "_blank");
};

export function EntryShare({ entry, onHide }: Props) {
  const reddit = () => shareReddit(entry);
  const twitter = () => shareTwitter(entry);
  const facebook = () => shareFacebook(entry);
  const linkedin = () => shareLinkedin(entry);
  const discord = () => shareDiscord(entry);
  const chats = () => shareChats(entry);
  const waves = () => shareWaves(entry);

  return (
    <Modal show={true} centered={true} onHide={onHide} className="entry-share-dialog">
      <ModalHeader closeButton={true}>
        <ModalTitle>{i18next.t("entry-share.title")}</ModalTitle>
      </ModalHeader>
      <ModalBody className="entry-share-modal-body">
        <div className="share-buttons">
          <div className="share-button" onClick={reddit}>
            {redditSvg}
          </div>
          <div className="share-button" onClick={twitter}>
            {twitterSvg}
          </div>
          <div className="share-button" onClick={facebook}>
            {facebookSvg}
          </div>
          <div className="share-button" onClick={linkedin}>
            {linkedinSvg}
          </div>
          <div className="share-button" onClick={discord}>
            {discordSvg}
          </div>
          <div className="share-button" onClick={chats}>
            {chatSvg}
          </div>
          <div className="share-button" onClick={waves}>
            {wavesSvg}
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
