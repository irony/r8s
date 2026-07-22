// r8s.berget.ai infrastructure
// One file. Everything included.
//
// This manifest deploys:
// - r8s documentation site (2 replicas, nginx)
// - Envoy Gateway + HTTPRoute (Gateway API)
// - cert-manager Certificate for TLS
//
// NOTE: Namespace is provisioned by Flux in the infra repo.
// NOTE: Image tag :latest is replaced by CI with commit SHA.

import { WebService } from '@r8s/recipes';
import { Gateway, HTTPRoute } from '@r8s/envoy';
import { ManagedCertificate } from '@r8s/cert-manager';

const name = 'r8s-docs';
const host = 'r8s.berget.ai';
const namespace = 'r8s-docs';

export default (
  <>
    <WebService
      name={name}
      namespace={namespace}
      image="ghcr.io/irony/r8s-docs:latest"
      port={3000}
      replicas={2}
      resources={{
        requests: { cpu: "50m", memory: "64Mi" },
        limits: { cpu: "200m", memory: "256Mi" },
      }}
    />

    <ManagedCertificate
      name={`${name}-tls`}
      namespace={namespace}
      secretName={`${name}-tls`}
      dnsNames={[host]}
      issuerName="letsencrypt-prod"
    />

    <Gateway
      name={`${name}-gateway`}
      namespace={namespace}
      gatewayClassName="eg"
      listeners={[
        {
          name: 'https',
          protocol: 'HTTPS',
          port: 443,
          hostname: host,
          tls: {
            mode: 'Terminate',
            certificateRefs: [{ name: `${name}-tls` }],
          },
        },
      ]}
    />

    <HTTPRoute
      name={`${name}-route`}
      namespace={namespace}
      parentRefs={[{ name: `${name}-gateway` }]}
      hostnames={[host]}
      rules={[
        {
          backendRefs: [{ name, port: 80 }],
        },
      ]}
    />
  </>
);
