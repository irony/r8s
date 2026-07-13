// Platform team's "Golden Path" template
// Teams just fill in the blanks — everything else is standardized

import { Postgres, CustomIngress } from '@r8s/recipes';

interface StandardWebAppProps {
  // Required: What the team controls
  name: string;
  image: string;
  domain: string;

  // Optional: Sensible defaults provided
  namespace?: string;
  port?: number;
  replicas?: number;
  dbName?: string;
  enableMonitoring?: boolean;
  enableTracing?: boolean;
}

export function StandardWebApp(props: StandardWebAppProps) {
  const {
    name,
    image,
    domain,
    namespace = 'default',
    port = 3000,
    replicas = 2,
    dbName = name,
    enableMonitoring = true,
    enableTracing = true,
  } = props;

  const dbPassword = '${DB_PASSWORD}'; // Injected via external secret

  return (
    <>
      {/* Standard: Every app gets a database */}
      <Postgres
        name={`${name}-db`}
        namespace={namespace}
        database={dbName}
        user={name}
        password={dbPassword}
        storage="10Gi"
      />

      {/* Standard: Deployment with platform defaults */}
      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
        metadata={{
          name,
          namespace,
          labels: {
            app: name,
            'app.kubernetes.io/managed-by': 'platform-team',
            'app.kubernetes.io/part-of': name,
          },
        }}
        spec={{
          replicas,
          selector: { matchLabels: { app: name } },
          template: {
            metadata: {
              labels: {
                app: name,
                'app.kubernetes.io/part-of': name,
              },
              annotations: {
                ...(enableMonitoring && {
                  'prometheus.io/scrape': 'true',
                  'prometheus.io/port': String(port),
                  'prometheus.io/path': '/metrics',
                }),
                ...(enableTracing && {
                  'tracing.enabled': 'true',
                }),
              },
            },
            spec: {
              containers: [{
                name: 'app',
                image,
                ports: [{ containerPort: port }],
                env: [
                  { name: 'PORT', value: String(port) },
                  {
                    name: 'DATABASE_URL',
                    value: `postgresql://${name}:${dbPassword}@${name}-db:5432/${dbName}`,
                  },
                  ...(enableMonitoring ? [{ name: 'METRICS_ENABLED', value: 'true' }] : []),
                  ...(enableTracing ? [{ name: 'TRACING_ENABLED', value: 'true' }] : []),
                ],
                resources: {
                  requests: { memory: '128Mi', cpu: '100m' },
                  limits: { memory: '256Mi', cpu: '200m' },
                },
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

      {/* Standard: Service */}
      <service
        apiVersion="v1"
        kind="Service"
        metadata={{ name, namespace }}
        spec={{
          type: 'ClusterIP',
          selector: { app: name },
          ports: [{ port: 80, targetPort: port, name: 'http' }],
        }}
      />

      {/* Standard: Ingress with TLS */}
      <CustomIngress
        name={`${name}-ingress`}
        namespace={namespace}
        host={domain}
        serviceName={name}
        servicePort={80}
        tlsSecretName={`${name}-tls`}
        annotations={{
          'nginx.ingress.kubernetes.io/rate-limit': '100',
          'nginx.ingress.kubernetes.io/enable-cors': 'true',
        }}
      />

      {/* Standard: PodDisruptionBudget for HA */}
      {replicas > 1 && (
        <poddisruptionbudget
          apiVersion="policy/v1"
          kind="PodDisruptionBudget"
          metadata={{ name, namespace }}
          spec={{
            selector: { matchLabels: { app: name } },
            minAvailable: Math.floor(replicas / 2),
          }}
        />
      )}
    </>
  );
}
