import { describe, it, expect } from 'vitest';
import { createContext } from '../src/context';

describe('Context', () => {
  it('should create a context with default value', () => {
    const defaultValue = { test: 'value' };
    const context = createContext(defaultValue);

    expect(context._defaultValue).toEqual(defaultValue);
    expect(typeof context._contextId).toBe('symbol');
  });

  it('should create a Provider function', () => {
    const context = createContext('default');
    expect(typeof context.Provider).toBe('function');
  });

  it('should create unique context IDs', () => {
    const ctx1 = createContext('a');
    const ctx2 = createContext('b');

    expect(ctx1._contextId).not.toBe(ctx2._contextId);
  });

  it('should create Provider that returns context element', () => {
    const context = createContext('default');
    const element = context.Provider({ value: 'provided', children: null });

    expect(element.type).toBe(Symbol.for('r8s.context.provider'));
    expect(element.props.value).toBe('provided');
    expect(element.props.contextId).toBe(context._contextId);
  });

  it('should handle undefined as valid context value', () => {
    const context = createContext<string | undefined>('default');
    const element = context.Provider({ value: undefined, children: null });

    expect(element.props.value).toBeUndefined();
  });

  it('should handle null as valid context value', () => {
    const context = createContext<string | null>('default');
    const element = context.Provider({ value: null, children: null });

    expect(element.props.value).toBeNull();
  });

  it('should handle complex objects as context values', () => {
    const complexValue = {
      nested: { deep: 'value' },
      array: [1, 2, 3],
      fn: () => 'test',
    };

    const context = createContext<typeof complexValue>(complexValue);
    const element = context.Provider({ value: complexValue, children: null });

    expect(element.props.value).toEqual(complexValue);
  });
});
