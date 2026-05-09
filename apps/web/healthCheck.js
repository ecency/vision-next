// Container healthcheck script invoked by Docker HEALTHCHECK.
//
// Hits the watchdog worker's /health endpoint (port 3030 by default) instead
// of the main Next.js port. The watchdog runs on a separate libuv event loop
// so its response time isn't affected by queue starvation on the main thread
// during traffic spikes. It only fails when the main thread has actually
// stopped sending heartbeats — i.e. Node is genuinely dead, not just slow.
//
// Setting HEALTHCHECK_PORT=0 disables the watchdog HTTP server (in
// event-loop-monitor.ts) and makes this script fall back to the legacy
// in-band port-3000 /api/healthcheck.
const http = require("http");

const rawPort = process.env.HEALTHCHECK_PORT;
const inBand = rawPort === "0";
const port = inBand ? "3000" : (rawPort || "3030");

const options = inBand
  ? { host: "127.0.0.1", port, path: "/api/healthcheck", timeout: 9000 }
  : { host: "127.0.0.1", port, path: "/health", timeout: 5000 };

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode == 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on("error", function (err) {
  console.log("ERROR");
  process.exit(1);
});

request.end();
