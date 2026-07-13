// JSX Runtime for ReactNetes
// Implements the react-jsx transform (v17+)

export const Fragment = Symbol.for('reactnetes.fragment');

export type ReactNetesProps = Record<string, unknown>;

export interface ReactNetesElement {
  type: string | Function | symbol;
  props: any;
  key: string | null;
}

export function jsx<P = any>(
  type: string | Function | symbol,
  props: P,
  key?: string
): ReactNetesElement {
  return {
    type,
    props,
    key: key ?? null,
  };
}

export function jsxs<P = any>(
  type: string | Function | symbol,
  props: P,
  key?: string
): ReactNetesElement {
  return jsx(type, props, key);
}

export { jsx as jsxDEV };
