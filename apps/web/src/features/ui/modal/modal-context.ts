import { createContext } from "react";

export const ModalContext = createContext<{
  show: boolean | undefined;
  setShow: (v: boolean) => void;
  // Visual open state from useMountTransition: false on the first mounted
  // frame and during exit, so children can drive their own CSS transitions
  // (e.g. the sliding sidebar surface) in sync with the overlay fade.
  open: boolean;
}>({
  show: false,
  setShow: () => {},
  open: false
});
