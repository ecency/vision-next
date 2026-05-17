"use client";

import { PointerEvent, ReactNode, useRef, useState } from "react";
import i18next from "i18next";

const SWIPE_THRESHOLD = 50;

interface Props {
  slides: ReactNode[];
}

/**
 * Minimal swipable carousel for wallet promo tips. Pointer-drag to switch
 * slides, dot indicators to jump. A single slide renders bare (no chrome) so
 * the carousel is invisible when only one promo is eligible.
 */
export function ProfileWalletPromoCarousel({ slides }: Props) {
  const items = slides.filter(Boolean);
  const [index, setIndex] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);

  if (items.length === 0) {
    return null;
  }

  if (items.length === 1) {
    return <>{items[0]}</>;
  }

  const activeIndex = Math.min(index, items.length - 1);
  const isDragging = dragStartX.current !== null;

  const goTo = (next: number) =>
    setIndex(Math.max(0, Math.min(next, items.length - 1)));

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX;
    setDragDelta(0);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) {
      return;
    }
    setDragDelta(e.clientX - dragStartX.current);
  };

  const endDrag = () => {
    if (dragStartX.current === null) {
      return;
    }
    if (dragDelta <= -SWIPE_THRESHOLD) {
      goTo(activeIndex + 1);
    } else if (dragDelta >= SWIPE_THRESHOLD) {
      goTo(activeIndex - 1);
    }
    dragStartX.current = null;
    setDragDelta(0);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="overflow-hidden touch-pan-y select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="flex items-stretch"
          style={{
            transform: `translateX(calc(${-activeIndex * 100}% + ${dragDelta}px))`,
            transition: isDragging ? "none" : "transform 300ms ease"
          }}
        >
          {items.map((slide, i) => (
            <div key={i} className="min-w-full shrink-0">
              {slide}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={i18next.t("profile-wallet.promo-carousel.go-to-slide", {
              n: i + 1
            })}
            aria-current={i === activeIndex}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-6 bg-blue-dark-sky"
                : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
