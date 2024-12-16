import { motion } from "framer-motion";
import Image from "next/image";
import { useEcencyLive } from "@/features/ecency-live";
import { UilMicrophoneSlash } from "@tooni/iconscout-unicons-react";
import { EcencyLiveWaveIcon } from "@/features/ecency-live/ecency-live-wave-icon";

interface Props {
  onClick?: () => void;
}

export function CenterButton(props: Props) {
  const { room, activeUserState } = useEcencyLive();

  return (
    <motion.div
      {...props}
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="flex items-center justify-start bg-white border border-[--border-color] rounded-full cursor-pointer"
      variants={{
        rest: {},
        hover: {}
      }}
    >
      <motion.div
        variants={{
          rest: { rotate: 0 },
          hover: { rotate: 25, scale: 0.9 }
        }}
      >
        <Image
          src="/assets/logo-circle.svg"
          alt="Logo"
          width={75}
          height={72}
          className="w-[3rem] h-[3rem] duration-300"
        />
      </motion.div>
      <div className="flex flex-col">
        <div className="pl-2 pr-4 font-semibold text-sm text-blue-dark-sky">Center</div>
        {room && (
          <div className="pl-2 pr-3 gap-1 flex items-center text-xs text-gray-600 dark:text-gray-400">
            <EcencyLiveWaveIcon />
            {room.name}
            {activeUserState?.micMuted && <UilMicrophoneSlash className="w-3 h-3" />}
          </div>
        )}
      </div>
    </motion.div>
  );
}
