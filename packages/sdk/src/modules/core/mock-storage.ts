export class MockStorage implements Storage {
  [name: string]: any;

  length: number = 0;

  clear(): void {
    throw new Error("Method not implemented.");
  }

  getItem(key: string): string | null {
    return this[key];
  }

  key(index: number): string | null {
    return Object.keys(this)[index];
  }

  removeItem(key: string): void {
    delete this[key];
  }

  setItem(key: string, value: string): void {
    this[key] = value;
  }
}
