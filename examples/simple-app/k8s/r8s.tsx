import { App, Database } from '@r8s/recipes';

/**
 * My Application
 *
 * Compose components like building blocks:
 * - Database: HA PostgreSQL (CloudNativePG)
 * - App: Deployment + Service + Ingress with TLS
 */
export default function MyApp() {
  return (
    <>
      <Database
        name="myapp-db"
        storage="10Gi"
      />

      <App
        name="myapp"
        image="mycompany/myapp:v1.2.3"
        host="myapp.example.com"
        port={3000}
        replicas={3}
        tls={{ secretName: 'myapp-tls', clusterIssuer: 'letsencrypt' }}
        env={[
          {
            name: 'DATABASE_URL',
            value: 'postgresql://myapp-db-rw:5432/myapp-db',
          },
        ]}
      />
    </>
  );
}
