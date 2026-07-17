import { Operator } from '@r8s/k8s-types';
import { r8sElement } from './jsx-runtime';

const OPERATOR_SYMBOL = Symbol.for('r8s.operator');

/**
 * Declare an operator dependency.
 *
 * Components use this to declare that they require a specific
 * Kubernetes operator to be installed. The renderer collects
 * all operators so the deployment pipeline can install them.
 *
 * @example
 * ```tsx
 * import { declareOperator } from '@r8s/core';
 * import { cnpgOperator } from '@r8s/recipes';
 *
 * function Database(props) {
 *   return [
 *     declareOperator(cnpgOperator('1.22.5')),
 *     jsx('Cluster', cluster),
 *   ];
 * }
 * ```
 */
export function declareOperator(operator: Operator): r8sElement {
  return {
    type: OPERATOR_SYMBOL,
    props: { operator },
    key: null,
  } as unknown as r8sElement;
}

/** Check if an element is an operator declaration */
export function isOperatorDeclaration(element: r8sElement): boolean {
  return typeof element.type === 'symbol' && element.type === OPERATOR_SYMBOL;
}

/** Extract operator from declaration element */
export function getOperator(element: r8sElement): Operator | null {
  if (!isOperatorDeclaration(element)) return null;
  return (element.props as { operator: Operator }).operator;
}
