"use client";

import { WavesCreateForm, WavesList } from "@/app/waves/_components";

export default function WavesPage() {
  return (
    <div>
      <WavesCreateForm />
      <WavesList />
    </div>
  );
}
