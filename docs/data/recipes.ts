export interface Recipe {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  code: string;
  features: string[];
}

export const recipes: Recipe[] = [
  {
    slug: "database",
    title: "Database Recipe — PostgreSQL with CloudNativePG",
    description: "Production-ready PostgreSQL cluster using CloudNativePG operator. High availability, automated backups, and monitoring.",
    keywords: [
      "kubernetes postgresql",
      "cloudnativepg",
      "postgres operator",
      "database boilerplate",
      "k8s database template",
      "postgresql cluster kubernetes",
      "cnpg recipe",
      "postgres infrastructure as code"
    ],
    category: "Data Storage",
    code: `import { Database } from '@r8s/recipes';

export default (
  <Database
    name="app-db"
    storage="10Gi"
    password={process.env.DB_PASSWORD}
  />
);`,
    features: [
      "3-instance HA cluster",
      "Automated backups",
      "Monitoring enabled",
      "Connection pooling",
      "Point-in-time recovery"
    ]
  },
  {
    slug: "web-service",
    title: "Web Service Recipe — Deployment with Health Checks",
    description: "Complete web service with Deployment, Service, Ingress, and automatic TLS. Includes health checks and resource limits.",
    keywords: [
      "kubernetes deployment template",
      "k8s web service boilerplate",
      "deployment service ingress",
      "kubernetes app template",
      "container deployment recipe",
      "k8s microservice template",
      "web service infrastructure"
    ],
    category: "Application",
    code: `import { WebService } from '@r8s/recipes';

export default (
  <WebService
    name="api"
    image="myapp/api:v1"
    port={8080}
    replicas={3}
    resources={{
      requests: { cpu: '100m', memory: '128Mi' },
      limits: { cpu: '500m', memory: '512Mi' }
    }}
  />
);`,
    features: [
      "Deployment + Service",
      "Health checks",
      "Resource limits",
      "Auto-scaling ready",
      "Environment variables"
    ]
  },
  {
    slug: "app",
    title: "App Recipe — Full-Stack Application Template",
    description: "Complete application template with database, web service, ingress, and TLS. The fastest way to deploy a production app.",
    keywords: [
      "kubernetes full stack template",
      "k8s application boilerplate",
      "complete app deployment",
      "full stack infrastructure",
      "app deployment template",
      "kubernetes starter template",
      "production ready template"
    ],
    category: "Complete Solution",
    code: `import { App } from '@r8s/recipes';

export default (
  <App
    name="myapp"
    image="myapp/api:v1"
    host="api.example.com"
    database={{ name: "app-db", storage: "10Gi" }}
    tls={{ issuer: "letsencrypt" }}
  />
);`,
    features: [
      "Database + Web Service",
      "Ingress with TLS",
      "Auto-wired connections",
      "Operator management",
      "Production defaults"
    ]
  },
  {
    slug: "ingress",
    title: "Ingress Recipe — TLS with cert-manager",
    description: "Ingress with automatic TLS certificate management via cert-manager. Includes nginx-ingress and Let's Encrypt integration.",
    keywords: [
      "kubernetes ingress template",
      "cert-manager recipe",
      "tls ingress kubernetes",
      "nginx ingress template",
      "letsencrypt kubernetes",
      "ingress boilerplate",
      "k8s tls configuration"
    ],
    category: "Networking",
    code: `import { Ingress } from '@r8s/recipes';

export default (
  <Ingress
    name="app-ingress"
    host="app.example.com"
    serviceName="app-service"
    servicePort={80}
    tls={{ 
      secretName: "app-tls",
      clusterIssuer: "letsencrypt" 
    }}
  />
);`,
    features: [
      "Automatic TLS",
      "cert-manager integration",
      "nginx-ingress",
      "Let's Encrypt",
      "Custom annotations"
    ]
  },
  {
    slug: "cluster",
    title: "Cluster Recipe — Shared PostgreSQL Cluster",
    description: "Shared PostgreSQL cluster for multiple databases. Reduce resource usage by sharing one CNPG cluster across applications.",
    keywords: [
      "shared database cluster",
      "multi-tenant postgres",
      "shared postgresql kubernetes",
      "database cluster template",
      "cnpg shared cluster",
      "postgres multi-database"
    ],
    category: "Data Storage",
    code: `import { Cluster, Database } from '@r8s/recipes';

export default (
  <Cluster name="main" storage="100Gi">
    <Database name="users-db" password={process.env.USERS_DB_PASSWORD} />
    <Database name="orders-db" password={process.env.ORDERS_DB_PASSWORD} />
    <Database name="inventory-db" password={process.env.INVENTORY_DB_PASSWORD} />
  </Cluster>
);`,
    features: [
      "Shared CNPG cluster",
      "Multiple databases",
      "Resource efficient",
      "Centralized management",
      "Cost optimized"
    ]
  }
];

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return recipes.find(r => r.slug === slug);
}
