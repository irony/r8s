export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface PackageComponent {
  name: string;
  description: string;
  code: string;
  resources: string[];
  props: ComponentProp[];
}

export interface Package {
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  operator?: string;
  operatorVersion?: string;
  keywords: string[];
  components: PackageComponent[];
}

export const packages: Package[] = [
  {
    slug: "cert-manager",
    name: "@r8s/cert-manager",
    title: "cert-manager",
    description: "TLS certificate automation components for Kubernetes. Declares the cert-manager operator and provides Let's Encrypt issuers and managed certificates.",
    category: "Security & Identity",
    operator: "cert-manager",
    operatorVersion: "1.14.0",
    keywords: [
      "cert-manager",
      "tls",
      "certificate",
      "letsencrypt",
      "acme",
      "cluster-issuer",
      "security"
    ],
    components: [
      {
        name: "LetsEncryptIssuer",
        description: "Creates a ClusterIssuer that uses Let's Encrypt ACME with HTTP-01 challenge via an ingress class.",
        code: `import { LetsEncryptIssuer } from '@r8s/cert-manager';

export default (
  <LetsEncryptIssuer
    name="letsencrypt"
    email="admin@example.com"
    server="production"
    ingressClass="nginx"
  />
);`,
        resources: ["ClusterIssuer (cert-manager.io/v1)"],
        props: [
          { name: "name", type: "string", required: true, description: "ClusterIssuer resource name" },
          { name: "email", type: "string", required: true, description: "Email registered with Let's Encrypt for expiry notifications" },
          { name: "server", type: "'production' | 'staging'", required: false, default: "production", description: "Let's Encrypt ACME server environment" },
          { name: "ingressClass", type: "string", required: false, default: "nginx", description: "Ingress class used for HTTP-01 challenge solver" }
        ]
      },
      {
        name: "ManagedCertificate",
        description: "Creates a Certificate resource that is automatically issued and renewed by a referenced ClusterIssuer.",
        code: `import { ManagedCertificate } from '@r8s/cert-manager';

export default (
  <ManagedCertificate
    name="api-tls"
    secretName="api-tls"
    issuerName="letsencrypt"
    dnsNames={["api.example.com"]}
    duration="2160h"
    renewBefore="360h"
  />
);`,
        resources: ["Certificate (cert-manager.io/v1)"],
        props: [
          { name: "name", type: "string", required: true, description: "Certificate resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "secretName", type: "string", required: true, description: "Secret where the issued certificate will be stored" },
          { name: "issuerName", type: "string", required: true, description: "ClusterIssuer name to reference for issuance" },
          { name: "dnsNames", type: "string[]", required: true, description: "DNS names (SANs) included in the certificate" },
          { name: "duration", type: "string", required: false, default: "2160h", description: "Certificate validity duration (Go duration string, 90 days by default)" },
          { name: "renewBefore", type: "string", required: false, default: "360h", description: "How long before expiry to renew (Go duration string, 15 days by default)" }
        ]
      }
    ]
  },
  {
    slug: "openbao",
    name: "@r8s/openbao",
    title: "OpenBao",
    description: "Secret management components powered by OpenBao (Vault). Declares the vault-secrets-operator and syncs secrets from Vault into Kubernetes Secrets.",
    category: "Security & Identity",
    operator: "vault-secrets-operator",
    operatorVersion: "0.5.0",
    keywords: [
      "openbao",
      "vault",
      "vault-secrets-operator",
      "secret management",
      "kv",
      "dynamic secrets",
      "security"
    ],
    components: [
      {
        name: "VaultConnectionConfig",
        description: "Defines how the Vault Secrets Operator connects to a Vault/OpenBao server.",
        code: `import { VaultConnectionConfig } from '@r8s/openbao';

export default (
  <VaultConnectionConfig
    name="vault-connection"
    address="https://vault.example.com:8200"
    skipTLSVerify={false}
  />
);`,
        resources: ["VaultConnection (secrets.hashicorp.com/v1beta1)"],
        props: [
          { name: "name", type: "string", required: true, description: "VaultConnection resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "address", type: "string", required: true, description: "Vault server address (e.g., https://vault.example.com:8200)" },
          { name: "caCertSecretRef", type: "string", required: false, description: "Secret containing CA certificate for Vault TLS verification" },
          { name: "skipTLSVerify", type: "boolean", required: false, default: "false", description: "Whether to skip TLS certificate verification (insecure)" }
        ]
      },
      {
        name: "VaultKubernetesAuth",
        description: "Configures Kubernetes auth method so the operator can authenticate to Vault using a service account.",
        code: `import { VaultKubernetesAuth } from '@r8s/openbao';

export default (
  <VaultKubernetesAuth
    name="vault-auth"
    namespace="default"
    vaultConnectionRef="vault-connection"
    role="app-role"
    serviceAccount="app-sa"
    mount="kubernetes"
  />
);`,
        resources: ["VaultAuth (secrets.hashicorp.com/v1beta1)"],
        props: [
          { name: "name", type: "string", required: true, description: "VaultAuth resource name" },
          { name: "namespace", type: "string", required: true, description: "Kubernetes namespace" },
          { name: "vaultConnectionRef", type: "string", required: false, description: "Reference to a VaultConnection resource" },
          { name: "role", type: "string", required: true, description: "Vault role to assume" },
          { name: "serviceAccount", type: "string", required: true, description: "Kubernetes service account to authenticate as" },
          { name: "mount", type: "string", required: false, default: "kubernetes", description: "Auth mount path in Vault" }
        ]
      },
      {
        name: "VaultDatabaseSecret",
        description: "Creates a VaultDynamicSecret that leases dynamic database credentials from Vault and writes them to a Kubernetes Secret.",
        code: `import { VaultDatabaseSecret } from '@r8s/openbao';

export default (
  <VaultDatabaseSecret
    name="api-db-creds"
    namespace="default"
    vaultAuthRef="vault-auth"
    mount="database"
    path="database/creds/app-role"
    secretName="api-db-creds"
    rolloutRestartTarget={{ kind: 'Deployment', name: 'api' }}
  />
);`,
        resources: ["VaultDynamicSecret (secrets.hashicorp.com/v1beta1)"],
        props: [
          { name: "name", type: "string", required: true, description: "VaultDynamicSecret resource name" },
          { name: "namespace", type: "string", required: true, description: "Kubernetes namespace" },
          { name: "vaultAuthRef", type: "string", required: true, description: "Reference to a VaultAuth resource" },
          { name: "mount", type: "string", required: true, description: "Vault mount path for the secrets engine" },
          { name: "path", type: "string", required: true, description: "Vault path to the secret role" },
          { name: "secretName", type: "string", required: true, description: "Name of the Kubernetes Secret to create" },
          { name: "rolloutRestartTarget", type: "{ kind: string; name: string }", required: false, description: "Workload to restart when the secret is rotated" }
        ]
      },
      {
        name: "VaultKVSecret",
        description: "Creates a VaultStaticSecret that syncs a KV (v1 or v2) secret from Vault into a Kubernetes Secret.",
        code: `import { VaultKVSecret } from '@r8s/openbao';

export default (
  <VaultKVSecret
    name="api-config"
    namespace="default"
    vaultAuthRef="vault-auth"
    mount="secret"
    path="secret/data/app/config"
    secretName="api-config"
    type="kv-v2"
    rolloutRestartTarget={{ kind: 'Deployment', name: 'api' }}
  />
);`,
        resources: ["VaultStaticSecret (secrets.hashicorp.com/v1beta1)"],
        props: [
          { name: "name", type: "string", required: true, description: "VaultStaticSecret resource name" },
          { name: "namespace", type: "string", required: true, description: "Kubernetes namespace" },
          { name: "vaultAuthRef", type: "string", required: true, description: "Reference to a VaultAuth resource" },
          { name: "mount", type: "string", required: true, description: "Vault mount path for the KV secrets engine" },
          { name: "path", type: "string", required: true, description: "Vault path to the KV secret" },
          { name: "secretName", type: "string", required: true, description: "Name of the Kubernetes Secret to create" },
          { name: "type", type: "'kv-v1' | 'kv-v2'", required: false, default: "kv-v2", description: "KV engine version" },
          { name: "rolloutRestartTarget", type: "{ kind: string; name: string }", required: false, description: "Workload to restart when the secret is rotated" }
        ]
      }
    ]
  },
  {
    slug: "keycloak",
    name: "@r8s/keycloak",
    title: "Keycloak",
    description: "Identity and access management components. Declares the keycloak-operator (via OLM) and provisions Keycloak instances with automatic database wiring.",
    category: "Security & Identity",
    operator: "keycloak-operator",
    operatorVersion: "24.0.0",
    keywords: [
      "keycloak",
      "identity",
      "sso",
      "saml",
      "oidc",
      "oauth",
      "iam",
      "auth"
    ],
    components: [
      {
        name: "KeycloakInstance",
        description: "Provisions a Keycloak instance. Auto-wires to a Database component when nested inside one, or accepts explicit database connection details.",
        code: `import { Database } from '@r8s/recipes';
import { KeycloakInstance } from '@r8s/keycloak';

export default (
  <Database name="keycloak-db" storage="10Gi" password={process.env.DB_PASSWORD}>
    <KeycloakInstance name="keycloak" hostname="auth.example.com" instances={1} />
  </Database>
);`,
        resources: ["Keycloak (k8s.keycloak.org/v2alpha1)"],
        props: [
          { name: "name", type: "string", required: true, description: "Keycloak resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "hostname", type: "string", required: true, description: "Hostname for accessing the Keycloak instance" },
          { name: "instances", type: "number", required: false, default: "1", description: "Number of Keycloak instances for HA" },
          { name: "tlsSecretName", type: "string", required: false, description: "Secret containing the TLS certificate for HTTPS" },
          { name: "dbHost", type: "string", required: false, description: "External database host (auto-wired from Database context when nested)" },
          { name: "dbName", type: "string", required: false, default: "keycloak", description: "Database name" },
          { name: "dbUsernameSecret", type: "{ name: string; key: string }", required: false, description: "Secret reference for the database username" },
          { name: "dbPasswordSecret", type: "{ name: string; key: string }", required: false, description: "Secret reference for the database password" },
          { name: "ingressClassName", type: "string", required: false, default: "nginx", description: "Ingress class used by the generated ingress" }
        ]
      },
      {
        name: "KeycloakRealm",
        description: "Imports a realm with clients and users into a Keycloak instance via KeycloakRealmImport.",
        code: `import { KeycloakRealm } from '@r8s/keycloak';

export default (
  <KeycloakRealm
    name="app-realm"
    namespace="default"
    keycloakName="keycloak"
    realmName="app"
    displayName="App Realm"
    clients={[
      {
        clientId: 'app-client',
        redirectUris: ['https://app.example.com/*'],
        publicClient: false,
        serviceAccountsEnabled: true,
      },
    ]}
    users={[
      { username: 'admin', email: 'admin@example.com', temporary: false },
    ]}
  />
);`,
        resources: ["KeycloakRealmImport (k8s.keycloak.org/v2alpha1)"],
        props: [
          { name: "name", type: "string", required: true, description: "KeycloakRealmImport resource name" },
          { name: "namespace", type: "string", required: true, description: "Kubernetes namespace" },
          { name: "keycloakName", type: "string", required: true, description: "Name of the Keycloak CR to import the realm into" },
          { name: "realmName", type: "string", required: true, description: "Realm name as seen by Keycloak" },
          { name: "displayName", type: "string", required: false, description: "Human-readable display name for the realm" },
          { name: "clients", type: "Array<{ clientId, name?, redirectUris?, webOrigins?, publicClient?, serviceAccountsEnabled? }>", required: false, default: "[]", description: "Clients to import into the realm" },
          { name: "users", type: "Array<{ username, email?, password?, temporary? }>", required: false, default: "[]", description: "Users to import into the realm" }
        ]
      }
    ]
  },
  {
    slug: "external-dns",
    name: "@r8s/external-dns",
    title: "ExternalDNS",
    description: "DNS management components. Declares the external-dns operator and creates DNSEndpoint resources plus annotation helpers for ingress-based DNS routing.",
    category: "Networking",
    operator: "external-dns",
    operatorVersion: "0.14.0",
    keywords: [
      "external-dns",
      "dns",
      "route53",
      "cloudflare",
      "dns records",
      "networking"
    ],
    components: [
      {
        name: "ExternalDNSRecord",
        description: "Creates a DNSEndpoint resource managed by ExternalDNS, supporting A, CNAME and other record types.",
        code: `import { ExternalDNSRecord } from '@r8s/external-dns';

export default (
  <ExternalDNSRecord
    name="api-dns"
    dnsName="api.example.com"
    targets={["1.2.3.4"]}
    recordType="A"
    ttl={300}
  />
);`,
        resources: ["DNSEndpoint (externaldns.k8s.io/v1alpha1)"],
        props: [
          { name: "name", type: "string", required: true, description: "DNSEndpoint resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "dnsName", type: "string", required: true, description: "DNS record name (e.g., api.example.com)" },
          { name: "targets", type: "string[]", required: true, description: "DNS targets (IP addresses or hostnames)" },
          { name: "recordType", type: "string", required: false, default: "A", description: "DNS record type (A, CNAME, TXT, etc.)" },
          { name: "ttl", type: "number", required: false, default: "300", description: "Record TTL in seconds" }
        ]
      },
      {
        name: "externalDNSAnnotations",
        description: "Returns an annotation object for ingress resources so ExternalDNS picks up the hostname and targets automatically.",
        code: `import { externalDNSAnnotations } from '@r8s/external-dns';

const annotations = externalDNSAnnotations({
  domain: 'api.example.com',
  targets: ['1.2.3.4'],
});`,
        resources: [],
        props: [
          { name: "domain", type: "string", required: true, description: "DNS hostname to expose via annotations" },
          { name: "targets", type: "string[]", required: true, description: "Comma-separated DNS targets set on the annotation" }
        ]
      }
    ]
  },
  {
    slug: "redis",
    name: "@r8s/redis",
    title: "Redis",
    description: "Redis cluster components powered by the OT-Container-Kit Redis Operator. Declares redis-operator and provisions HA Redis clusters and replications.",
    category: "Data & Cache",
    operator: "redis-operator",
    operatorVersion: "0.22.0",
    keywords: [
      "redis",
      "cache",
      "redis-operator",
      "redis cluster",
      "redis replication",
      "data"
    ],
    components: [
      {
        name: "RedisCluster",
        description: "Provisions a RedisCluster with configurable cluster size, persistence, exporter, and resource limits.",
        code: `import { RedisCluster } from '@r8s/redis';

export default (
  <RedisCluster
    name="cache"
    namespace="default"
    clusterSize={3}
    storage="10Gi"
    redisExporter={true}
  />
);`,
        resources: ["RedisCluster (redis.redis.opstreelabs.in/v1beta1)"],
        props: [
          { name: "name", type: "string", required: true, description: "RedisCluster resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "clusterSize", type: "number", required: false, default: "3", description: "Number of Redis cluster nodes" },
          { name: "redisExporter", type: "boolean", required: false, default: "true", description: "Enable the redis-exporter sidecar for metrics" },
          { name: "storage", type: "string", required: false, description: "Persistent volume size (e.g., '10Gi')" },
          { name: "storageClassName", type: "string", required: false, description: "StorageClass for the persistent volume" },
          { name: "redisSecret", type: "{ name: string; key: string }", required: false, description: "Secret containing the Redis password" },
          { name: "resources", type: "{ limits?, requests? }", required: false, default: "{ limits: {cpu:100m,memory:128Mi}, requests: {cpu:100m,memory:128Mi} }", description: "CPU/memory requests and limits for the Redis container" }
        ]
      },
      {
        name: "RedisReplication",
        description: "Provisions a RedisReplication (master-replica) deployment using the Redis Operator.",
        code: `import { RedisReplication } from '@r8s/redis';

export default (
  <RedisReplication
    name="replica-cache"
    namespace="default"
    clusterSize={2}
    storage="10Gi"
  />
);`,
        resources: ["RedisReplication (redis.redis.opstreelabs.in/v1beta1)"],
        props: [
          { name: "name", type: "string", required: true, description: "RedisReplication resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "clusterSize", type: "number", required: false, default: "2", description: "Total number of Redis instances (master + replicas)" },
          { name: "redisExporter", type: "boolean", required: false, default: "true", description: "Enable the redis-exporter sidecar for metrics" },
          { name: "storage", type: "string", required: false, description: "Persistent volume size (e.g., '10Gi')" },
          { name: "storageClassName", type: "string", required: false, description: "StorageClass for the persistent volume" }
        ]
      }
    ]
  },
  {
    slug: "envoy",
    name: "@r8s/envoy",
    title: "Gateway API",
    description: "Envoy Gateway components implementing the Kubernetes Gateway API. Declares envoy-gateway and provisions Gateways, HTTPRoutes, and EnvoyProxy configurations.",
    category: "Networking",
    operator: "envoy-gateway",
    operatorVersion: "1.7.0",
    keywords: [
      "gateway",
      "envoy",
      "envoy-gateway",
      "gateway api",
      "httproute",
      "ingress",
      "networking"
    ],
    components: [
      {
        name: "Gateway",
        description: "Creates a Gateway API Gateway resource managed by Envoy Gateway, with configurable listeners and TLS.",
        code: `import { Gateway } from '@r8s/envoy';

export default (
  <Gateway
    name="public-gateway"
    gatewayClassName="eg"
    listeners={[
      { name: 'https', protocol: 'HTTPS', port: 443, hostname: 'api.example.com' },
    ]}
  />
);`,
        resources: ["Gateway (gateway.networking.k8s.io/v1)"],
        props: [
          { name: "name", type: "string", required: true, description: "Gateway resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "gatewayClassName", type: "string", required: false, default: "eg", description: "GatewayClass controlling this Gateway" },
          { name: "listeners", type: "ListenerConfig[]", required: true, description: "Listeners (protocol, port, hostname, TLS) exposed by the Gateway" },
          { name: "addresses", type: "Array<{ type?, value }>", required: false, description: "Optional addresses to assign to the Gateway" }
        ]
      },
      {
        name: "HTTPRoute",
        description: "Creates an HTTPRoute that attaches to a parent Gateway and routes HTTP traffic to backend services.",
        code: `import { HTTPRoute } from '@r8s/envoy';

export default (
  <HTTPRoute
    name="api-route"
    parentRefs={[{ name: 'public-gateway' }]}
    hostnames={["api.example.com"]}
    rules={[
      {
        matches: [{ path: { type: 'PathPrefix', value: '/api' } }],
        backendRefs: [{ name: 'api-service', port: 80 }],
      },
    ]}
  />
);`,
        resources: ["HTTPRoute (gateway.networking.k8s.io/v1)"],
        props: [
          { name: "name", type: "string", required: true, description: "HTTPRoute resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "parentRefs", type: "Array<{ name, namespace?, sectionName? }>", required: true, description: "Gateways this route attaches to" },
          { name: "hostnames", type: "string[]", required: false, description: "Hostnames the route matches" },
          { name: "rules", type: "Array<{ matches?, backendRefs, filters? }>", required: true, description: "Routing rules with matches, backend refs, and optional filters" }
        ]
      },
      {
        name: "EnvoyProxy",
        description: "Configures the EnvoyProxy resource that controls the data plane (service type, node ports, multi-Gateway merging).",
        code: `import { EnvoyProxy } from '@r8s/envoy';

export default (
  <EnvoyProxy
    name="envoy-proxy"
    namespace="envoy-gateway-system"
    mergeGateways={false}
    serviceType="LoadBalancer"
  />
);`,
        resources: ["EnvoyProxy (gateway.envoyproxy.io/v1alpha1)"],
        props: [
          { name: "name", type: "string", required: true, description: "EnvoyProxy resource name" },
          { name: "namespace", type: "string", required: false, default: "envoy-gateway-system", description: "Kubernetes namespace" },
          { name: "mergeGateways", type: "boolean", required: false, default: "false", description: "Merge all Gateway listeners into a single Envoy deployment" },
          { name: "serviceType", type: "'LoadBalancer' | 'NodePort' | 'ClusterIP'", required: false, default: "LoadBalancer", description: "Service type for the Envoy data plane" },
          { name: "nodePort", type: "number", required: false, description: "Node port used when serviceType is NodePort" }
        ]
      }
    ]
  },
  {
    slug: "prometheus",
    name: "@r8s/prometheus",
    title: "Monitoring",
    description: "Prometheus stack components powered by kube-prometheus-stack. Declares the prometheus operator and provides ServiceMonitors, PrometheusRules, and PodMonitors.",
    category: "Observability",
    operator: "prometheus",
    operatorVersion: "0.72.0",
    keywords: [
      "monitoring",
      "prometheus",
      "grafana",
      "alertmanager",
      "servicemonitor",
      "podmonitor",
      "observability"
    ],
    components: [
      {
        name: "ServiceMonitor",
        description: "Creates a ServiceMonitor that tells Prometheus to scrape metrics from services matching a label selector.",
        code: `import { ServiceMonitor } from '@r8s/prometheus';

export default (
  <ServiceMonitor
    name="api-metrics"
    namespace="production"
    selector={{ matchLabels: { app: 'api' } }}
    endpoints={[{ port: 'metrics', path: '/metrics', interval: '30s' }]}
  />
);`,
        resources: ["ServiceMonitor (monitoring.coreos.com/v1)"],
        props: [
          { name: "name", type: "string", required: true, description: "ServiceMonitor resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "labels", type: "Record<string, string>", required: false, description: "Labels to set on the ServiceMonitor" },
          { name: "selector", type: "{ matchLabels: Record<string,string> }", required: true, description: "Label selector for target Services" },
          { name: "endpoints", type: "Array<{ port, path?, interval?, scrapeTimeout? }>", required: true, description: "Scrape endpoints (port, path, interval, timeout)" }
        ]
      },
      {
        name: "PrometheusRule",
        description: "Creates a PrometheusRule containing alerting groups and rules evaluated by Prometheus.",
        code: `import { PrometheusRule } from '@r8s/prometheus';

export default (
  <PrometheusRule
    name="api-alerts"
    groups={[
      {
        name: 'api.rules',
        interval: '30s',
        rules: [
          { alert: 'HighErrorRate', expr: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.1', for: '5m' },
        ],
      },
    ]}
  />
);`,
        resources: ["PrometheusRule (monitoring.coreos.com/v1)"],
        props: [
          { name: "name", type: "string", required: true, description: "PrometheusRule resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "groups", type: "Array<{ name, interval?, rules }>", required: true, description: "Alerting groups, each containing alert rules (alert, expr, for, labels, annotations)" }
        ]
      },
      {
        name: "PodMonitor",
        description: "Creates a PodMonitor that tells Prometheus to scrape pod metrics directly without requiring a Service.",
        code: `import { PodMonitor } from '@r8s/prometheus';

export default (
  <PodMonitor
    name="worker-metrics"
    selector={{ matchLabels: { app: 'worker' } }}
    podMetricsEndpoints={[{ port: 'metrics', path: '/metrics', interval: '30s' }]}
  />
);`,
        resources: ["PodMonitor (monitoring.coreos.com/v1)"],
        props: [
          { name: "name", type: "string", required: true, description: "PodMonitor resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "labels", type: "Record<string, string>", required: false, description: "Labels to set on the PodMonitor" },
          { name: "selector", type: "{ matchLabels: Record<string,string> }", required: true, description: "Label selector for target Pods" },
          { name: "podMetricsEndpoints", type: "Array<{ port, path?, interval? }>", required: true, description: "Scrape endpoints (port, path, interval)" }
        ]
      }
    ]
  },
  {
    slug: "clickhouse",
    name: "@r8s/clickhouse",
    title: "ClickHouse",
    description: "ClickHouse OLAP database components powered by the Altinity ClickHouse Operator. Declares clickhouse-operator and provisions sharded, replicated clusters with ZooKeeper.",
    category: "Data & Analytics",
    operator: "clickhouse-operator",
    operatorVersion: "0.23.0",
    keywords: [
      "clickhouse",
      "olap",
      "analytics database",
      "clickhouse-operator",
      "altinity",
      "data"
    ],
    components: [
      {
        name: "ClickHouseCluster",
        description: "Provisions a ClickHouseInstallation with configurable shard/replica layout, ZooKeeper, users, profiles, quotas, and pod/volume templates.",
        code: `import { ClickHouseCluster } from '@r8s/clickhouse';

export default (
  <ClickHouseCluster
    name="analytics"
    namespace="default"
    cluster={{ layout: { shardsCount: 2, replicasCount: 2 } }}
    zookeeper={{ nodes: [{ host: 'zk.zookeeper' }] }}
    users={{
      default: { password: 'secret', profile: 'default' },
    }}
  />
);`,
        resources: ["ClickHouseInstallation (clickhouse.altinity.com/v1)"],
        props: [
          { name: "name", type: "string", required: true, description: "ClickHouseInstallation resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "cluster", type: "{ layout?: { shardsCount?, replicasCount? } }", required: false, description: "Cluster topology (shards and replicas)" },
          { name: "zookeeper", type: "{ nodes?: Array<{ host, port? }> }", required: false, description: "ZooKeeper nodes for replication coordination" },
          { name: "users", type: "Record<string, { password?, profile?, quota?, networks?, grants? }>", required: false, description: "ClickHouse users to provision" },
          { name: "profiles", type: "Record<string, Record<string, string>>", required: false, description: "ClickHouse user profiles" },
          { name: "quotas", type: "Record<string, Record<string, string>>", required: false, description: "ClickHouse quotas" },
          { name: "templates", type: "{ podTemplates?, volumeClaimTemplates? }", required: false, description: "Pod and volume claim templates for custom pod specs" }
        ]
      }
    ]
  },
  {
    slug: "logging-operator",
    name: "@r8s/logging-operator",
    title: "Logging",
    description: "Log aggregation components powered by Banzai Cloud's Logging Operator. Declares logging-operator and provisions Logging, Flow, and Output resources.",
    category: "Observability",
    operator: "logging-operator",
    operatorVersion: "4.2.3",
    keywords: [
      "logging",
      "logs",
      "fluentd",
      "fluentbit",
      "banzai",
      "logging-operator",
      "observability"
    ],
    components: [
      {
        name: "Logging",
        description: "Creates the Logging resource that configures Fluentd and Fluent-bit agents with optional resource limits and control namespace.",
        code: `import { Logging } from '@r8s/logging-operator';

export default (
  <Logging
    name="platform-logs"
    namespace="logging"
    controlNamespace="logging"
    fluentd={{ replicas: 2, resources: { limits: { cpu: '500m', memory: '512Mi' } } }}
    fluentbit={{ resources: { limits: { cpu: '100m', memory: '64Mi' } } }}
  />
);`,
        resources: ["Logging (logging.banzaicloud.io/v1beta1)"],
        props: [
          { name: "name", type: "string", required: true, description: "Logging resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "fluentd", type: "{ replicas?, resources? }", required: false, description: "Fluentd aggregator configuration (replicas, resources)" },
          { name: "fluentbit", type: "{ resources? }", required: false, description: "Fluent-bit agent configuration (resources)" },
          { name: "controlNamespace", type: "string", required: false, description: "Namespace where the logging control resources live" }
        ]
      },
      {
        name: "Flow",
        description: "Creates a Flow that selects logs (by label match/exclude), applies filters, and routes them to one or more Output references.",
        code: `import { Flow } from '@r8s/logging-operator';

export default (
  <Flow
    name="app-flow"
    match={[{ select: { labels: { app: 'api' } } }]}
    filters={[
      { parser: { parse: { type: 'regexp', expression: '/^(?<time>\\S+) (?<msg>.*)$/' } } },
    ]}
    outputRefs={["loki-output"]}
  />
);`,
        resources: ["Flow (logging.banzaicloud.io/v1beta1)"],
        props: [
          { name: "name", type: "string", required: true, description: "Flow resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "match", type: "Array<{ select?, exclude? }>", required: false, description: "Selectors for which logs the Flow handles" },
          { name: "filters", type: "Array<{ parser?, grep? }>", required: false, description: "Filters (parser, grep) applied to matched logs" },
          { name: "outputRefs", type: "string[]", required: true, description: "Names of Output resources to send logs to" }
        ]
      },
      {
        name: "Output",
        description: "Creates an Output destination (Loki or S3) that Flows can reference.",
        code: `import { Output } from '@r8s/logging-operator';

export default (
  <Output
    name="loki-output"
    loki={{
      url: 'http://loki.loki:3100',
      configureKubernetesLabels: true,
      labels: { app: 'api' },
    }}
  />
);`,
        resources: ["Output (logging.banzaicloud.io/v1beta1)"],
        props: [
          { name: "name", type: "string", required: true, description: "Output resource name" },
          { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
          { name: "loki", type: "{ url, configureKubernetesLabels?, labels? }", required: false, description: "Loki output configuration" },
          { name: "s3", type: "{ bucket, region, path }", required: false, description: "S3 output configuration" }
        ]
      }
    ]
  },
  {
    slug: "loki",
    name: "@r8s/loki",
    title: "Loki",
    description: "Grafana Loki components for horizontally-scalable log aggregation. Declares the loki operator and provisions LokiStack instances with object storage and AlertingRules.",
    category: "Observability",
    operator: "loki",
    operatorVersion: "5.47.0",
    keywords: [
      "loki",
      "grafana loki",
      "log storage",
      "logs",
      "observability",
      "alerting"
    ],
    components: [
      {
        name: "LokiStack",
        description: "Provisions a Grafana Loki stack (distributed) with object storage, replication, ingestion/retention limits, and per-component resources.",
        code: `import { LokiStack } from '@r8s/loki';

export default (
  <LokiStack
    name="loki"
    namespace="loki"
    storage={{ type: 's3', bucket: 'my-loki-bucket', region: 'eu-north-1' }}
    replication={{ factor: 1 }}
    limits={{
      ingestion: { rate: '10MB', burstSize: '20MB' },
      retention: { period: '30d' },
    }}
  />
);`,
        resources: ["LokiStack (loki.grafana.com/v1)"],
        props: [
          { name: "name", type: "string", required: true, description: "LokiStack resource name" },
          { name: "namespace", type: "string", required: false, default: "loki", description: "Kubernetes namespace" },
          { name: "storage", type: "{ type, bucket?, region?, endpoint? }", required: false, description: "Object storage backend (s3, gcs, azure, filesystem)" },
          { name: "replication", type: "{ factor? }", required: false, description: "Replication factor for log chunks" },
          { name: "limits", type: "{ ingestion?, retention? }", required: false, description: "Ingestion rate/burst and retention period limits" },
          { name: "resources", type: "{ requests?, limits? }", required: false, description: "CPU/memory requests and limits applied to Loki components" }
        ]
      },
      {
        name: "AlertingRule",
        description: "Creates an AlertingRule evaluated by Loki's ruler, for log-metric based alerting.",
        code: `import { AlertingRule } from '@r8s/loki';

export default (
  <AlertingRule
    name="loki-alerts"
    namespace="loki"
    groups={[
      {
        name: 'error-spikes',
        rules: [
          { alert: 'HighErrorRate', expr: 'sum(rate({app="api"} |~ "error"[5m])) > 10', for: '5m' },
        ],
      },
    ]}
  />
);`,
        resources: ["AlertingRule (loki.grafana.com/v1)"],
        props: [
          { name: "name", type: "string", required: true, description: "AlertingRule resource name" },
          { name: "namespace", type: "string", required: false, default: "loki", description: "Kubernetes namespace" },
          { name: "groups", type: "Array<{ name, rules }>", required: true, description: "Alerting groups with rules (alert, expr, for, labels, annotations)" }
        ]
      }
    ]
  }
];

export function getPackageBySlug(slug: string): Package | undefined {
  return packages.find((p) => p.slug === slug);
}

export function getPackageCategories(): string[] {
  return Array.from(new Set(packages.map((p) => p.category)));
}
