import { App } from '@r8s/recipes';

/**
 * My Application
 * 
 * This is all you need for a complete production-ready app:
 * - 3-instance HA PostgreSQL database (CloudNativePG)
 * - 2-replica web service with health checks
 * - Ingress with automatic TLS
 */
export default function MyApp() {
  return (
    <App
      name="myapp"
      domain="myapp.example.com"
      image="mycompany/myapp:v1.2.3"
      port={3000}
      replicas={3}
      database={true}
      tls={true}
    />
  );
}
