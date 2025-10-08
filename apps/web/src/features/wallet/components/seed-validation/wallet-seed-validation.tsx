import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useSeedPhrase } from "@/features/wallet/sdk";
import i18next from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WalletSeedValidationDroppableItem } from "./wallet-seed-validation-droppable-item";
import { WalletSeedValidationWordItem } from "./wallet-seed=validation-word-item";

interface Props {
  username: string;
  onValidated: () => void;
}

export function WalletSeedValidation({ username, onValidated }: Props) {
  const { data: seed } = useSeedPhrase(username);
  const [validatedWords, setValidatedWords] = useState<string[]>([]);

  const words = useMemo(
    () =>
      (seed as string)
        .split(" ")
        .map((word) => ({ word, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ word }) => word),
    [seed]
  );

  useEffect(
    () =>
      setValidatedWords((seed as string).split(" ").map((word, i) => (i % 4 === 1 ? "" : word))),
    [seed]
  );

  useEffect(() => {
    const words = seed?.split(" ") ?? [];

    if (
      validatedWords.every((word, i) => words[i] === word) &&
      validatedWords.length === words.length
    ) {
      onValidated();
    }
  }, [seed, validatedWords, onValidated]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const droppedWord = e.active.data.current?.word;
    const droppableIndex = e.over?.id;
    if (!droppedWord || typeof droppableIndex !== "number") {
      return;
    }

    setValidatedWords((value) => {
      const temp = [...value];

      const existingWordIndex = temp.indexOf(droppedWord);
      temp[existingWordIndex] = "";
      temp[droppableIndex] = droppedWord;
      return temp;
    });
  }, []);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 w-full">
        <div>
          <div className="text-lg font-semibold">{i18next.t("signup-wallets.validate.title")}</div>
          <div className="opacity-50">{i18next.t("signup-wallets.validate.description")}</div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {validatedWords.map((word, i) => (
            <WalletSeedValidationDroppableItem word={word} key={i} i={i} />
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          {words
            .filter((word) => !validatedWords.includes(word))
            .map((word, i) => (
              <WalletSeedValidationWordItem i={i} word={word} key={word} />
            ))}
        </div>
      </div>
    </DndContext>
  );
}
