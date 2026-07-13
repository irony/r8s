import { Postgres } from '@reactnetes/recipes';
import { LetsEncryptIssuer, ManagedCertificate } from '@reactnetes/recipes-cert-manager';
import { VaultConnectionConfig, VaultKubernetesAuth, VaultKVSecret } from '@reactnetes/recipes-vault';
import { KeycloakInstance, KeycloakRealm } from '@reactnetes/recipes-keycloak';
import { ExternalDNSRecord } from '@reactnetes/recipes-external-dns';

export default function PlatformInfrastructure() {
  return (
    <>
      {/* cert-manager: Let's Encrypt issuer */}
      <LetsEncryptIssuer
        name="letsencrypt-prod"
        email="admin@example.com"
        server="production"
        ingressClass="nginx"
      />

      {/* cert-manager: Certificate for keycloak */}
      <ManagedCertificate
        name="keycloak-tls"
        namespace="auth"
        secretName="keycloak-tls"
        issuerName="letsencrypt-prod"
        dnsNames={['auth.example.com']}
      />

      {/* external-dns: Record for keycloak */}
      <ExternalDNSRecord
        name="keycloak-dns"
        namespace="auth"
        dnsName="auth.example.com"
        targets={['192.168.1.100']}
        recordType="A"
        ttl={300}
      />

      {/* Vault: Connection to external Vault */}
      <VaultConnectionConfig
        name="vault-connection"
        namespace="auth"
        address="https://vault.example.com:8200"
        caCertSecretRef="vault-ca"
      />

      {/* Vault: Kubernetes auth for keycloak */}
      <VaultKubernetesAuth
        name="keycloak-vault-auth"
        namespace="auth"
        vaultConnectionRef="vault-connection"
        role="keycloak"
        serviceAccount="keycloak"
        mount="kubernetes"
      />

      {/* Vault: Database credentials for keycloak */}
      <VaultKVSecret
        name="keycloak-db-credentials"
        namespace="auth"
        vaultAuthRef="keycloak-vault-auth"
        mount="secret"
        path="keycloak/database"
        secretName="keycloak-db-credentials"
        type="kv-v2"
      />

      {/* Keycloak: Database */}
      <Postgres
        name="keycloak-db"
        namespace="auth"
        database="keycloak"
        user="keycloak"
        password="${DB_PASSWORD}"
        storage="10Gi"
      />

      {/* Keycloak: Instance */}
      <KeycloakInstance
        name="keycloak"
        namespace="auth"
        hostname="auth.example.com"
        instances={2}
        tlsSecretName="keycloak-tls"
        dbHost="keycloak-db"
        dbName="keycloak"
        dbUsernameSecret={{ name: 'keycloak-db-credentials', key: 'username' }}
        dbPasswordSecret={{ name: 'keycloak-db-credentials', key: 'password' }}
        ingressClassName="nginx"
      />

      {/* Keycloak: Realm with clients */}
      <KeycloakRealm
        name="main-realm"
        namespace="auth"
        keycloakName="keycloak"
        realmName="example"
        displayName="Example Organization"
        clients={[
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
            redirectUris: ['https://api.example.com/*'],
            serviceAccountsEnabled: true,
            publicClient: false,
          },
        ]}
        users={[
          {
            username: 'admin',
            email: 'admin@example.com',
            password: 'changeme',
            temporary: true,
          },
        ]}
      />
    </>
  );
}
