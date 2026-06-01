import { describe, it, expect } from "vitest";
import { isEmptyCaptureEvent } from "@/utils/sentry-empty-capture";

const exc = (value: unknown, frames: unknown[] = []) => ({
  exception: { values: [{ value: value as string, stacktrace: { frames } }] }
});

describe("isEmptyCaptureEvent", () => {
  it("drops value-less, frame-less captures (captureException(null/undefined/''))", () => {
    expect(isEmptyCaptureEvent(exc("null"))).toBe(true);
    expect(isEmptyCaptureEvent(exc("undefined"))).toBe(true);
    expect(isEmptyCaptureEvent(exc(""))).toBe(true);
    expect(isEmptyCaptureEvent(exc("   "))).toBe(true);
    expect(isEmptyCaptureEvent(exc(undefined))).toBe(true);
  });

  // Guardrail: never drop a real bug.
  it("KEEPS a non-Error thrown with a message (e.g. `throw 'boom'`)", () => {
    expect(isEmptyCaptureEvent(exc("boom"))).toBe(false);
    expect(isEmptyCaptureEvent(exc("Something went wrong"))).toBe(false);
  });

  it("KEEPS any exception that has a stack (a real thrown Error)", () => {
    expect(isEmptyCaptureEvent(exc("", [{ filename: "app.js", lineno: 1 }]))).toBe(false);
    expect(isEmptyCaptureEvent(exc("null", [{ filename: "x.js" }]))).toBe(false);
  });

  it("KEEPS frame-less real errors like AbortController timeouts", () => {
    expect(isEmptyCaptureEvent(exc("signal timed out"))).toBe(false);
    expect(isEmptyCaptureEvent(exc("The user aborted a request."))).toBe(false);
  });

  it("KEEPS non-exception events (messages, transactions)", () => {
    expect(isEmptyCaptureEvent({})).toBe(false);
    expect(isEmptyCaptureEvent({ exception: { values: [] } })).toBe(false);
  });

  it("only drops when EVERY exception value is empty + frame-less", () => {
    // chained exceptions: one empty, one real -> keep
    expect(
      isEmptyCaptureEvent({
        exception: {
          values: [
            { value: "null", stacktrace: { frames: [] } },
            { value: "Real cause", stacktrace: { frames: [{ filename: "a.js" }] } }
          ]
        }
      })
    ).toBe(false);
  });
});
