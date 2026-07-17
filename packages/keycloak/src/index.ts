import { jsx, useContext } from '@r8s/core';
import { Keycloak, KeycloakRealmImport } from '@r8s/k8s-types';
import { DatabaseContext } from '@r8s/core/defaults';
import { olmOperator } from '@r8s/k8s-types';

/** Keycloak operator declaration (requires OLM) */
export const keycloakOperator = (version = '24.0.0') =>
  olmOperator('keycloak-operator', 'keycloak-operator', 'fast', version, {
    description: 'Keycloak identity and access management operator',
  });

export interface KeycloakInstanceProps {
  name: string;
  namespace?: string;
  hostname: string;
  instances?: number;
  tlsSecretName?: string;
  dbHost?: string;
  dbName?: string;
  dbUsernameSecret?: { name: string; key: string };
  dbPasswordSecret?: { name: string; key: string };
  ingressClassName?: string;
}

/**
 * Keycloak identity provider with automatic database wiring.
 *
 * When placed inside a Database component, it auto-connects:
 * <Database name="keycloak-db" storage="10Gi">
 *   <KeycloakInstance name="keycloak" hostname="auth.example.com" />
 * </Database>
 *
 * Or provide explicit dbHost for external databases:
 * <KeycloakInstance name="keycloak" hostname="auth.example.com" dbHost="my-db-rw" />
 */
export function KeycloakInstance(props: KeycloakInstanceProps) {
  const {
    name,
    namespace = 'default',
    hostname,
    instances = 1,
    tlsSecretName,
    dbHost: explicitDbHost,
    dbName = 'keycloak',
    dbUsernameSecret: explicitUsernameSecret,
    dbPasswordSecret: explicitPasswordSecret,
    ingressClassName = 'nginx',
  } = props;

  // Auto-wire from DatabaseContext if available
  const dbContext = useContext(DatabaseContext);
  const dbHost = explicitDbHost ?? dbContext?.host;
  const dbUsernameSecret = explicitUsernameSecret ?? (dbContext && {
    name: dbContext.passwordSecret.name,
    key: 'username',
  });
  const dbPasswordSecret = explicitPasswordSecret ?? (dbContext && {
    name: dbContext.passwordSecret.name,
    key: dbContext.passwordKey || 'password',
  });

  const keycloak: Keycloak = {
    apiVersion: 'k8s.keycloak.org/v2alpha1',
    kind: 'Keycloak',
    metadata: { name, namespace },
    spec: {
      instances,
      hostname: {
        hostname,
        strict: false,
        strictBackchannel: false,
      },
      ...(tlsSecretName && {
        http: { tlsSecret: tlsSecretName },
      }),
      proxy: {
        headers: 'xforwarded',
      },
      ...(dbHost && {
        db: {
          vendor: 'postgres',
          host: dbHost,
          database: dbName,
          port: 5432,
          ...(dbUsernameSecret && { usernameSecret: dbUsernameSecret }),
          ...(dbPasswordSecret && { passwordSecret: dbPasswordSecret }),
        },
      }),
      ingress: {
        enabled: true,
        className: ingressClassName,
      },
      transaction: {
        xaEnabled: false,
      },
    },
  };

  return jsx('Keycloak', keycloak);
}

export interface KeycloakRealmProps {
  name: string;
  namespace: string;
  keycloakName: string;
  realmName: string;
  displayName?: string;
  clients?: Array<{
    clientId: string;
    name?: string;
    redirectUris?: string[];
    webOrigins?: string[];
    publicClient?: boolean;
    serviceAccountsEnabled?: boolean;
  }>;
  users?: Array<{
    username: string;
    email?: string;
    password?: string;
    temporary?: boolean;
  }>;
}

export function KeycloakRealm(props: KeycloakRealmProps) {
  const {
    name,
    namespace,
    keycloakName,
    realmName,
    displayName,
    clients = [],
    users = [],
  } = props;

  const realmImport: KeycloakRealmImport = {
    apiVersion: 'k8s.keycloak.org/v2alpha1',
    kind: 'KeycloakRealmImport',
    metadata: { name, namespace },
    spec: {
      keycloakCRName: keycloakName,
      realm: {
        realm: realmName,
        enabled: true,
        ...(displayName && { displayName }),
        clients: clients.map(client => ({
          clientId: client.clientId,
          name: client.name || client.clientId,
          enabled: true,
          clientAuthenticatorType: 'client-secret',
          redirectUris: client.redirectUris || ['/*'],
          webOrigins: client.webOrigins || ['/*'],
          standardFlowEnabled: true,
          implicitFlowEnabled: false,
          directAccessGrantsEnabled: true,
          serviceAccountsEnabled: client.serviceAccountsEnabled || false,
          publicClient: client.publicClient !== false,
          protocol: 'openid-connect',
        })),
        users: users.map(user => ({
          username: user.username,
          enabled: true,
          ...(user.email && { email: user.email }),
          ...(user.password && {
            credentials: [{
              type: 'password',
              value: user.password,
              temporary: user.temporary || false,
            }],
          }),
        })),
      },
    },
  };

  return jsx('KeycloakRealmImport', realmImport);
}
