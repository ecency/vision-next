// Standalone Cloudflare Turnstile widget for the mobile app's WebView.
//
// Served as a self-contained static HTML document instead of a Next.js page:
// the page variant pulled the entire app shell (providers, dozens of script
// chunks) into a ~76px WebView just to render one widget, and iOS WKWebView
// kills the web content process under that memory pressure, leaving a
// permanently blank widget. A hosted first-party URL is still required — the
// sitekey is bound to ecency.com and the Managed challenge needs a genuine
// origin and storage partition (an inline-HTML WebView with a faked baseUrl
// stalls on "Verifying…" forever on iOS).
//
// The token is bridged back to React Native via
// window.ReactNativeWebView.postMessage as {type: "verify"|"expire"|"error"};
// the native side passes it to signUp() and it is verified server-side.

// Public sitekey (Managed mode); the secret never reaches the client.
const TURNSTILE_SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || "0x4AAAAAADe6jH7FIi9dBzgR";

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<meta name="robots" content="noindex, nofollow"/>
<title>Turnstile</title>
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body { display: flex; align-items: center; justify-content: center; min-height: 72px; }
  #status { font: 13px -apple-system, system-ui, sans-serif; color: #788187; }
  #status a { color: #357ce6; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
<div id="widget"><span id="status">Loading verification&hellip;</span></div>
<script>
  function post(message) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }
  // A script-load failure is handled locally on purpose: posting {type:"error"}
  // over the bridge makes the native side remount the WebView, which refetches
  // this same failing resource in a tight loop. The register button stays
  // disabled (no token) until the user retries. The retry link must not use a
  // javascript: href — the host WebView's origin whitelist blocks non-https
  // navigations.
  function showRetry() {
    document.getElementById("widget").innerHTML =
      '<span id="status">Verification failed to load. <a href="#" onclick="event.preventDefault();location.reload()">Retry</a></span>';
  }
  window.onTurnstileLoad = function () {
    var status = document.getElementById("status");
    if (status) status.remove();
    window.turnstile.render("#widget", {
      sitekey: ${JSON.stringify(TURNSTILE_SITEKEY)},
      callback: function (token) { post({ type: "verify", token: token }); },
      "expired-callback": function () { post({ type: "expire" }); },
      "error-callback": function () { post({ type: "error" }); }
    });
  };
</script>
<script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit"
  async defer onerror="showRetry()"></script>
</body>
</html>
`;

export function GET() {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Keep the document fresh and out of edge/browser caches and indexes.
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      // Lock the document down to the Turnstile challenge platform; the inline
      // bootstrap script and style block need 'unsafe-inline'.
      "Content-Security-Policy":
        "default-src 'none'; script-src 'unsafe-inline' https://challenges.cloudflare.com; " +
        "frame-src https://challenges.cloudflare.com; connect-src https://challenges.cloudflare.com; " +
        "style-src 'unsafe-inline'; img-src data: https://challenges.cloudflare.com; " +
        "base-uri 'none'; form-action 'none'"
    }
  });
}
