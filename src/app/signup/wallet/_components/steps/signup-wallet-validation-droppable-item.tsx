import { useDroppable } from "@dnd-kit/core";
import { SignupWalletValidationWordItem } from "./signup-wallet-validation-word-item";
import clsx from "clsx";

interface Props {
  word: string;
  i: number;
}

export function SignupWalletValidationDroppableItem({ i, word }: Props) {
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
      {word && <SignupWalletValidationWordItem i={i} word={word} />}
    </div>
  );
}
