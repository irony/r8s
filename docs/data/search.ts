export interface SearchEntry {
  title: string;
  description: string;
  href: string;
  category: 'Pages' | 'Recipes' | 'Components' | 'Operators' | 'Packages';
  keywords?: string[];
}

export const searchEntries: SearchEntry[] = [
  {
    title: 'Overview',
    description: 'r8s — Kubernetes manifests as TSX components. Stop writing YAML, start composing infrastructure.',
    href: '/',
    category: 'Pages',
    keywords: ['home', 'intro', 'start', 'r8s', 'overview'],
  },
  {
    title: 'Core Concepts',
    description: 'JSX factory, function components, context system, and type safety for Kubernetes resources.',
    href: '/core',
    category: 'Pages',
    keywords: ['core', 'jsx', 'context', 'renderer', 'types', 'composition'],
  },
  {
    title: 'Recipes',
    description: 'Browse all pre-built infrastructure recipes — Database, WebService, App, Ingress, Cluster.',
    href: '/recipes',
    category: 'Pages',
    keywords: ['recipes', 'list', 'browse', 'components'],
  },
  {
    title: 'Operators & Dependencies',
    description: 'How r8s tracks Kubernetes operator dependencies explicitly, type-safely, and version-pinned.',
    href: '/operators',
    category: 'Pages',
    keywords: ['operators', 'dependencies', 'helm', 'declareOperator', 'OperatorContext'],
  },
  {
    title: 'Packages',
    description: 'Browse all operator-backed infrastructure packages — cert-manager, OpenBao, Keycloak, ExternalDNS, Redis, Gateway, Monitoring, ClickHouse, Logging, Loki.',
    href: '/packages',
    category: 'Pages',
    keywords: ['packages', 'list', 'browse', 'operators', 'components'],
  },
  {
    title: 'Deployment',
    description: 'GitHub Actions auto-render, FluxCD controller, webhooks, and GitOps workflows.',
    href: '/deployment',
    category: 'Pages',
    keywords: ['deployment', 'ci', 'cd', 'gitops', 'flux', 'fluxcd', 'argocd', 'github actions'],
  },
  {
    title: 'Testing',
    description: 'Test r8s components with Vitest. Write guardrails that verify infrastructure meets policy.',
    href: '/testing',
    category: 'Pages',
    keywords: ['testing', 'vitest', 'tests', 'validate', 'guardrails', 'jest'],
  },
  {
    title: 'Database',
    description: 'Production-ready PostgreSQL cluster using CloudNativePG operator. HA, backups, monitoring.',
    href: '/recipes/database',
    category: 'Recipes',
    keywords: [
      'database', 'postgresql', 'postgres', 'cnpg', 'cloudnativepg',
      'cloudnative-pg', 'kubernetes database', 'k8s database', 'sql', 'ha cluster',
    ],
  },
  {
    title: 'Web Service',
    description: 'Deployment + Service with health checks and resource limits. Production web service boilerplate.',
    href: '/recipes/web-service',
    category: 'Recipes',
    keywords: [
      'web service', 'webservice', 'deployment', 'microservice', 'api',
      'kubernetes deployment', 'container', 'health checks', 'replicas',
    ],
  },
  {
    title: 'App',
    description: 'Complete application template: database, web service, ingress, and TLS. The fastest way to ship.',
    href: '/recipes/app',
    category: 'Recipes',
    keywords: [
      'app', 'application', 'fullstack', 'full stack', 'complete app',
      'boilerplate', 'starter', 'production ready', 'template',
    ],
  },
  {
    title: 'Ingress',
    description: 'Ingress with automatic TLS via cert-manager. nginx-ingress and Let\'s Encrypt integration.',
    href: '/recipes/ingress',
    category: 'Recipes',
    keywords: [
      'ingress', 'tls', 'cert-manager', 'letsencrypt', 'nginx-ingress',
      'routing', 'https', 'certificate', 'cors', 'rate limit',
    ],
  },
  {
    title: 'Cluster',
    description: 'Shared PostgreSQL cluster for multiple databases. Reduce resources by sharing one CNPG cluster.',
    href: '/recipes/cluster',
    category: 'Recipes',
    keywords: [
      'cluster', 'shared cluster', 'multi-tenant', 'multi-tenant postgres',
      'cnpg shared', 'postgres multi-database', 'shared postgresql',
    ],
  },
  {
    title: '@r8s/core',
    description: 'JSX factory + all Kubernetes API components (<deployment>, <service>, <ingress>, etc.).',
    href: '/core',
    category: 'Components',
    keywords: ['core', 'package', 'jsx factory', 'renderer', 'context', 'deployment', 'service', 'configmap', 'secret'],
  },
  {
    title: '@r8s/recipes',
    description: 'Pre-built components: <App>, <Database>, <Ingress>, <WebService>, <Cluster>. cnpg + nginx-ingress.',
    href: '/recipes',
    category: 'Components',
    keywords: ['recipes', 'package', 'prebuilt', 'components', 'app', 'database', 'ingress', 'webservice', 'cluster'],
  },
  {
    title: '@r8s/cert-manager',
    description: 'TLS certificate components. Declares the cert-manager operator.',
    href: '/packages/cert-manager',
    category: 'Packages',
    keywords: ['cert-manager', 'certmanager', 'tls', 'certificate', 'letsencrypt', 'package', 'components'],
  },
  {
    title: '@r8s/openbao',
    description: 'Secret management components powered by OpenBao. Declares vault-secrets-operator.',
    href: '/packages/openbao',
    category: 'Packages',
    keywords: ['openbao', 'vault', 'openbao', 'secret management', 'vault-secrets-operator', 'package'],
  },
  {
    title: '@r8s/keycloak',
    description: 'Identity management components. Declares the keycloak-operator.',
    href: '/packages/keycloak',
    category: 'Packages',
    keywords: ['keycloak', 'identity', 'sso', 'saml', 'oidc', 'oauth', 'package', 'components'],
  },
  {
    title: '@r8s/external-dns',
    description: 'DNS management components. Declares the external-dns operator.',
    href: '/packages/external-dns',
    category: 'Packages',
    keywords: ['external-dns', 'external dns', 'dns', 'route53', 'cloudflare', 'package', 'components'],
  },
  {
    title: '@r8s/redis',
    description: 'Redis cluster components. Declares the redis-operator.',
    href: '/packages/redis',
    category: 'Packages',
    keywords: ['redis', 'cache', 'redis-operator', 'package', 'components'],
  },
  {
    title: '@r8s/envoy',
    description: 'Envoy Gateway (Gateway API) components. Declares envoy-gateway.',
    href: '/packages/envoy',
    category: 'Packages',
    keywords: ['envoy', 'envoy-gateway', 'gateway api', 'ingress', 'package', 'components'],
  },
  {
    title: '@r8s/prometheus',
    description: 'Prometheus stack components. Declares kube-prometheus-stack.',
    href: '/packages/prometheus',
    category: 'Packages',
    keywords: ['prometheus', 'grafana', 'alertmanager', 'observability', 'package', 'components'],
  },
  {
    title: '@r8s/clickhouse',
    description: 'ClickHouse database components. Declares clickhouse-operator.',
    href: '/packages/clickhouse',
    category: 'Packages',
    keywords: ['clickhouse', 'olap', 'analytics database', 'clickhouse-operator', 'package', 'components'],
  },
  {
    title: '@r8s/logging-operator',
    description: 'Log aggregation components (Banzai Cloud). Declares logging-operator.',
    href: '/packages/logging-operator',
    category: 'Packages',
    keywords: ['logging', 'logs', 'fluentd', 'fluentbit', 'banzai', 'logging-operator', 'package', 'components'],
  },
  {
    title: '@r8s/loki',
    description: 'Grafana Loki components for log storage. Declares the loki operator.',
    href: '/packages/loki',
    category: 'Packages',
    keywords: ['loki', 'grafana loki', 'log storage', 'logs', 'package', 'components'],
  },
  {
    title: '@r8s/r8s-controller',
    description: 'In-cluster TSX rendering controller for FluxCD integration. Render TSX in the cluster.',
    href: '/deployment',
    category: 'Components',
    keywords: ['r8s-controller', 'controller', 'in-cluster', 'rendering', 'flux', 'fluxcd', 'package'],
  },
  {
    title: '@r8s/flux-controller',
    description: 'FluxCD source controller for in-cluster TSX rendering.',
    href: '/deployment',
    category: 'Components',
    keywords: ['flux-controller', 'flux', 'fluxcd', 'source controller', 'package'],
  },
  {
    title: 'cnpg (CloudNativePG)',
    description: 'PostgreSQL operator — required by <Database/> and <Cluster/> recipes.',
    href: '/operators',
    category: 'Operators',
    keywords: ['cnpg', 'cloudnativepg', 'postgres', 'postgresql', 'operator'],
  },
  {
    title: 'nginx-ingress',
    description: 'Ingress controller — required by <Ingress/> and <App/> recipes.',
    href: '/operators',
    category: 'Operators',
    keywords: ['nginx-ingress', 'nginx', 'ingress controller', 'operator'],
  },
  {
    title: 'cert-manager',
    description: 'TLS certificate operator — declared by @r8s/cert-manager and ingress with TLS.',
    href: '/operators',
    category: 'Operators',
    keywords: ['cert-manager', 'certmanager', 'certificates', 'tls', 'letsencrypt', 'operator'],
  },
  {
    title: 'vault-secrets-operator',
    description: 'Secret management operator — declared by @r8s/openbao.',
    href: '/operators',
    category: 'Operators',
    keywords: ['vault-secrets-operator', 'vault', 'openbao', 'secret management', 'operator'],
  },
  {
    title: 'keycloak-operator',
    description: 'Identity management operator — declared by @r8s/keycloak.',
    href: '/operators',
    category: 'Operators',
    keywords: ['keycloak-operator', 'keycloak', 'identity', 'sso', 'operator'],
  },
  {
    title: 'external-dns',
    description: 'DNS management operator — declared by @r8s/external-dns.',
    href: '/operators',
    category: 'Operators',
    keywords: ['external-dns', 'dns', 'route53', 'cloudflare', 'operator'],
  },
  {
    title: 'envoy-gateway',
    description: 'Gateway API operator — declared by @r8s/envoy.',
    href: '/operators',
    category: 'Operators',
    keywords: ['envoy-gateway', 'envoy', 'gateway api', 'operator'],
  },
  {
    title: 'redis-operator',
    description: 'Redis operator — declared by @r8s/redis.',
    href: '/operators',
    category: 'Operators',
    keywords: ['redis-operator', 'redis', 'operator'],
  },
  {
    title: 'kube-prometheus-stack',
    description: 'Prometheus stack operator — declared by @r8s/prometheus.',
    href: '/operators',
    category: 'Operators',
    keywords: ['kube-prometheus-stack', 'prometheus', 'grafana', 'monitoring', 'operator'],
  },
  {
    title: 'clickhouse-operator',
    description: 'ClickHouse operator — declared by @r8s/clickhouse.',
    href: '/operators',
    category: 'Operators',
    keywords: ['clickhouse-operator', 'clickhouse', 'operator'],
  },
  {
    title: 'logging-operator',
    description: 'Banzai Cloud logging operator — declared by @r8s/logging-operator.',
    href: '/operators',
    category: 'Operators',
    keywords: ['logging-operator', 'banzai', 'fluentd', 'fluentbit', 'logging', 'operator'],
  },
  {
    title: 'loki',
    description: 'Grafana Loki operator — declared by @r8s/loki.',
    href: '/operators',
    category: 'Operators',
    keywords: ['loki', 'grafana', 'log storage', 'operator'],
  },
];

export function search(entries: SearchEntry[], query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  const terms = q.split(/\s+/).filter(Boolean);
  return entries
    .map((entry) => {
      const haystack = [
        entry.title,
        entry.description,
        entry.category,
        ...(entry.keywords ?? []),
      ].join(' ').toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (entry.title.toLowerCase().startsWith(term)) score += 100;
        if (entry.title.toLowerCase().includes(term)) score += 40;
        if ((entry.keywords ?? []).some((k) => k.toLowerCase() === term)) score += 30;
        if (haystack.includes(term)) score += 5;
      }
      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => entry);
}
