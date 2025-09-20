import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";

interface Props {
  word: string;
  i: number;
}
export function WalletSeedValidationWordItem({ word, i }: Props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${word}-${i}`,
    data: {
      word
    }
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform)
      }}
      {...listeners}
      {...attributes}
      className={clsx(attributes["aria-pressed"] ? "cursor-grabbing" : "cursor-grab")}
    >
      <div
        className={clsx(
          "duration-300 font-mono bg-gray-200 p-2 rounded-xl dark:bg-dark-default",
          attributes["aria-pressed"] && "rotate-6 scale-105 shadow-xl"
        )}
      >
        {word}
      </div>
    </div>
  );
}
