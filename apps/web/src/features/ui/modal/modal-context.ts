import { createContext } from "react";

export const ModalContext = createContext<{
  show: boolean | undefined;
  setShow: (v: boolean) => void;
}>({
  show: false,
  setShow: () => {}
});
