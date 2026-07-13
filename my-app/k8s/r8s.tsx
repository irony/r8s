import { Postgres, CustomIngress } from '@r8s/recipes';

export default function App() {
  return (
    <>
      <Postgres
        name="app-db"
        namespace="default"
        database="myapp"
        user="myapp"
        password="changeme"
        storage="10Gi"
      />

      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
        metadata={{ name: 'app', labels: { app: 'app' } }}
        spec={{
          replicas: 2,
          selector: { matchLabels: { app: 'app' } },
          template: {
            metadata: { labels: { app: 'app' } },
            spec: {
              containers: [{
                name: 'app',
                image: 'myapp/app:latest',
                ports: [{ containerPort: 3000 }],
                env: [{
                  name: 'DATABASE_URL',
                  value: 'postgresql://myapp:changeme@app-db:5432/myapp',
                }],
              }],
            },
          },
        }}
      />

      <service
        apiVersion="v1"
        kind="Service"
        metadata={{ name: 'app' }}
        spec={{
          type: 'ClusterIP',
          selector: { app: 'app' },
          ports: [{ port: 80, targetPort: 3000 }],
        }}
      />

      <CustomIngress
        name="app-ingress"
        host="app.example.com"
        serviceName="app"
        servicePort={80}
        tlsSecretName="app-tls"
      />
    </>
  );
}
