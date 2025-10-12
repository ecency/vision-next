import { UilGrid, UilListUiAlt } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import i18next from "i18next";
import { useWavesGrid } from "@/app/waves/_hooks";

export function WavesGridSelection() {
  const [grid, setGrid] = useWavesGrid();

  const viewLabel = i18next.t("g.view");
  const activeLabel = grid === "masonry" ? "Masonry" : i18next.t("g.feed");

  return (
    <Dropdown className="hidden lg:block">
      <DropdownToggle>
        <Button
          icon={grid === "masonry" ? <UilGrid /> : <UilListUiAlt />}
          appearance="gray-link"
          size="sm"
          aria-label={`${viewLabel}: ${activeLabel}`}
          title={`${viewLabel}: ${activeLabel}`}
          className="!px-1"
        >
          <span className="sr-only">{`${viewLabel}: ${activeLabel}`}</span>
        </Button>
      </DropdownToggle>
      <DropdownMenu align="right">
        <DropdownItemWithIcon
          icon={<UilGrid />}
          label="Masonry"
          onClick={() => setGrid("masonry")}
        />
        <DropdownItemWithIcon
          className="capitalize"
          icon={<UilListUiAlt />}
          label={i18next.t("g.feed")}
          onClick={() => setGrid("feed")}
        />
      </DropdownMenu>
    </Dropdown>
  );
}
