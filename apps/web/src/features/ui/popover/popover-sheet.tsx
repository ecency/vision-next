import { AnimatePresence, motion } from "framer-motion";
import React, { PropsWithChildren, useRef } from "react";
import { useLockBodyScroll } from "react-use";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
}

export function PopoverSheet({ show, setShow, children }: PropsWithChildren<Props>) {
  useLockBodyScroll(show);

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            key="overlay"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 0.5
            }}
            exit={{
              opacity: 0
            }}
            className="bg-black z-[1040] fixed top-0 left-0 right-0 bottom-0"
            onClick={() => setShow(false)}
          />

          <motion.div
            key="sheet"
            className="fixed z-[1060] overflow-hidden bottom-0 w-full h-[640px] bg-white rounded-t-2xl"
            initial={{ y: 640 }}
            animate={{ y: 160 }}
            exit={{ y: 640 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto h-[480px]">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
