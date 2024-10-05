import { CenterButton } from "@/features/ecency-center/center-button";
import { CenterContent } from "@/features/ecency-center/center-content";
import { CenterContentLayout } from "@/features/ecency-center/center-content-layout";
import { useMemo, useRef, useState } from "react";
import useClickAway from "react-use/lib/useClickAway";
import { usePathname } from "next/navigation";

export function EcencyCenter() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  const pathname = usePathname();
  const isSubmitPage = useMemo(
    () => pathname.includes("submit") || pathname.includes("edit") || pathname.includes("draft"),
    [pathname]
  );
  useClickAway(rootRef, () => show && setShow(false));

  return isSubmitPage ? (
    <></>
  ) : (
    <div ref={rootRef} className="fixed z-30 bottom-4 left-4">
      <CenterButton onClick={() => setShow(!show)} />
      <CenterContentLayout show={show} setShow={setShow}>
        <CenterContent />
      </CenterContentLayout>
    </div>
  );
}
