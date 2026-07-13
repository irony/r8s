// cert-manager CRDs
// https://cert-manager.io/docs/reference/api-docs/

export interface Certificate {
  apiVersion: 'cert-manager.io/v1';
  kind: 'Certificate';
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
  };
  spec: {
    secretName: string;
    issuerRef: {
      name: string;
      kind?: string;
      group?: string;
    };
    dnsNames?: string[];
    commonName?: string;
    duration?: string;
    renewBefore?: string;
    privateKey?: {
      algorithm?: string;
      size?: number;
    };
  };
}

export interface ClusterIssuer {
  apiVersion: 'cert-manager.io/v1';
  kind: 'ClusterIssuer';
  metadata: {
    name: string;
    labels?: Record<string, string>;
  };
  spec: {
    acme?: {
      server: string;
      email: string;
      privateKeySecretRef: {
        name: string;
      };
      solvers?: Array<{
        http01?: {
          ingress?: {
            class: string;
          };
        };
        dns01?: Record<string, unknown>;
        selector?: {
          dnsNames?: string[];
        };
      }>;
    };
    ca?: {
      secretName: string;
    };
    selfSigned?: {};
  };
}

export interface Issuer {
  apiVersion: 'cert-manager.io/v1';
  kind: 'Issuer';
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
  };
  spec: ClusterIssuer['spec'];
}
