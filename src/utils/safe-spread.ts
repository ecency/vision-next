export function safeSpread<T>(condition: () => boolean, generator: () => T): T[] {
  if (condition()) {
    return [generator()];
  }

  return [];
}
