import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import { routeTree } from "./routeTree.gen";
import { InstanceConfigManager } from "./core";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

InstanceConfigManager.getConfigValue(
  ({ configuration }) => configuration.general.styles.background
)
  .split(" ")
  .forEach((className) => {
    document.body.classList.add(className);
  });

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
