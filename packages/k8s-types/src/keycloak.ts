// Keycloak Operator CRDs
// https://www.keycloak.org/operator/basic-deployment

export interface Keycloak {
  apiVersion: 'k8s.keycloak.org/v2alpha1';
  kind: 'Keycloak';
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
  };
  spec: {
    instances?: number;
    hostname?: {
      hostname: string;
      strict?: boolean;
      strictBackchannel?: boolean;
    };
    http?: {
      tlsSecret?: string;
    };
    proxy?: {
      headers?: string;
    };
    db?: {
      vendor?: string;
      host?: string;
      database?: string;
      port?: number;
      usernameSecret?: {
        name: string;
        key: string;
      };
      passwordSecret?: {
        name: string;
        key: string;
      };
    };
    ingress?: {
      enabled?: boolean;
      className?: string;
    };
    transaction?: {
      xaEnabled?: boolean;
    };
    unsupported?: {
      podTemplate?: Record<string, unknown>;
    };
  };
}

export interface KeycloakRealmImport {
  apiVersion: 'k8s.keycloak.org/v2alpha1';
  kind: 'KeycloakRealmImport';
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
  };
  spec: {
    keycloakCRName: string;
    realm: {
      realm: string;
      enabled: boolean;
      displayName?: string;
      clients?: Array<{
        clientId: string;
        name?: string;
        enabled?: boolean;
        clientAuthenticatorType?: string;
        redirectUris?: string[];
        webOrigins?: string[];
        standardFlowEnabled?: boolean;
        implicitFlowEnabled?: boolean;
        directAccessGrantsEnabled?: boolean;
        serviceAccountsEnabled?: boolean;
        publicClient?: boolean;
        protocol?: string;
      }>;
      users?: Array<{
        username: string;
        enabled?: boolean;
        email?: string;
        firstName?: string;
        lastName?: string;
        credentials?: Array<{
          type: string;
          value: string;
          temporary?: boolean;
        }>;
      }>;
    };
  };
}
