"use client";

import { useGetPrebuiltRoomsQuery } from "@/features/ecency-live/queries";
import {
  EcencyLiveAudienceList,
  EcencyLiveItem,
  EcencyLiveRoomActions,
  useEcencyLive
} from "@/features/ecency-live";
import { useState } from "react";
import { RoomType } from "jam-core";
import { AnimatePresence, motion } from "framer-motion";

export function CenterLive() {
  const live = useEcencyLive();

  const [activeRoom, setActiveRoom] = useState<RoomType>();

  const { data: prebuiltRooms } = useGetPrebuiltRoomsQuery();

  return (
    <div className="flex flex-col">
      <AnimatePresence>
        {!activeRoom &&
          prebuiltRooms?.map(([id, room]) => (
            <EcencyLiveItem
              key={id}
              room={room!}
              onClick={async () => {
                await live?.[1].setProps({
                  roomId: id
                });
                await live?.[1].enterRoom(id);
                setActiveRoom(room);
              }}
            />
          ))}
        {activeRoom && (
          <motion.div
            initial={{ opacity: 0, position: "absolute" }}
            animate={{ opacity: 1, position: "static" }}
            exit={{ opacity: 0, position: "absolute" }}
            key="live-room"
          >
            <EcencyLiveItem room={activeRoom} />
            <EcencyLiveAudienceList />
            <EcencyLiveRoomActions onLeave={() => setActiveRoom(undefined)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
