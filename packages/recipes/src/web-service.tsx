import { jsx } from '@reactnetes/core';
import { Deployment, Service } from '@reactnetes/k8s-types';

export interface WebServiceProps {
  name: string;
  namespace?: string;
  image: string;
  port?: number;
  replicas?: number;
  env?: Array<{ name: string; value: string }>;
  envFrom?: Array<{ secretRef?: { name: string } }>;
}

/**
 * Simple web service (backend or frontend).
 * 
 * Creates a Deployment + Service with health checks.
 * 
 * @example
 * <WebService name="api" image="myapp/api:v1" port={3000} />
 * <WebService 
 *   name="web" 
 *   image="myapp/web:v1" 
 *   port={80}
 *   envFrom={[{ secretRef: { name: 'app-secrets' } }]}
 * />
 */
export function WebService(props: WebServiceProps) {
  const {
    name,
    namespace = 'default',
    image,
    port = 3000,
    replicas = 2,
    env = [],
    envFrom = [],
  } = props;

  const deployment: Deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name, namespace, labels: { app: name } },
    spec: {
      replicas,
      selector: { matchLabels: { app: name } },
      template: {
        metadata: { labels: { app: name } },
        spec: {
          containers: [{
            name: 'app',
            image,
            ports: [{ containerPort: port }],
            env,
            ...(envFrom.length > 0 && { envFrom }),
            livenessProbe: {
              httpGet: { path: '/health', port },
              initialDelaySeconds: 10,
              periodSeconds: 10,
            },
            readinessProbe: {
              httpGet: { path: '/ready', port },
              initialDelaySeconds: 5,
              periodSeconds: 5,
            },
          }],
        },
      },
    },
  };

  const service: Service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: { name, namespace },
    spec: {
      type: 'ClusterIP',
      selector: { app: name },
      ports: [{ port: 80, targetPort: port }],
    },
  };

  return [
    jsx('Deployment', deployment),
    jsx('Service', service),
  ];
}
