import { Postgres, CustomIngress } from '@reactnetes/recipes';

export default function App() {
  return (
    <>
      <Postgres
        name="myapp-db"
        namespace="production"
        database="myapp"
        user="myapp"
        password="supersecret"
        storage="20Gi"
      />

      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
        metadata={{ name: 'myapp-web', namespace: 'production', labels: { app: 'myapp-web' } }}
        spec={{
          replicas: 3,
          selector: { matchLabels: { app: 'myapp-web' } },
          template: {
            metadata: { labels: { app: 'myapp-web' } },
            spec: {
              containers: [{
                name: 'web',
                image: 'myapp/web:v1.2.3',
                ports: [{ containerPort: 3000 }],
                env: [{
                  name: 'DATABASE_URL',
                  value: 'postgresql://myapp:supersecret@myapp-db:5432/myapp',
                }],
              }],
            },
          },
        }}
      />

      <service
        apiVersion="v1"
        kind="Service"
        metadata={{ name: 'myapp-web', namespace: 'production' }}
        spec={{
          type: 'ClusterIP',
          selector: { app: 'myapp-web' },
          ports: [{ port: 80, targetPort: 3000 }],
        }}
      />

      <CustomIngress
        name="myapp-ingress"
        namespace="production"
        host="myapp.example.com"
        serviceName="myapp-web"
        servicePort={80}
        tlsSecretName="myapp-tls"
        annotations={{
          'nginx.ingress.kubernetes.io/rate-limit': '100',
        }}
      />
    </>
  );
}
