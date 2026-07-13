import { r8sElement, Fragment, r8sProps } from './jsx-runtime';
import { KubernetesResource } from '@r8s/k8s-types';

export interface RenderResult {
  resources: KubernetesResource[];
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

function renderChildren(children: unknown): KubernetesResource[] {
  const flattened = flattenChildren(children);
  return flattened.flatMap((child) => {
    if (isr8sElement(child)) {
      return renderElement(child);
    }
    return [];
  });
}

function renderElement(element: r8sElement): KubernetesResource[] {
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

    return [];
  }

  // Handle built-in Kubernetes resource components
  // These are objects with apiVersion and kind
  if (
    typeof element.type === 'string' &&
    element.props &&
    typeof element.props === 'object'
  ) {
    const props = element.props as Record<string, unknown>;

    // If this is a raw Kubernetes resource (has apiVersion and kind)
    if ('apiVersion' in props && 'kind' in props) {
      return [props as unknown as KubernetesResource];
    }
  }

  return [];
}

export function render(element: r8sElement): RenderResult {
  const resources = renderElement(element);
  return { resources };
}
