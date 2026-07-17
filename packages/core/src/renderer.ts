import { r8sElement, Fragment, r8sProps } from './jsx-runtime';
import { KubernetesResource, Operator } from '@r8s/k8s-types';
import { isOperatorDeclaration, getOperator } from './operator';
import { Context } from './context';

export interface RenderResult {
  resources: KubernetesResource[];
  operators: Operator[];
}

// Active context values during rendering
const contextStack = new Map<symbol, unknown>();

export function useContext<T>(context: Context<T>): T {
  if (contextStack.has(context._contextId)) {
    return contextStack.get(context._contextId) as T;
  }
  return context._defaultValue;
}

function isr8sElement(value: unknown): value is r8sElement {
  return value !== null && typeof value === 'object' && 'type' in value && 'props' in value;
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

function renderChildren(children: unknown): {
  resources: KubernetesResource[];
  operators: Operator[];
} {
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

function renderElement(element: r8sElement): {
  resources: KubernetesResource[];
  operators: Operator[];
} {
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

  // Handle context providers
  if (element.type === Symbol.for('r8s.context.provider')) {
    const { contextId, value, children } = element.props as {
      contextId: symbol;
      value: unknown;
      children?: unknown;
    };

    // Push context value
    const hadPreviousValue = contextStack.has(contextId);
    const previousValue = contextStack.get(contextId);
    contextStack.set(contextId, value);

    // Render children with new context
    const result = renderChildren(children);

    // If the context value contains operators, include them
    if (Array.isArray(value)) {
      const ops = value.filter(
        (v): v is Operator => v && typeof v === 'object' && 'name' in v && 'source' in v
      );
      result.operators.unshift(...ops);
    }

    // Restore previous context
    if (hadPreviousValue) {
      contextStack.set(contextId, previousValue);
    } else {
      contextStack.delete(contextId);
    }

    return result;
  }

  // Handle function components
  if (typeof element.type === 'function') {
    const componentFn = element.type as Function;
    const props = element.props;

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
  if (typeof element.type === 'string' && element.props && typeof element.props === 'object') {
    const props = element.props as Record<string, unknown>;

    // If this is a raw Kubernetes resource (has apiVersion and kind)
    if ('apiVersion' in props && 'kind' in props) {
      return { resources: [props as unknown as KubernetesResource], operators: [] };
    }
  }

  return { resources: [], operators: [] };
}

export function render(element: r8sElement): RenderResult {
  // Clear context stack before rendering
  contextStack.clear();

  const { resources, operators } = renderElement(element);

  // Deduplicate operators by name, keeping the last version
  const operatorMap = new Map<string, Operator>();
  for (const op of operators) {
    operatorMap.set(op.name, op);
  }

  return {
    resources,
    operators: Array.from(operatorMap.values()),
  };
}
