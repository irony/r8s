import { r8sElement, Fragment, r8sProps } from './jsx-runtime';
import { KubernetesResource, Operator } from '@r8s/k8s-types';
import { isOperatorDeclaration, getOperator } from './operator';

export interface RenderResult {
  resources: KubernetesResource[];
  operators: Operator[];
}

function isr8sElement(value: unknown): value is r8sElement {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    'props' in value
  );
}

function flattenChildren(children: unknown): unknown[] {
  if (children === null || children === undefined || typeof children === 'boolean') {
    return [];
  }

  if (Array.isArray(children)) {
    return children.flatMap(flattenChildren);
  }

  return [children];
}

function renderChildren(children: unknown): { resources: KubernetesResource[]; operators: Operator[] } {
  const flattened = flattenChildren(children);
  const resources: KubernetesResource[] = [];
  const operators: Operator[] = [];

  for (const child of flattened) {
    if (isr8sElement(child)) {
      const result = renderElement(child);
      resources.push(...result.resources);
      operators.push(...result.operators);
    }
  }

  return { resources, operators };
}

function renderElement(element: r8sElement): { resources: KubernetesResource[]; operators: Operator[] } {
  // Handle operator declarations
  if (isOperatorDeclaration(element)) {
    const operator = getOperator(element);
    if (operator) {
      return { resources: [], operators: [operator] };
    }
    return { resources: [], operators: [] };
  }

  // Handle Fragment - just render children
  if (element.type === Fragment) {
    return renderChildren(element.props.children);
  }

  // Handle function components
  if (typeof element.type === 'function') {
    const componentFn = element.type as Function;
    const { children, ...props } = element.props;

    const result = componentFn(props);

    if (isr8sElement(result)) {
      return renderElement(result);
    }

    if (Array.isArray(result)) {
      return renderChildren(result);
    }

    return { resources: [], operators: [] };
  }

  // Handle built-in Kubernetes resource components
  if (
    typeof element.type === 'string' &&
    element.props &&
    typeof element.props === 'object'
  ) {
    const props = element.props as Record<string, unknown>;

    // If this is a raw Kubernetes resource (has apiVersion and kind)
    if ('apiVersion' in props && 'kind' in props) {
      return { resources: [props as unknown as KubernetesResource], operators: [] };
    }
  }

  return { resources: [], operators: [] };
}

export function render(element: r8sElement): RenderResult {
  const { resources, operators } = renderElement(element);
  
  // Deduplicate operators by name, keeping the last version
  const operatorMap = new Map<string, Operator>();
  for (const op of operators) {
    operatorMap.set(op.name, op);
  }
  
  return { 
    resources,
    operators: Array.from(operatorMap.values())
  };
}
