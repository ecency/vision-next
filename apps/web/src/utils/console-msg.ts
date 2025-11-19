type ConsoleMethod = "log" | "info" | "warn" | "error" | "debug";

export interface ConsoleHistoryEntry {
  level: ConsoleMethod;
  args: string[];
  timestamp: string;
}

const MAX_HISTORY = 50;
const history: ConsoleHistoryEntry[] = [];
const originalConsole: Partial<Record<ConsoleMethod, (...data: any[]) => void>> = {};
let installed = false;

const methods: ConsoleMethod[] = ["log", "info", "warn", "error", "debug"];

const serializeArg = (arg: unknown): string => {
  if (typeof arg === "string") {
    return arg;
  }

  if (arg instanceof Error) {
    const stack = arg.stack ? `\n${arg.stack}` : "";
    return `${arg.name}: ${arg.message}${stack}`;
  }

  if (typeof arg === "number" || typeof arg === "boolean" || arg === undefined || arg === null) {
    return String(arg);
  }

  try {
    return JSON.stringify(arg);
  } catch (e) {
    if (typeof (arg as any)?.toString === "function") {
      return (arg as any).toString();
    }

    return Object.prototype.toString.call(arg);
  }
};

const record = (level: ConsoleMethod, args: unknown[]) => {
  history.push({
    level,
    args: args.map(serializeArg),
    timestamp: new Date().toISOString()
  });

  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
};

export const installConsoleRecorder = () => {
  if (installed || typeof window === "undefined") {
    return;
  }

  installed = true;

  methods.forEach((method) => {
    const original = console[method]?.bind(console) ?? (() => undefined);
    originalConsole[method] = original;

    console[method] = (...args: unknown[]) => {
      try {
        record(method, args);
      } catch (err) {
        originalConsole.error?.("Failed to record console message", err);
      }

      return original(...args);
    };
  });
};

export const getConsoleHistory = (): ConsoleHistoryEntry[] => {
  return history.slice();
};

export const resetConsoleRecorder = () => {
  methods.forEach((method) => {
    const original = originalConsole[method];
    if (original && console[method] !== original) {
      console[method] = original;
    }
  });

  history.splice(0, history.length);
  installed = false;
};
