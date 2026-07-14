import { jsx } from './jsx-runtime';

export interface Context<T> {
  Provider: (props: { value: T; children?: unknown }) => unknown;
  _defaultValue: T;
  _contextId: symbol;
}

const contextMap = new WeakMap<object, Map<symbol, unknown>>();

export function createContext<T>(defaultValue: T): Context<T> {
  const contextId = Symbol('r8s.context');

  return {
    Provider: ({ value, children }: { value: T; children?: unknown }) => {
      return {
        type: Symbol.for('r8s.context.provider'),
        props: { contextId, value, children },
        key: null,
      };
    },
    _defaultValue: defaultValue,
    _contextId: contextId,
  };
}

export function useContext<T>(context: Context<T>): T {
  // This is a simplified version - in the real renderer,
  // context values are looked up from the component tree
  return context._defaultValue;
}
