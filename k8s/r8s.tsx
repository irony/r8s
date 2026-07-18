// r8s.berget.ai infrastructure
// Assumes cert-manager and letsencrypt-prod ClusterIssuer already exist in cluster.
//
// NOTE: Image tag :latest is replaced by CI with commit SHA.

import { App } from '@r8s/recipes';

export default (
  <App
    name="r8s-docs"
    image="ghcr.io/irony/r8s-docs:latest"
    host="r8s.berget.ai"
    replicas={2}
    port={3000}
    tls={{ clusterIssuer: "letsencrypt-prod" }}
    resources={{
      requests: { cpu: "50m", memory: "64Mi" },
      limits: { cpu: "200m", memory: "256Mi" },
    }}
  />
);
