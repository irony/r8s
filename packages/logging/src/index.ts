import { jsx } from '@r8s/core';
import { helmOperator } from '@r8s/k8s-types';

/** Logging Operator declaration (Kube-logging / Banzai Cloud) */
export const loggingOperator = (version = '4.2.3') =>
  helmOperator(
    'logging-operator',
    'logging-operator',
    'https://kube-logging.github.io/helm-charts',
    version,
    {
      description: 'Logging Operator for Kubernetes by Banzai Cloud',
      namespace: 'logging',
      crds: [
        'loggings.logging.banzaicloud.io',
        'flows.logging.banzaicloud.io',
        'clusterflows.logging.banzaicloud.io',
        'outputs.logging.banzaicloud.io',
        'clusteroutputs.logging.banzaicloud.io',
      ],
    }
  );

export interface LoggingProps {
  name: string;
  namespace?: string;
  fluentd?: {
    replicas?: number;
    resources?: {
      requests?: { cpu?: string; memory?: string };
      limits?: { cpu?: string; memory?: string };
    };
  };
  fluentbit?: {
    resources?: {
      requests?: { cpu?: string; memory?: string };
      limits?: { cpu?: string; memory?: string };
    };
  };
  controlNamespace?: string;
}

/**
 * Logging resource using Logging Operator.
 *
 * @example
 * <Logging
 *   name="platform-logs"
 *   namespace="logging"
 *   fluentd={{ replicas: 2 }}
 * />
 */
export function Logging(props: LoggingProps) {
  const { name, namespace = 'default', fluentd, fluentbit, controlNamespace } = props;

  const logging = {
    apiVersion: 'logging.banzaicloud.io/v1beta1',
    kind: 'Logging',
    metadata: { name, namespace },
    spec: {
      ...(fluentd && {
        fluentd: {
          ...(fluentd.replicas && { replicas: fluentd.replicas }),
          ...(fluentd.resources && { resources: fluentd.resources }),
        },
      }),
      ...(fluentbit && {
        fluentbit: {
          ...(fluentbit.resources && { resources: fluentbit.resources }),
        },
      }),
      ...(controlNamespace && { controlNamespace }),
    },
  };

  return jsx('Logging', logging);
}

export interface FlowProps {
  name: string;
  namespace?: string;
  match?: Array<{
    select?: {
      labels?: Record<string, string>;
    };
    exclude?: {
      labels?: Record<string, string>;
    };
  }>;
  filters?: Array<{
    parser?: {
      parse?: {
        type: string;
        expression: string;
      };
    };
    grep?: {
      regexp?: Array<{
        key: string;
        pattern: string;
      }>;
    };
  }>;
  outputRefs: string[];
}

/**
 * Flow for routing logs to outputs.
 */
export function Flow(props: FlowProps) {
  const { name, namespace = 'default', match, filters, outputRefs } = props;

  const flow = {
    apiVersion: 'logging.banzaicloud.io/v1beta1',
    kind: 'Flow',
    metadata: { name, namespace },
    spec: {
      ...(match && { match }),
      ...(filters && { filters }),
      outputRefs,
    },
  };

  return jsx('Flow', flow);
}

export interface OutputProps {
  name: string;
  namespace?: string;
  loki?: {
    url: string;
    configureKubernetesLabels?: boolean;
    labels?: Record<string, string>;
  };
  s3?: {
    bucket: string;
    region: string;
    path: string;
  };
}

/**
 * Output destination for logs.
 */
export function Output(props: OutputProps) {
  const { name, namespace = 'default', loki, s3 } = props;

  const output = {
    apiVersion: 'logging.banzaicloud.io/v1beta1',
    kind: 'Output',
    metadata: { name, namespace },
    spec: {
      ...(loki && {
        loki: {
          url: loki.url,
          ...(loki.configureKubernetesLabels && {
            configure_kubernetes_labels: loki.configureKubernetesLabels,
          }),
          ...(loki.labels && { labels: loki.labels }),
        },
      }),
      ...(s3 && {
        s3: {
          bucket: s3.bucket,
          region: s3.region,
          path: s3.path,
        },
      }),
    },
  };

  return jsx('Output', output);
}
