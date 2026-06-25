import type * as Sentry from "@sentry/nextjs";
import { isEmptyCaptureEvent } from "./sentry-empty-capture";
import { isDeploySkewError } from "./deploy-skew";

// Derive the exact event type Sentry's `beforeSend` hook receives, so this stays
// in lockstep with the SDK without a runtime import of @sentry/nextjs here.
type SentryErrorEvent = Parameters<NonNullable<Sentry.BrowserOptions["beforeSend"]>>[0];

/**
 * The single Sentry `beforeSend` hook for the web client — the only place EVERY
 * event passes through (render-boundary captures, global handlers, and the
 * early-error buffer all funnel here). Extracted from sentry.client.config.ts so
 * its filtering/reclassification rules are unit-testable.
 *
 * Returns the (possibly mutated) event to send, or `null` to drop it.
 */
export function beforeSend(event: SentryErrorEvent): SentryErrorEvent | null {
  // Drop value-less captures — captureException(null/undefined/"") produces a
  // synthetic exception with no message and no stack frames (zero actionable
  // info, all grouped as the "<unknown>" issue). Only empty + frame-less
  // events are dropped, so real errors (which always carry a stack or a
  // message) are never lost. See sentry-empty-capture for the exact rule.
  if (isEmptyCaptureEvent(event)) {
    return null;
  }

  const exceptionType = event.exception?.values?.[0]?.type ?? "";
  const message = event.exception?.values?.[0]?.value ?? "";
  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
  const stackStr = JSON.stringify(frames);

  // ECENCY-NEXT-1F6Y: a DOM `Event`/`ErrorEvent` handed to captureException
  // instead of an Error. A failed resource load (<img>/<script>/<link> firing
  // `onerror`) or a promise rejected with the raw browser event reaches the SDK,
  // which wraps the non-Error input as a SYNTHETIC exception whose `type` is the
  // DOM interface name ("Event"/"ErrorEvent") and whose only frame is the SDK's
  // own capture call (no app frame, no actionable info). These are environmental
  // — overwhelmingly bot/crawler traffic failing resource fetches on post pages,
  // never an Ecency bug — and were the project's #1-volume issue, repeatedly
  // tripping the "Critical errors" alert. You never `throw new Event()`, so a real
  // error can't carry this type; we additionally require the `synthetic` flag so a
  // (hypothetical) deliberately-captured Event with real context is still kept.
  if (
    (exceptionType === "Event" || exceptionType === "ErrorEvent") &&
    event.exception?.values?.[0]?.mechanism?.synthetic
  ) {
    return null;
  }

  // Deploy/version skew: a stale tab requests a chunk whose module id changed in
  // a newer build, so the webpack runtime is handed an undefined module factory
  // (Chrome "reading 'call'", Firefox "e[c] is undefined", Safari "evaluating
  // 'e[c].call'") or a dynamic import fails. The render-boundary paths
  // (global-error.tsx, SentryErrorBoundary) already reclassify these to a single
  // low-severity "deploy-skew-auto-recovered" issue and reload — but a skew error
  // thrown from an async chunk import surfaces as `onunhandledrejection`, which
  // Sentry's GlobalHandlers integration captures DIRECTLY, bypassing those
  // boundaries and spawning a fresh error-level issue after every deploy. This is
  // the only hook that sees that path, so reclassify here too into the SAME shape
  // (so the events merge with the boundary-caught twin instead of grouping anew).
  // isDeploySkewError matches on `stack`; beforeSend frames carry `filename`, so
  // join them into a newline string. The webpack-<hash>.js frame requirement in
  // the matcher keeps this off ordinary ".call of undefined" app bugs. We keep
  // the event (at warning level) rather than dropping it so skew frequency and
  // release-spread stay visible.
  const skewCandidate = {
    message,
    stack: frames.map((f) => f.filename ?? "").join("\n")
  };
  if (isDeploySkewError(skewCandidate)) {
    event.level = "warning";
    event.tags = { ...event.tags, deploy_skew: "true" };
    event.fingerprint = ["deploy-skew-auto-recovered"];
    return event;
  }

  // ECENCY-NEXT-1AA7: an injected page script (pageHook.js / __mm__updateUrl)
  // JSON.stringify'ing a DOM node. Gate on the injected-script frame so a real
  // app-side circular-stringify bug (different frames) is still reported.
  if (
    /Converting circular structure to JSON/i.test(message) &&
    /pageHook|__mm__/i.test(stackStr)
  ) {
    return null;
  }

  // Hive RC (Resource Credits) exhaustion is an EXPECTED user condition, never an
  // Ecency bug: the user's own account is temporarily out of mana, so the chain
  // rejects the broadcast. The node phrases it several ways ("payer has not enough
  // RC mana ... has_mana", "Please wait to transact or power up HIVE", "needs <N>
  // RC"); the app normalizes all of them to an "Insufficient Resource Credits"
  // toast. Drop ALL of these regardless of the handled flag — un-awaited broadcast
  // call sites (e.g. the vote slider) surface them as `onunhandledrejection`
  // (handled=false), which the earlier "Insufficient Resource Credits"-only,
  // handled-only guard never matched (the raw RPCError carries none of that text).
  // None of these phrases appear in app code, so over-filter risk is nil.
  if (
    /has not enough RC mana|has_mana:|Insufficient Resource Credits|Please wait to transact|needs \d+ RC/i.test(
      message
    )
  ) {
    return null;
  }

  // AbortController-induced timeouts (TimeoutError / AbortError) ship
  // with no stack frames, so we can't tell which fetch is at fault.
  // Walk recent breadcrumbs for the last in-flight fetch URL and tag
  // the event so we can correlate timeouts to specific endpoints.
  // Trigger only on the canonical AbortController error names plus the
  // standard "signal timed out" phrase — a broader /aborted/i match
  // would also tag unrelated paths (transaction aborts, stream aborts).
  if (
    (exceptionType === "TimeoutError" ||
      exceptionType === "AbortError" ||
      /signal timed out/i.test(message)) &&
    !event.tags?.timeoutUrl
  ) {
    const crumbs = event.breadcrumbs ?? [];
    for (let i = crumbs.length - 1; i >= 0; i--) {
      const c = crumbs[i];
      const rawUrl = (c.data as { url?: string } | undefined)?.url;
      if (
        (c.category === "fetch" || c.category === "xhr") &&
        typeof rawUrl === "string"
      ) {
        // Strip query/hash before tagging — request URLs can carry
        // tokens or identifiers we don't want as searchable telemetry.
        let safeUrl: string;
        try {
          const parsed = new URL(rawUrl, window.location.origin);
          safeUrl = `${parsed.origin}${parsed.pathname}`;
        } catch {
          safeUrl = rawUrl.split(/[?#]/)[0] ?? "";
        }
        if (safeUrl) {
          event.tags = { ...event.tags, timeoutUrl: safeUrl.slice(0, 200) };
        }
        break;
      }
    }
  }

  // React 19 SSR streaming-resume ($RS) crash that FOLLOWS a hydration mismatch.
  // React #418 (text-content mismatch — commonly a browser extension or
  // auto-translate rewriting text on legacy/non-English browsers, or a residual
  // SSR locale/Date drift) tears the subtree down and regenerates it CLIENT-SIDE,
  // so the user still gets a working page; React's $RS inline resume script then
  // can't find its now-removed node and throws. Phrasings seen across engines:
  //   Chrome ≤116  "Cannot read property 'parentNode' of null"
  //   Chrome 117+  "Cannot read properties of null (reading 'parentNode')"
  //   Firefox      `can't access property "parentNode", a is null`
  //   Firefox min. "b is null"  (the resume var is minified to a single letter)
  //   Safari       "null is not an object (evaluating 'a.parentNode')"
  // RECLASSIFY (not drop) to ONE low-severity, fingerprinted issue. Sentry groups
  // $RS by the permlink in its argument, so each post page would otherwise spawn a
  // fresh error-level issue. Reclassifying stops that per-permlink spam and marks
  // it auto-recovered, while leaving the underlying #418 fully visible — so a
  // GENUINE hydration regression would still surface as a spike on this
  // fingerprint across many users/pages. The $RS-frame requirement keeps this off
  // ordinary null-access app bugs (those have no $RS in the stack).
  const isParentNodeNull =
    message.includes("reading 'parentNode'") ||
    message.includes("property 'parentNode'") ||
    message.includes('"parentNode"') ||
    /null is not an object \(evaluating '[a-z]\.parentNode'\)/.test(message);
  const isMinifiedNull =
    /^[a-z] is null$/i.test(message) || // Firefox minified "b is null"
    // Chrome minified twin — single-char property name only (the $RS resume var
    // is minified to one letter, e.g. "reading 'b'"). Multi-char names like
    // 'document'/'innerHTML' are intentionally NOT matched, so an unrelated
    // null-access that merely co-occurs with a $RS frame stays a real error.
    /Cannot read properties of null \(reading '[a-z$]'\)/i.test(message);
  if ((isParentNodeNull || isMinifiedNull) && stackStr.includes("$RS")) {
    event.level = "warning";
    event.tags = { ...event.tags, hydration_autorecovered: "true" };
    event.fingerprint = ["hydration-rs-autorecovered"];
    return event;
  }

  // Firefox-specific iframe teardown error following a React hydration
  // mismatch (#418) on profile pages. Symptom — when hydration fails,
  // React tears down the tree and an iframe's contentWindow becomes null
  // while some downstream code still tries to access .document on it.
  // V8-based engines produce a different message for the same access
  // (`Cannot read properties of null (reading 'document')`) so matching
  // on the Firefox phrasing alone is engine-specific, but we *also*
  // require browser=Firefox and a profile-page URL so unrelated iframe
  // bugs in other surfaces aren't silently dropped. Sample 1% to keep
  // trend visibility.
  // TODO(hydration): investigate Firefox-only hydration drift on profile
  // pages (`/@user/...`) — likely a locale/Date/Intl mismatch or a value
  // that differs between SSR and the first client render.
  // event.contexts is loosely typed by @sentry/types; coerce to string.
  const browserName = String(event.contexts?.browser?.name ?? "");
  const url = String(event.request?.url ?? "");
  if (
    message.includes("can't access property \"document\"") &&
    message.includes("contentWindow is null") &&
    /Firefox/i.test(browserName) &&
    /\/@/.test(url) &&
    Math.random() > 0.01
  ) {
    return null;
  }

  // Chrome botnet traffic - null/undefined document access from synthetic handler.
  // Two real Chrome grammars, both specific to the 'document' property:
  //   old singular (Chrome ≤90 / Chrome Mobile 79):
  //     "Cannot read property 'document' of null"   (name BEFORE "of null")
  //   modern plural (Chrome 91+):
  //     "Cannot read properties of null (reading 'document')"
  // Kept document-only on purpose: a different property (e.g. parentNode) in
  // either grammar must NOT be swept up here — those are handled elsewhere.
  if (
    /Cannot read (?:property 'document' of (?:null|undefined)|properties of (?:null|undefined) \(reading 'document'\))/.test(
      message
    ) &&
    stackStr.includes("HTMLDocument.c")
  ) {
    return null;
  }

  // Network issues corrupting JS chunk downloads
  if (
    /^SyntaxError/.test(exceptionType) &&
    /Unexpected (end of input|token)/.test(message) &&
    /chunks?[/\\-]/.test(stackStr)
  ) {
    return null;
  }

  // ECENCY-NEXT-1GE4: sendDataToNative accesses window.webkit.messageHandlers
  // without guarding for its existence. This object is only present inside
  // Apple's WKWebView (the Ecency native iOS app); the Facebook in-app browser
  // on iOS is NOT a WKWebView, so window.webkit is undefined there and the
  // unguarded property access throws. This is a known environment mismatch,
  // not an Ecency app bug — drop it to avoid noise.
  if (
    message.includes("window.webkit.messageHandlers") &&
    stackStr.includes("sendDataToNative")
  ) {
    return null;
  }

  return event;
}
