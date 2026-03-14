import { describe, it, expect } from 'vitest';
import { deepClone, updateNestedPath } from './utils';

describe('deepClone', () => {
  it('creates a deep copy of an object', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
  });

  it('preserves immutability — modifying clone does not affect original', () => {
    const original = { a: { b: 1 } };
    const cloned = deepClone(original);
    cloned.a.b = 99;
    expect(original.a.b).toBe(1);
  });

  it('handles arrays', () => {
    const original = { items: [1, 2, 3] };
    const cloned = deepClone(original);
    cloned.items.push(4);
    expect(original.items).toEqual([1, 2, 3]);
  });

  it('handles null values', () => {
    const original = { a: null };
    const cloned = deepClone(original);
    expect(cloned.a).toBeNull();
  });
});

describe('updateNestedPath', () => {
  it('updates a top-level key', () => {
    const obj = { name: 'old' };
    const result = updateNestedPath(obj, 'name', 'new');
    expect(result.name).toBe('new');
    // Original unchanged
    expect(obj.name).toBe('old');
  });

  it('updates a nested key', () => {
    const obj = { a: { b: { c: 1 } } };
    const result = updateNestedPath(obj as any, 'a.b.c', 42);
    expect((result as any).a.b.c).toBe(42);
  });

  it('creates intermediate objects if they do not exist', () => {
    const obj = {};
    const result = updateNestedPath(obj, 'x.y.z', 'created');
    expect((result as any).x.y.z).toBe('created');
  });

  it('overwrites non-object intermediate values', () => {
    const obj = { a: 'string' };
    const result = updateNestedPath(obj as any, 'a.b', 'value');
    expect((result as any).a.b).toBe('value');
  });

  it('does not mutate the original object', () => {
    const obj = { a: { b: 1 } };
    updateNestedPath(obj as any, 'a.b', 2);
    expect(obj.a.b).toBe(1);
  });
});
