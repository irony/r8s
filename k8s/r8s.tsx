// r8s.berget.ai infrastructure
// One file. Everything included.
//
// NOTE: Image tag is set by CI to the commit SHA for immutable deployments.
// The :latest tag in source is replaced during render by the deploy workflow.

import { App } from '@r8s/recipes';

export default (
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
);
