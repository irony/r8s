import { Postgres, CustomIngress } from '@r8s/recipes';
import { LetsEncryptIssuer, ManagedCertificate } from '@r8s/cert-manager';

export default function StagingApp() {
  return (
    <>
      <LetsEncryptIssuer
        name="letsencrypt-staging"
        email="admin@example.com"
        server="staging"
      />

      <Postgres
        name="app-db"
        namespace="staging"
        database="app"
        user="app"
        password="staging-password"
        storage="5Gi"
      />

      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
        metadata={{ name: 'app', namespace: 'staging', labels: { app: 'app' } }}
        spec={{
          replicas: 1,
          selector: { matchLabels: { app: 'app' } },
          template: {
            metadata: { labels: { app: 'app' } },
            spec: {
              containers: [{
                name: 'app',
                image: 'myapp/app:staging',
                ports: [{ containerPort: 3000 }],
                env: [{
                  name: 'DATABASE_URL',
                  value: 'postgresql://app:staging-password@app-db:5432/app',
                }],
              }],
            },
          },
        }}
      />

      <service
        apiVersion="v1"
        kind="Service"
        metadata={{ name: 'app', namespace: 'staging' }}
        spec={{
          type: 'ClusterIP',
          selector: { app: 'app' },
          ports: [{ port: 80, targetPort: 3000 }],
        }}
      />

      <CustomIngress
        name="app-ingress"
        namespace="staging"
        host="staging-app.example.com"
        serviceName="app"
        servicePort={80}
      />
    </>
  );
}
