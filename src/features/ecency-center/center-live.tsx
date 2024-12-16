"use client";

import { useGetPrebuiltRoomsQuery } from "@/features/ecency-live/queries";
import {
  EcencyLiveAudienceList,
  EcencyLiveItem,
  EcencyLiveRoomActions,
  useEcencyLive
} from "@/features/ecency-live";
import { AnimatePresence, motion } from "framer-motion";

export function CenterLive() {
  const { live, room } = useEcencyLive();

  const { data: prebuiltRooms } = useGetPrebuiltRoomsQuery();

  return (
    <div className="flex flex-col min-h-[400px] relative">
      <AnimatePresence mode="popLayout">
        {!room &&
          prebuiltRooms?.map(([id, room]) => (
            <EcencyLiveItem
              key={id}
              room={room!}
              onClick={async () => {
                await live?.[1].setProps("roomId", id);
                await live?.[1].enterRoom(id);
              }}
            />
          ))}
        {room && (
          <motion.div
            initial={{ opacity: 0, position: "absolute" }}
            animate={{ opacity: 1, position: "static" }}
            exit={{ opacity: 0, position: "absolute" }}
            key="live-room"
          >
            <EcencyLiveItem room={room} />
            <EcencyLiveAudienceList />
            <EcencyLiveRoomActions
              onLeave={async () => {
                await live?.[1].setProps("roomId", null);
                live?.[1].leaveRoom();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
