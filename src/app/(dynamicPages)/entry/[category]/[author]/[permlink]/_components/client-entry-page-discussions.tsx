"use client";
import dynamic from "next/dynamic";
import { Entry } from "@/entities";

const EntryPageDiscussions = dynamic<{ entry: Entry; category: string }>(
    () => import("./entry-page-discussions"),
    { ssr: false, loading: () => <div style={{ height: "4rem" }} /> }
);

export default EntryPageDiscussions;
