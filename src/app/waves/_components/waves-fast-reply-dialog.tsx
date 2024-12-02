import { Modal, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { WaveEntry } from "@/entities";
import { WaveForm } from "@/features/waves";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";
import { AnimatePresence } from "framer-motion";

interface Props {
  show: boolean;
  onHide: () => void;
  entry?: WaveEntry;
}

export function WavesFastReplyDialog({ show, onHide, entry }: Props) {
  return (
    <Modal size="lg" centered={true} show={show} onHide={onHide}>
      <ModalHeader closeButton={true}>
        <div>
          {i18next.t("waves.reply-to")}
          <span className="text-blue-dark-sky ml-1">@{entry?.author}</span>
        </div>
      </ModalHeader>
      <AnimatePresence>
        {entry && <WavesListItem interactable={false} item={entry} i={0} />}
      </AnimatePresence>
      <WaveForm entry={undefined} replySource={entry} />
    </Modal>
  );
}
