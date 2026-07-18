// r8s.berget.ai infrastructure
// One file. Everything included.

import { App } from '@r8s/recipes';

export default (
  <App
    name="r8s-docs"
    image="ghcr.io/irony/r8s-docs:latest"
    host="r8s.berget.ai"
    replicas={2}
    port={3000}
    tls={{ issuer: "letsencrypt" }}
    resources={{
      requests: { cpu: "50m", memory: "64Mi" },
      limits: { cpu: "200m", memory: "256Mi" },
    }}
  />
);
