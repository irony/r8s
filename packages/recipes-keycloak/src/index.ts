import { jsx } from '@reactnetes/core';
import { Keycloak, KeycloakRealmImport } from '@reactnetes/k8s-types';

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

export function KeycloakInstance(props: KeycloakInstanceProps) {
  const {
    name,
    namespace = 'default',
    hostname,
    instances = 1,
    tlsSecretName,
    dbHost,
    dbName = 'keycloak',
    dbUsernameSecret,
    dbPasswordSecret,
    ingressClassName = 'nginx',
  } = props;

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
