import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { Client } from "@hiveio/dhive";

const SERVERS = [
  "https://api.hive.blog",
  "https://api.openhive.network",
  "https://hapi.ecency.com",
  "https://rpc.mahdiyari.info",
  "https://api.deathwing.me",
  "https://api.syncad.com",
  "https://anyx.io",
  "https://api.c0ff33a.uk",
  "https://hive-api.3speak.tv",
  "https://techcoderx.com",
  "https://hived.emre.sh",
  "https://api.hive.blue",
];

(window as any).dHiveClient = new Client(SERVERS, {
  timeout: 2000,
  failoverThreshold: 2,
  consoleOnFailover: true,
});

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
