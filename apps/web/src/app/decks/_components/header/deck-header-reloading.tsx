import React, { useEffect, useRef } from "react";
import { Spinner } from "@ui/spinner";
import { Button } from "@ui/button";
import { refreshSvg } from "@ui/svg";
import i18next from "i18next";

interface Props {
  onReload: () => void;
  isReloading: boolean;
  updateDataInterval: number;
}

export const DeckHeaderReloading = ({ isReloading, onReload, updateDataInterval }: Props) => {
  const onReloadRef = useRef(onReload);
  useEffect(() => {
    onReloadRef.current = onReload;
  }, [onReload]);

  useEffect(() => {
    const id = setInterval(() => onReloadRef.current(), updateDataInterval);
    return () => clearInterval(id);
  }, [updateDataInterval]);

  return (
    <Button
      appearance="link"
      size="sm"
      onClick={onReload}
      disabled={isReloading}
      icon={isReloading ? <Spinner className="w-4 h-4" /> : refreshSvg}
      iconPlacement="left"
    >
      {i18next.t("decks.reload")}
    </Button>
  );
};
