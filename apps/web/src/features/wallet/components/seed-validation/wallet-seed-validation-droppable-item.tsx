import { useDroppable } from "@dnd-kit/core";
import { WalletSeedValidationWordItem } from "./wallet-seed=validation-word-item";
import clsx from "clsx";

interface Props {
  word: string;
  i: number;
}

export function WalletSeedValidationDroppableItem({ i, word }: Props) {
  const { setNodeRef: droppableRef, isOver } = useDroppable({
    id: i
  });

  return (
    <div
      ref={droppableRef}
      className={clsx(
        "border p-2 rounded-xl flex items-center gap-4 justify-start h-[58px]",
        isOver ? "border-blue-dark-sky" : "border-[--border-color]"
      )}
    >
      <span className="opacity-50">{i + 1}</span>
      {word && <WalletSeedValidationWordItem i={i} word={word} />}
    </div>
  );
}
