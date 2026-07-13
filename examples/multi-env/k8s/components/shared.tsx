import { Postgres, CustomIngress } from '@r8s/recipes';

interface WebAppProps {
  name: string;
  namespace: string;
  image: string;
  replicas: number;
  dbHost: string;
  dbPassword: string;
  ingressHost: string;
  tlsSecretName?: string;
  enableHPA?: boolean;
}

export function WebApp(props: WebAppProps) {
  const {
    name,
    namespace,
    image,
    replicas,
    dbHost,
    dbPassword,
    ingressHost,
    tlsSecretName,
    enableHPA = false,
  } = props;

  return (
    <>
      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
        metadata={{ name, namespace, labels: { app: name } }}
        spec={{
          replicas,
          selector: { matchLabels: { app: name } },
          template: {
            metadata: { labels: { app: name } },
            spec: {
              containers: [{
                name: 'app',
                image,
                ports: [{ containerPort: 3000 }],
                env: [{
                  name: 'DATABASE_URL',
                  value: `postgresql://app:${dbPassword}@${dbHost}:5432/app`,
                }, {
                  name: 'NODE_ENV',
                  value: namespace === 'production' ? 'production' : 'development',
                }],
                resources: {
                  requests: { memory: '256Mi', cpu: '250m' },
                  limits: { memory: '512Mi', cpu: '500m' },
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
          ports: [{ port: 80, targetPort: 3000 }],
        }}
      />

      <CustomIngress
        name={`${name}-ingress`}
        namespace={namespace}
        host={ingressHost}
        serviceName={name}
        servicePort={80}
        tlsSecretName={tlsSecretName}
      />

      {enableHPA && (
        <horizontalpodautoscaler
          apiVersion="autoscaling/v2"
          kind="HorizontalPodAutoscaler"
          metadata={{ name, namespace }}
          spec={{
            scaleTargetRef: {
              apiVersion: 'apps/v1',
              kind: 'Deployment',
              name,
            },
            minReplicas: replicas,
            maxReplicas: replicas * 3,
            metrics: [{
              type: 'Resource',
              resource: {
                name: 'cpu',
                target: {
                  type: 'Utilization',
                  averageUtilization: 70,
                },
              },
            }],
          }}
        />
      )}
    </>
  );
}

interface DatabaseProps {
  name: string;
  namespace: string;
  storage: string;
  password: string;
}

export function Database(props: DatabaseProps) {
  return (
    <Postgres
      name={props.name}
      namespace={props.namespace}
      database="app"
      user="app"
      password={props.password}
      storage={props.storage}
    />
  );
}
