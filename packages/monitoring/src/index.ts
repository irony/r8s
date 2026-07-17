import { jsx } from '@r8s/core';
import { helmOperator } from '@r8s/k8s-types';

/** Prometheus Operator (kube-prometheus-stack) declaration */
export const prometheusOperator = (version = '0.72.0') =>
  helmOperator(
    'prometheus',
    'kube-prometheus-stack',
    'https://prometheus-community.github.io/helm-charts',
    version,
    {
      description: 'Prometheus monitoring stack with Grafana and Alertmanager',
      namespace: 'monitoring',
      crds: [
        'alertmanagers.monitoring.coreos.com',
        'podmonitors.monitoring.coreos.com',
        'probes.monitoring.coreos.com',
        'prometheuses.monitoring.coreos.com',
        'prometheusrules.monitoring.coreos.com',
        'servicemonitors.monitoring.coreos.com',
        'thanosrulers.monitoring.coreos.com',
      ],
    }
  );

export interface ServiceMonitorProps {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  selector: {
    matchLabels: Record<string, string>;
  };
  endpoints: Array<{
    port: string;
    path?: string;
    interval?: string;
    scrapeTimeout?: string;
  }>;
}

/**
 * ServiceMonitor for Prometheus scraping.
 *
 * Requires Prometheus Operator to be installed.
 *
 * @example
 * <ServiceMonitor
 *   name="api-metrics"
 *   namespace="production"
 *   selector={{ matchLabels: { app: 'api' } }}
 *   endpoints={[{ port: 'metrics', path: '/metrics' }]}
 * />
 */
export function ServiceMonitor(props: ServiceMonitorProps) {
  const { name, namespace = 'default', labels, selector, endpoints } = props;

  const monitor = {
    apiVersion: 'monitoring.coreos.com/v1',
    kind: 'ServiceMonitor',
    metadata: { name, namespace, labels },
    spec: {
      selector,
      endpoints: endpoints.map((e) => ({
        port: e.port,
        ...(e.path && { path: e.path }),
        ...(e.interval && { interval: e.interval }),
        ...(e.scrapeTimeout && { scrapeTimeout: e.scrapeTimeout }),
      })),
    },
  };

  return jsx('ServiceMonitor', monitor);
}

export interface PrometheusRuleProps {
  name: string;
  namespace?: string;
  groups: Array<{
    name: string;
    interval?: string;
    rules: Array<{
      alert: string;
      expr: string;
      for?: string;
      labels?: Record<string, string>;
      annotations?: Record<string, string>;
    }>;
  }>;
}

/**
 * PrometheusRule for alerting rules.
 */
export function PrometheusRule(props: PrometheusRuleProps) {
  const { name, namespace = 'default', groups } = props;

  const rule = {
    apiVersion: 'monitoring.coreos.com/v1',
    kind: 'PrometheusRule',
    metadata: { name, namespace },
    spec: {
      groups: groups.map((g) => ({
        name: g.name,
        ...(g.interval && { interval: g.interval }),
        rules: g.rules.map((r) => ({
          alert: r.alert,
          expr: r.expr,
          ...(r.for && { for: r.for }),
          ...(r.labels && { labels: r.labels }),
          ...(r.annotations && { annotations: r.annotations }),
        })),
      })),
    },
  };

  return jsx('PrometheusRule', rule);
}

export interface PodMonitorProps {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  selector: {
    matchLabels: Record<string, string>;
  };
  podMetricsEndpoints: Array<{
    port: string;
    path?: string;
    interval?: string;
  }>;
}

/**
 * PodMonitor for scraping pods directly (without Service).
 */
export function PodMonitor(props: PodMonitorProps) {
  const { name, namespace = 'default', labels, selector, podMetricsEndpoints } = props;

  const monitor = {
    apiVersion: 'monitoring.coreos.com/v1',
    kind: 'PodMonitor',
    metadata: { name, namespace, labels },
    spec: {
      selector,
      podMetricsEndpoints: podMetricsEndpoints.map((e) => ({
        port: e.port,
        ...(e.path && { path: e.path }),
        ...(e.interval && { interval: e.interval }),
      })),
    },
  };

  return jsx('PodMonitor', monitor);
}
