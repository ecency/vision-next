import { RoomType } from "jam-core";
import Image from "next/image";
import { UserAvatar } from "@/features/shared";
import { classNameObject } from "@ui/util";
import { motion } from "framer-motion";

interface Props {
  room: RoomType;
  onClick?: () => void;
}

export function EcencyLiveItem({ room, onClick }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.875, position: "absolute" }}
      animate={{ opacity: 1, scale: 1, position: "static" }}
      exit={{ opacity: 0, scale: 0.875, position: "absolute" }}
      key={room.name}
      className={classNameObject({
        "flex items-start p-3 cursor-pointer gap-3": true,
        "hover:bg-gray-200 dark:hover:bg-dark-default border-b border-[--border-color] last:border-0":
          !!onClick
      })}
      onClick={onClick}
    >
      <Image
        src={room.logoURI ?? ""}
        alt=""
        width={48}
        height={48}
        className="w-10 h-10 rounded-full"
      />
      <div>
        <div className="font-semibold">{room.name}</div>
        <div className="text-sm opacity-50">{room.description}</div>
      </div>
      <div>
        {room.speakers.map((speaker) => (
          <UserAvatar username={speaker} key={speaker} />
        ))}
      </div>
    </motion.div>
  );
}
