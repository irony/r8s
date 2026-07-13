import { jsx } from '@r8s/core';
import { ClusterIssuer, Certificate } from '@r8s/k8s-types';

export interface LetsEncryptIssuerProps {
  name: string;
  email: string;
  server?: 'production' | 'staging';
  ingressClass?: string;
}

export function LetsEncryptIssuer(props: LetsEncryptIssuerProps) {
  const {
    name,
    email,
    server = 'production',
    ingressClass = 'nginx',
  } = props;

  const acmeServer = server === 'production'
    ? 'https://acme-v02.api.letsencrypt.org/directory'
    : 'https://acme-staging-v02.api.letsencrypt.org/directory';

  const issuer: ClusterIssuer = {
    apiVersion: 'cert-manager.io/v1',
    kind: 'ClusterIssuer',
    metadata: { name },
    spec: {
      acme: {
        server: acmeServer,
        email,
        privateKeySecretRef: { name: `${name}-account-key` },
        solvers: [{
          http01: {
            ingress: { class: ingressClass },
          },
        }],
      },
    },
  };

  return jsx('ClusterIssuer', issuer);
}

export interface ManagedCertificateProps {
  name: string;
  namespace?: string;
  secretName: string;
  issuerName: string;
  dnsNames: string[];
  duration?: string;
  renewBefore?: string;
}

export function ManagedCertificate(props: ManagedCertificateProps) {
  const {
    name,
    namespace = 'default',
    secretName,
    issuerName,
    dnsNames,
    duration = '2160h', // 90 days
    renewBefore = '360h', // 15 days
  } = props;

  const certificate: Certificate = {
    apiVersion: 'cert-manager.io/v1',
    kind: 'Certificate',
    metadata: { name, namespace },
    spec: {
      secretName,
      issuerRef: {
        name: issuerName,
        kind: 'ClusterIssuer',
      },
      dnsNames,
      duration,
      renewBefore,
    },
  };

  return jsx('Certificate', certificate);
}
