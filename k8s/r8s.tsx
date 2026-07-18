// r8s.berget.ai infrastructure
// Assumes cert-manager and letsencrypt-prod ClusterIssuer already exist.
//
// NOTE: Image tag is set via IMAGE_TAG env var by CI. Defaults to 'latest' for local dev.

import { App } from '@r8s/recipes';

const imageTag = process.env.IMAGE_TAG || 'latest';

export default (
  <App
    name="r8s-docs"
    image={`ghcr.io/irony/r8s-docs:${imageTag}`}
    host="r8s.berget.ai"
    replicas={2}
    port={3000}
    tls={{ clusterIssuer: "letsencrypt-prod", secretName: "r8s-docs-tls" }}
    resources={{
      requests: { cpu: "50m", memory: "64Mi" },
      limits: { cpu: "200m", memory: "256Mi" },
    }}
  />
);
