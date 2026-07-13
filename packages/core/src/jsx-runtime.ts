// JSX Runtime for r8s
// Implements the react-jsx transform (v17+)

export const Fragment = Symbol.for('r8s.fragment');

export type r8sProps = Record<string, unknown>;

export interface r8sElement {
  type: string | Function | symbol;
  props: any;
  key: string | null;
}

export function jsx<P = any>(
  type: string | Function | symbol,
  props: P,
  key?: string
): r8sElement {
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
): r8sElement {
  return jsx(type, props, key);
}

export { jsx as jsxDEV };
