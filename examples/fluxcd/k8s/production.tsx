import { Postgres, CustomIngress } from '@r8s/recipes';
import { LetsEncryptIssuer, ManagedCertificate } from '@r8s/cert-manager';

export default function ProductionApp() {
  return (
    <>
      <LetsEncryptIssuer
        name="letsencrypt-prod"
        email="admin@example.com"
        server="production"
      />

      <ManagedCertificate
        name="app-tls"
        namespace="production"
        secretName="app-tls"
        issuerName="letsencrypt-prod"
        dnsNames={['app.example.com']}
      />

      <Postgres
        name="app-db"
        namespace="production"
        database="app"
        user="app"
        password="${DB_PASSWORD}"
        storage="50Gi"
      />

      <deployment
        apiVersion="apps/v1"
        kind="Deployment"
        metadata={{ name: 'app', namespace: 'production', labels: { app: 'app' } }}
        spec={{
          replicas: 5,
          selector: { matchLabels: { app: 'app' } },
          template: {
            metadata: { labels: { app: 'app' } },
            spec: {
              containers: [{
                name: 'app',
                image: 'myapp/app:v1.2.3',
                ports: [{ containerPort: 3000 }],
                env: [{
                  name: 'DATABASE_URL',
                  value: 'postgresql://app:${DB_PASSWORD}@app-db:5432/app',
                }],
              }],
            },
          },
        }}
      />

      <service
        apiVersion="v1"
        kind="Service"
        metadata={{ name: 'app', namespace: 'production' }}
        spec={{
          type: 'ClusterIP',
          selector: { app: 'app' },
          ports: [{ port: 80, targetPort: 3000 }],
        }}
      />

      <CustomIngress
        name="app-ingress"
        namespace="production"
        host="app.example.com"
        serviceName="app"
        servicePort={80}
        tlsSecretName="app-tls"
      />
    </>
  );
}
