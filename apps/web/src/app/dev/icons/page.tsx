import { notFound } from "next/navigation";
import React from "react";
import {
  UilBell,
  UilCheck,
  UilComment,
  UilHeart,
  UilHistory,
  UilLink,
  UilMultiply,
  UilPen,
  UilSearch,
  UilUpload
} from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { InputGroup } from "@ui/input";
import { VoteChevron } from "@/features/shared/vote-chevron";
import { SliderChevron } from "@/features/shared/slider-chevron";
import { wavesSvg, githubSvg } from "@ui/svg";

// Dev-only icon gallery: the fixed regression target for any PR touching icon
// sizing, slots, or sinks (docs/icons.md). 404s in production.
export default function IconGalleryPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const tiers = [
    ["size-3.5", "14px - dense rows"],
    ["size-4", "16px - default"],
    ["size-5", "20px - toolbars/menus"],
    ["size-6", "24px - card emphasis"]
  ] as const;

  return (
    <div className="p-8 flex flex-col gap-8 max-w-3xl">
      <h1 className="text-xl font-bold">Icon sizing gallery (dev only)</h1>

      <section>
        <h2 className="font-semibold mb-2">Glyph tiers</h2>
        {tiers.map(([cls, label]) => (
          <div key={cls} className="flex items-center gap-3 py-1 border-b border-[--border-color]">
            <code className="w-40 text-xs">{cls}</code>
            <UilHeart className={cls} />
            <UilComment className={cls} />
            <UilCheck className={cls} />
            <UilSearch className={cls} />
            <span className="inline-flex shrink-0 [&>svg]:size-full" style={{ width: 0 }} />
            <span className="text-xs text-gray-steel">{label}</span>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Sanctioned slots (icons carry no class)</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <Button size="xs" icon={<UilPen />}>
            xs = 16
          </Button>
          <Button size="sm" icon={<UilPen />}>
            sm = 20
          </Button>
          <Button icon={<UilPen />}>md = 20</Button>
          <Button size="sm" icon={<UilMultiply className="!size-4" />}>
            !size-4 override
          </Button>
          <Button size="sm" icon={<UilBell className="size-6" />}>
            wrong: plain class (slot must win)
          </Button>
          <InputGroup prepend={<UilSearch />}>
            <input className="form-control" placeholder="InputGroup = 16" readOnly />
          </InputGroup>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Element exports in sized sinks</h2>
        <div className="flex items-center gap-3">
          <span className="inline-flex shrink-0 size-4 [&>svg]:size-full">{githubSvg}</span>
          <span className="inline-flex shrink-0 size-6 [&>svg]:size-full">{wavesSvg}</span>
          <code className="text-xs">size-4 / size-6 sinks</code>
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Exempt (cropped-viewBox chevrons, own sizing)</h2>
        <div className="flex items-center gap-3 [&_svg]:w-3">
          <VoteChevron />
          <SliderChevron direction="up" />
          <SliderChevron direction="down" />
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Standalone examples</h2>
        <div className="flex items-center gap-3">
          <UilHistory className="size-4" aria-hidden={true} />
          <UilLink className="size-5" aria-hidden={true} />
          <UilUpload className="size-6 lg:size-8" aria-hidden={true} />
          <code className="text-xs">size-4 / size-5 / responsive size-6 lg:size-8</code>
        </div>
      </section>
    </div>
  );
}
