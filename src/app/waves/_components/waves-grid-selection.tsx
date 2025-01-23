import { UilGrid, UilListUiAlt } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import i18next from "i18next";
import { useWavesGrid } from "@/app/waves/_hooks";

export function WavesGridSelection() {
  const [grid, setGrid] = useWavesGrid();

  return (
    <Dropdown>
      <DropdownToggle>
        <Button icon={grid === "masonry" ? <UilGrid /> : <UilListUiAlt />} appearance="gray-link">
          {i18next.t("g.view")}
        </Button>
      </DropdownToggle>
      <DropdownMenu align="right">
        <DropdownItemWithIcon
          icon={<UilGrid />}
          label="Masonry grid"
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
