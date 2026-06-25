import { describe, it, expect } from "vitest";
import { beforeSend } from "@/utils/sentry-before-send";

type Ev = Parameters<typeof beforeSend>[0];

function makeEvent(
  value: string,
  frames: { filename?: string; function?: string }[] = [],
  opts: { type?: string; handled?: boolean } = {}
): Ev {
  return {
    exception: {
      values: [
        {
          type: opts.type ?? "TypeError",
          value,
          stacktrace: { frames },
          ...(opts.handled !== undefined
            ? { mechanism: { type: "onunhandledrejection", handled: opts.handled } }
            : {})
        }
      ]
    }
  } as unknown as Ev;
}

const WEBPACK_FRAME = {
  filename: "app:///_next/static/chunks/webpack-9732e1c31d36b1a3.js"
};
const APP_FRAME = { filename: "app:///_next/static/chunks/app/page.js" };

describe("beforeSend — deploy-skew reclassification", () => {
  // The post-deploy cluster (ECENCY-NEXT-1FPK/1FPM/1FPN/1FPJ): a stale tab's
  // async chunk import rejects, surfacing as onunhandledrejection that bypasses
  // the React render boundaries. beforeSend must fold these into the single
  // low-severity skew issue instead of letting them spawn fresh error issues.
  it("reclassifies the Firefox webpack-factory rejection (e[c] is undefined)", () => {
    const ev = makeEvent('can\'t access property "call", e[c] is undefined', [APP_FRAME, WEBPACK_FRAME], {
      handled: false
    });
    const out = beforeSend(ev);
    expect(out).not.toBeNull();
    expect(out!.level).toBe("warning");
    expect(out!.tags?.deploy_skew).toBe("true");
    expect(out!.fingerprint).toEqual(["deploy-skew-auto-recovered"]);
  });

  it("reclassifies the Chrome webpack-factory rejection (reading 'call')", () => {
    const ev = makeEvent("Cannot read properties of undefined (reading 'call')", [WEBPACK_FRAME], {
      handled: false
    });
    const out = beforeSend(ev);
    expect(out!.level).toBe("warning");
    expect(out!.fingerprint).toEqual(["deploy-skew-auto-recovered"]);
  });

  it("reclassifies the Safari webpack-factory rejection (evaluating 'x.call')", () => {
    const ev = makeEvent("undefined is not an object (evaluating 'e.call')", [WEBPACK_FRAME], {
      handled: false
    });
    const out = beforeSend(ev);
    expect(out!.level).toBe("warning");
    expect(out!.fingerprint).toEqual(["deploy-skew-auto-recovered"]);
  });

  it("reclassifies chunk-load failures even with no stack frames", () => {
    const ev = makeEvent("ChunkLoadError: Loading chunk 482 failed", [], { type: "ChunkLoadError" });
    expect(beforeSend(ev)!.fingerprint).toEqual(["deploy-skew-auto-recovered"]);
  });

  it("does NOT reclassify a real `.call of undefined` app bug with no webpack frame", () => {
    const ev = makeEvent("Cannot read properties of undefined (reading 'call')", [APP_FRAME]);
    const out = beforeSend(ev);
    expect(out).not.toBeNull();
    expect(out!.level).toBeUndefined();
    expect(out!.fingerprint).toBeUndefined();
  });
});

describe("beforeSend — RC exhaustion is dropped as expected user condition", () => {
  it("drops the raw RPCError even when UNHANDLED (onunhandledrejection)", () => {
    const ev = makeEvent(
      "payer has not enough RC mana for transaction:has_mana: Account: ai-operator has 81178628 RC, needs 106812114 RC. Please wait to transact or power up HIVE.",
      [],
      { type: "RPCError", handled: false }
    );
    expect(beforeSend(ev)).toBeNull();
  });

  it("drops the legacy 'Insufficient Resource Credits' phrasing", () => {
    expect(beforeSend(makeEvent("Insufficient Resource Credits"))).toBeNull();
  });

  it("drops the 'needs <N> RC' phrasing", () => {
    expect(beforeSend(makeEvent("RPCError: ... has 1 RC, needs 248319953 RC ..."))).toBeNull();
  });

  it("anchors has_mana to the assertion form (has_mana:) and does not over-filter a bare substring", () => {
    expect(beforeSend(makeEvent("Assert Exception: transaction:has_mana: Account x"))).toBeNull();
    // A future unrelated error merely containing the substring must NOT be dropped.
    const unrelated = makeEvent("has_mana_check skipped", [APP_FRAME]);
    expect(beforeSend(unrelated)).toBe(unrelated);
  });

  it("keeps an ordinary application error untouched", () => {
    const ev = makeEvent("TypeError: cannot read foo of bar", [APP_FRAME]);
    expect(beforeSend(ev)).toBe(ev);
  });
});

describe("beforeSend — $RS hydration-resume reclassification", () => {
  // A React #418 text mismatch regenerates the subtree; React's $RS streaming-
  // resume script then throws on the removed node. Self-healed noise — reclassify
  // to one fingerprinted warning (NOT dropped), so a genuine hydration regression
  // still surfaces. Sentry groups $RS by the permlink, so the frame carries it.
  const RS_FRAME = {
    function: "$RS",
    filename: "app:///@storicious/re-barski-202662t14550715z"
  } as unknown as { filename?: string };

  it("reclassifies Firefox minified 'b is null' inside a $RS frame", () => {
    const out = beforeSend(makeEvent("b is null", [RS_FRAME]));
    expect(out).not.toBeNull();
    expect(out!.level).toBe("warning");
    expect(out!.tags?.hydration_autorecovered).toBe("true");
    expect(out!.fingerprint).toEqual(["hydration-rs-autorecovered"]);
  });

  it("reclassifies the Chrome MINIFIED single-letter null read inside $RS", () => {
    // Exercises the isMinifiedNull second branch specifically (the minified
    // resume var, not the literal 'parentNode' covered by isParentNodeNull).
    const out = beforeSend(makeEvent("Cannot read properties of null (reading 'b')", [RS_FRAME]));
    expect(out!.fingerprint).toEqual(["hydration-rs-autorecovered"]);
    expect(out!.level).toBe("warning");
  });

  it("reclassifies the literal parentNode-null phrasing inside $RS (isParentNodeNull)", () => {
    const out = beforeSend(
      makeEvent("Cannot read properties of null (reading 'parentNode')", [RS_FRAME])
    );
    expect(out!.fingerprint).toEqual(["hydration-rs-autorecovered"]);
  });

  it("does NOT over-match a multi-char null read even with a $RS frame", () => {
    // The narrowed single-char regex must leave a real "(reading 'document')"
    // bug as an error, even if a $RS frame happens to be on the stack.
    const ev = makeEvent("Cannot read properties of null (reading 'document')", [RS_FRAME]);
    expect(beforeSend(ev)).toBe(ev);
    expect(ev.level).toBeUndefined();
    expect(ev.fingerprint).toBeUndefined();
  });

  it("does NOT touch a real 'b is null' app bug with no $RS frame", () => {
    const ev = makeEvent("b is null", [APP_FRAME]);
    expect(beforeSend(ev)).toBe(ev);
    expect(ev.level).toBeUndefined();
    expect(ev.fingerprint).toBeUndefined();
  });
});

describe("beforeSend — Chrome botnet 'document' access is dropped", () => {
  // Synthetic botnet handler reads .document off a null/undefined receiver.
  // Two real Chrome grammars must both be dropped, but only for 'document'.
  const BOTNET_FRAME = { function: "HTMLDocument.c" } as unknown as { filename?: string };

  it("drops the modern plural format (Chrome 91+)", () => {
    const ev = makeEvent("Cannot read properties of null (reading 'document')", [BOTNET_FRAME]);
    expect(beforeSend(ev)).toBeNull();
  });

  it("drops the old singular format (Chrome ≤90 / Chrome Mobile 79)", () => {
    const ev = makeEvent("Cannot read property 'document' of null", [BOTNET_FRAME]);
    expect(beforeSend(ev)).toBeNull();
  });

  it("drops the 'undefined' variant of the singular format", () => {
    const ev = makeEvent("Cannot read property 'document' of undefined", [BOTNET_FRAME]);
    expect(beforeSend(ev)).toBeNull();
  });

  it("does NOT over-match a different property (parentNode) with the same frame", () => {
    // Guards the document-only intent: making the (reading '…') clause loose
    // would wrongly sweep up parentNode null-reads too.
    const ev = makeEvent("Cannot read properties of null (reading 'parentNode')", [BOTNET_FRAME]);
    expect(beforeSend(ev)).toBe(ev);
  });

  it("does NOT drop the document read without the synthetic botnet frame", () => {
    const ev = makeEvent("Cannot read properties of null (reading 'document')", [APP_FRAME]);
    expect(beforeSend(ev)).toBe(ev);
  });
});

describe("beforeSend — webkit.messageHandlers (non-WKWebView) is dropped", () => {
  // ECENCY-NEXT-1GE4: window.webkit exists only inside Apple's WKWebView, so the
  // external native-bridge helper sendDataToNative throws when the page runs in a
  // non-WKWebView (e.g. the Facebook in-app browser on iOS). Not an Ecency app
  // bug — dropped as noise. Requires BOTH the message and a sendDataToNative
  // stack frame so unrelated errors are never swept up.
  const MSG = "undefined is not an object (evaluating 'window.webkit.messageHandlers')";
  const NATIVE_FRAME = { function: "sendDataToNative", filename: APP_FRAME.filename };

  it("drops the webkit.messageHandlers TypeError thrown from sendDataToNative", () => {
    expect(beforeSend(makeEvent(MSG, [NATIVE_FRAME]))).toBeNull();
  });

  it("does NOT drop a webkit.messageHandlers error that lacks a sendDataToNative frame", () => {
    const ev = makeEvent(MSG, [APP_FRAME]);
    expect(beforeSend(ev)).toBe(ev);
  });

  it("does NOT drop an unrelated error coming from a sendDataToNative frame", () => {
    const ev = makeEvent("TypeError: foo is not a function", [NATIVE_FRAME]);
    expect(beforeSend(ev)).toBe(ev);
  });
});

describe("beforeSend — synthetic DOM Event capture is dropped", () => {
  // ECENCY-NEXT-1F6Y: captureException handed a DOM `Event`/`ErrorEvent` instead
  // of an Error (failed resource load onerror, or a promise rejected with the raw
  // browser event). The SDK wraps the non-Error input as a SYNTHETIC exception
  // whose `type` is the DOM interface name and whose only frame is its own capture
  // call. No app frame, no actionable info, overwhelmingly bot/crawler traffic —
  // dropped as noise. Requires BOTH the DOM type AND the synthetic flag.
  function makeSynthetic(
    type: "Event" | "ErrorEvent",
    opts: { synthetic?: boolean; frames?: { filename?: string }[] } = {}
  ): Ev {
    return {
      exception: {
        values: [
          {
            type,
            value: `Event \`${type}\` (type=error) captured as exception`,
            stacktrace: { frames: opts.frames ?? [{ filename: "@sentry/core/exports.js" }] },
            mechanism: { type: "generic", handled: true, synthetic: opts.synthetic ?? true }
          }
        ]
      }
    } as unknown as Ev;
  }

  it("drops a synthetic DOM Event captured as exception", () => {
    expect(beforeSend(makeSynthetic("Event"))).toBeNull();
  });

  it("drops a synthetic ErrorEvent captured as exception", () => {
    expect(beforeSend(makeSynthetic("ErrorEvent"))).toBeNull();
  });

  it("does NOT drop a DOM-Event-typed exception that is NOT synthetic", () => {
    // Without the synthetic flag we can't be sure the SDK fabricated it from a
    // non-Error input, so keep it rather than risk dropping a real capture.
    const ev = makeSynthetic("Event", { synthetic: false, frames: [APP_FRAME] });
    expect(beforeSend(ev)).toBe(ev);
  });

  it("does NOT drop a synthetic capture whose type is a real Error", () => {
    // `synthetic: true` alone (e.g. a captured non-Error string/object the app
    // threw with context) must NOT be swept up — only DOM Event types are.
    const ev = {
      exception: {
        values: [
          {
            type: "TypeError",
            value: "boom",
            stacktrace: { frames: [APP_FRAME] },
            mechanism: { type: "generic", handled: true, synthetic: true }
          }
        ]
      }
    } as unknown as Ev;
    expect(beforeSend(ev)).toBe(ev);
  });
});
