// Platform team's shared components library
// This would be published as @mycompany/platform-k8s

import { CustomIngress } from '@r8s/recipes';

interface ServiceProps {
  name: string;
  namespace: string;
  image: string;
  port: number;
  replicas?: number;
  env?: Array<{ name: string; value: string }>;
  resources?: {
    requests?: { memory?: string; cpu?: string };
    limits?: { memory?: string; cpu?: string };
  };
}

export function Microservice(props: ServiceProps) {
  const {
    name,
    namespace,
    image,
    port,
    replicas = 2,
    env = [],
    resources = {
      requests: { memory: '128Mi', cpu: '100m' },
      limits: { memory: '256Mi', cpu: '200m' },
    },
  } = props;

  return (
    <>
      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
        metadata={{
          name,
          namespace,
          labels: { app: name, 'app.kubernetes.io/part-of': 'platform' },
        }}
        spec={{
          replicas,
          selector: { matchLabels: { app: name } },
          template: {
            metadata: {
              labels: {
                app: name,
                'app.kubernetes.io/part-of': 'platform',
                'app.kubernetes.io/version': image.split(':')[1] || 'latest',
              },
            },
            spec: {
              containers: [{
                name: 'app',
                image,
                ports: [{ containerPort: port }],
                env: [
                  { name: 'PORT', value: String(port) },
                  { name: 'LOG_LEVEL', value: 'info' },
                  ...env,
                ],
                resources,
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
        }}
      />

      <service
        apiVersion="v1"
        kind="Service"
        metadata={{ name, namespace }}
        spec={{
          type: 'ClusterIP',
          selector: { app: name },
          ports: [{
            port: 80,
            targetPort: port,
            name: 'http',
          }],
        }}
      />
    </>
  );
}

interface PublicServiceProps extends ServiceProps {
  domain: string;
  tlsSecretName?: string;
  rateLimit?: string;
}

export function PublicService(props: PublicServiceProps) {
  const { domain, tlsSecretName, rateLimit, ...serviceProps } = props;

  return (
    <>
      <Microservice {...serviceProps} />

      <CustomIngress
        name={`${serviceProps.name}-ingress`}
        namespace={serviceProps.namespace}
        host={domain}
        serviceName={serviceProps.name}
        servicePort={80}
        tlsSecretName={tlsSecretName}
        annotations={rateLimit ? {
          'nginx.ingress.kubernetes.io/rate-limit': rateLimit,
        } : undefined}
      />
    </>
  );
}

interface InternalServiceProps extends ServiceProps {
  allowedClients?: string[];
}

export function InternalService(props: InternalServiceProps) {
  const { allowedClients, ...serviceProps } = props;

  return (
    <>
      <Microservice {...serviceProps} />

      <networkpolicy
        apiVersion="networking.k8s.io/v1"
        kind="NetworkPolicy"
        metadata={{
          name: `${serviceProps.name}-network-policy`,
          namespace: serviceProps.namespace,
        }}
        spec={{
          podSelector: { matchLabels: { app: serviceProps.name } },
          policyTypes: ['Ingress'],
          ingress: allowedClients ? allowedClients.map(client => ({
            from: [{ podSelector: { matchLabels: { app: client } } }],
          })) : undefined,
        }}
      />
    </>
  );
}
