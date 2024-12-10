import { RoomType } from "jam-core";
import Image from "next/image";
import { UserAvatar } from "@/features/shared";
import useMount from "react-use/lib/useMount";
import { useEcencyLive } from "@/features/ecency-live/ecency-live-context";

interface Props {
  room: RoomType;
}

export function EcencyLiveItem({ room }: Props) {
  const [_, api] = useEcencyLive();

  useMount(() => api.onState("peers", (peers) => console.log(peers)));

  return (
    <div className="flex items-start p-3 border-b border-[--border-color] last:border-0 hover:bg-gray-200 dark:hover:bg-dark-default duration-300 cursor-pointer gap-3">
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
    </div>
  );
}
