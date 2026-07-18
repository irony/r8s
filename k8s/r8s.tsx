// r8s.berget.ai infrastructure
// One file. Everything included.
//
// This manifest deploys:
// - cert-manager operator (for TLS)
// - Let's Encrypt ClusterIssuer
// - r8s documentation site (2 replicas, nginx)
//
// NOTE: Image tag :latest is replaced by CI with commit SHA.

import { App } from '@r8s/recipes';
import { LetsEncryptIssuer } from '@r8s/cert-manager';

export default (
  <>
    <LetsEncryptIssuer
      name="letsencrypt"
      email="admin@berget.ai"
      server="production"
    />
    <App
      name="r8s-docs"
      image="ghcr.io/irony/r8s-docs:latest"
      host="r8s.berget.ai"
      replicas={2}
      port={3000}
      tls={{ clusterIssuer: "letsencrypt" }}
      resources={{
        requests: { cpu: "50m", memory: "64Mi" },
        limits: { cpu: "200m", memory: "256Mi" },
      }}
    />
  </>
);
