import { CenterButton } from "@/features/ecency-center/center-button";
import { CenterContent } from "@/features/ecency-center/center-content";
import { CenterContentLayout } from "@/features/ecency-center/center-content-layout";
import { useRef, useState } from "react";
import useClickAway from "react-use/lib/useClickAway";

export function EcencyCenter() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useClickAway(rootRef, () => show && setShow(false));

  return (
    <div ref={rootRef} className="fixed z-30 bottom-4 left-4">
      <CenterButton onClick={() => setShow(!show)} />
      <CenterContentLayout show={show} setShow={setShow}>
        <CenterContent />
      </CenterContentLayout>
    </div>
  );
}
