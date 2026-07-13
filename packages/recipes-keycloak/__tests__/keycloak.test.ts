import { describe, it, expect } from 'vitest';
import { render } from '@reactnetes/core';
import { jsx } from '@reactnetes/core';
import { KeycloakInstance, KeycloakRealm } from '../src/index';

describe('KeycloakInstance', () => {
  it('should render Keycloak CR with database', () => {
    const element = jsx(KeycloakInstance, {
      name: 'keycloak',
      namespace: 'auth',
      hostname: 'auth.example.com',
      instances: 2,
      tlsSecretName: 'auth-tls',
      dbHost: 'keycloak-db',
      dbName: 'keycloak',
      dbUsernameSecret: { name: 'db-creds', key: 'username' },
      dbPasswordSecret: { name: 'db-creds', key: 'password' },
      ingressClassName: 'nginx',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    const kc = result.resources[0];
    expect(kc.kind).toBe('Keycloak');
    expect(kc.apiVersion).toBe('k8s.keycloak.org/v2alpha1');
    expect(kc.metadata.name).toBe('keycloak');
    expect(kc.metadata.namespace).toBe('auth');
    expect((kc as any).spec.instances).toBe(2);
    expect((kc as any).spec.hostname.hostname).toBe('auth.example.com');
    expect((kc as any).spec.hostname.strict).toBe(false);
    expect((kc as any).spec.http.tlsSecret).toBe('auth-tls');
    expect((kc as any).spec.proxy.headers).toBe('xforwarded');
    expect((kc as any).spec.db.vendor).toBe('postgres');
    expect((kc as any).spec.db.host).toBe('keycloak-db');
    expect((kc as any).spec.db.database).toBe('keycloak');
    expect((kc as any).spec.ingress.enabled).toBe(true);
    expect((kc as any).spec.ingress.className).toBe('nginx');
    expect((kc as any).spec.transaction.xaEnabled).toBe(false);
  });

  it('should use defaults', () => {
    const element = jsx(KeycloakInstance, {
      name: 'simple-keycloak',
      namespace: 'default',
      hostname: 'keycloak.local',
    });

    const result = render(element);

    const kc = result.resources[0];
    expect((kc as any).spec.instances).toBe(1);
    expect((kc as any).spec.ingress.className).toBe('nginx');
    expect((kc as any).spec.hostname.strict).toBe(false);
  });
});

describe('KeycloakRealm', () => {
  it('should render KeycloakRealmImport with clients and users', () => {
    const element = jsx(KeycloakRealm, {
      name: 'main-realm',
      namespace: 'auth',
      keycloakName: 'keycloak',
      realmName: 'example',
      displayName: 'Example Organization',
      clients: [
        {
          clientId: 'web-app',
          name: 'Web Application',
          redirectUris: ['https://app.example.com/*'],
          webOrigins: ['https://app.example.com'],
          publicClient: true,
        },
        {
          clientId: 'api-service',
          name: 'API Service',
          serviceAccountsEnabled: true,
          publicClient: false,
        },
      ],
      users: [
        {
          username: 'admin',
          email: 'admin@example.com',
          password: 'changeme',
          temporary: true,
        },
      ],
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    const realm = result.resources[0];
    expect(realm.kind).toBe('KeycloakRealmImport');
    expect(realm.apiVersion).toBe('k8s.keycloak.org/v2alpha1');
    expect(realm.metadata.name).toBe('main-realm');
    expect(realm.metadata.namespace).toBe('auth');
    expect((realm as any).spec.keycloakCRName).toBe('keycloak');
    expect((realm as any).spec.realm.realm).toBe('example');
    expect((realm as any).spec.realm.displayName).toBe('Example Organization');
    expect((realm as any).spec.realm.enabled).toBe(true);

    const clients = (realm as any).spec.realm.clients;
    expect(clients).toHaveLength(2);
    expect(clients[0].clientId).toBe('web-app');
    expect(clients[0].publicClient).toBe(true);
    expect(clients[1].clientId).toBe('api-service');
    expect(clients[1].serviceAccountsEnabled).toBe(true);
    expect(clients[1].publicClient).toBe(false);

    const users = (realm as any).spec.realm.users;
    expect(users).toHaveLength(1);
    expect(users[0].username).toBe('admin');
    expect(users[0].credentials[0].type).toBe('password');
    expect(users[0].credentials[0].temporary).toBe(true);
  });

  it('should render minimal realm', () => {
    const element = jsx(KeycloakRealm, {
      name: 'minimal-realm',
      namespace: 'default',
      keycloakName: 'keycloak',
      realmName: 'minimal',
    });

    const result = render(element);

    const realm = result.resources[0];
    expect((realm as any).spec.realm.clients).toHaveLength(0);
    expect((realm as any).spec.realm.users).toHaveLength(0);
  });
});
