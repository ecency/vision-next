import React, { useEffect } from "react";
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
  useEffect(() => {
    const id = setInterval(onReload, updateDataInterval);
    return () => clearInterval(id);
  }, [onReload, updateDataInterval]);

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
