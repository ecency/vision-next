import { useSynchronizedLocalStorage } from "@/utils";
import { PREFIX } from "@/utils/local-storage";
import { useEffect, useState } from "react";
import { useWindowSize } from "react-use";

export function useWavesGrid() {
  const [localGrid, setLocalGrid] = useSynchronizedLocalStorage(PREFIX + "_wg", "feed");
  const [grid, setGrid] = useState(localGrid);

  const { width } = useWindowSize();

  useEffect(() => {
    setGrid(width >= 1024 && localGrid === "masonry" ? "masonry" : "feed");
  }, [localGrid, width]);

  return [grid, setLocalGrid] as const;
}
