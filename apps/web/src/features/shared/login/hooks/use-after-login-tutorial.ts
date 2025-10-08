import { PREFIX } from "@/utils/local-storage";
import { useCallback } from "react";
import { useLocalStorage } from "react-use";

export function useAfterLoginTutorial(username: string) {
  const [hadTutorial, setHadTutorial] = useLocalStorage(`${PREFIX}_${username}HadTutorial`);

  return useCallback(() => {
    if (!hadTutorial || hadTutorial !== "true") {
      setHadTutorial("false");
    }
  }, [hadTutorial, setHadTutorial]);
}
