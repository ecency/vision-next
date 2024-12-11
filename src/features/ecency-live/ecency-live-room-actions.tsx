import { Button } from "@ui/button";
import { UilExit } from "@tooni/iconscout-unicons-react";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { useEcencyLive } from "@/features/ecency-live/ecency-live-context";
import { motion } from "framer-motion";
import useMount from "react-use/lib/useMount";

interface Props {
  onLeave: () => void;
}

export function EcencyLiveRoomActions({ onLeave }: Props) {
  const live = useEcencyLive();

  useMount(() => {});

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.875 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.875 }}
      key="actions"
      className="flex items-center gap-4 p-4 justify-center"
    >
      <Tooltip content={i18next.t("live.leave-room")}>
        <Button
          icon={<UilExit />}
          noPadding={true}
          className="w-[34px]"
          appearance="danger"
          onClick={() => {
            live?.[1].leaveRoom();
            onLeave();
          }}
        />
      </Tooltip>
    </motion.div>
  );
}
