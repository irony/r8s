export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface AdvancedExample {
  title: string;
  description: string;
  code: string;
  yaml: string;
}

export interface Recipe {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  code: string;
  yaml: string;
  features: string[];
  parameters: Parameter[];
  advancedExamples: AdvancedExample[];
  operators: string[];
  resources: string[];
}

export const recipes: Recipe[] = [
  {
    slug: "database",
    title: "Database",
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
    yaml: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: app-db
  namespace: default
spec:
  instances: 3
  storage:
    size: 10Gi
  postgresql:
    version: "16"
  bootstrap:
    initdb:
      database: app
      owner: app
  monitoring:
    enabled: true
---
apiVersion: v1
kind: Secret
metadata:
  name: app-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env DB_PASSWORD>`,
    features: [
      "3-instance HA cluster",
      "Automated backups",
      "Monitoring enabled",
      "Connection pooling",
      "Point-in-time recovery"
    ],
    parameters: [
      { name: "name", type: "string", required: true, description: "Database cluster name (used for resource naming)" },
      { name: "storage", type: "string", required: true, description: "Storage size (e.g., '10Gi', '100Gi')" },
      { name: "password", type: "string", required: true, description: "Database password (use env var, never hardcode)" },
      { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
      { name: "instances", type: "number", required: false, default: "3", description: "Number of PostgreSQL instances" },
      { name: "version", type: "string", required: false, default: "16", description: "PostgreSQL version" },
      { name: "backup", type: "object", required: false, description: "Backup configuration (retention, schedule)" },
    ],
    advancedExamples: [
      {
        title: "With Environment Variables",
        description: "Pass database credentials via environment variables",
        code: `import { Database } from '@r8s/recipes';

export default (
  <Database
    name="api-db"
    storage="20Gi"
    password={process.env.DB_PASSWORD}
    env={{
      POSTGRES_DB: "myapp",
      POSTGRES_USER: "appuser",
    }}
  />
);`,
        yaml: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: api-db
  namespace: default
spec:
  instances: 3
  storage:
    size: 20Gi
  postgresql:
    version: "16"
  bootstrap:
    initdb:
      database: myapp
      owner: appuser
  env:
    - name: POSTGRES_DB
      value: "myapp"
    - name: POSTGRES_USER
      value: "appuser"
  monitoring:
    enabled: true
---
apiVersion: v1
kind: Secret
metadata:
  name: api-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env DB_PASSWORD>`
      },
      {
        title: "With Backup Configuration",
        description: "Configure automated backups to S3",
        code: `import { Database } from '@r8s/recipes';

export default (
  <Database
    name="production-db"
    storage="100Gi"
    password={process.env.DB_PASSWORD}
    backup={{
      retention: "30d",
      schedule: "0 2 * * *",
      s3: {
        bucket: "myapp-backups",
        region: "eu-north-1",
      },
    }}
  />
);`,
        yaml: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: production-db
  namespace: default
spec:
  instances: 3
  storage:
    size: 100Gi
  postgresql:
    version: "16"
  backup:
    retentionPolicy: "30d"
    schedule: "0 2 * * *"
    s3:
      bucket: myapp-backups
      region: eu-north-1
      path: /production-db
  monitoring:
    enabled: true
---
apiVersion: v1
kind: Secret
metadata:
  name: production-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env DB_PASSWORD>`
      },
      {
        title: "Combined with Web Service",
        description: "Database + API with auto-wired connection",
        code: `import { Database, WebService } from '@r8s/recipes';

export default (
  <>
    <Database
      name="api-db"
      storage="10Gi"
      password={process.env.DB_PASSWORD}
    />
    <WebService
      name="api"
      image="myapp/api:v1"
      port={8080}
      env={{
        DATABASE_URL: "postgres://appuser:\${process.env.DB_PASSWORD}@api-db:5432/myapp"
      }}
    />
  </>
);`,
        yaml: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: api-db
  namespace: default
spec:
  instances: 3
  storage:
    size: 10Gi
  postgresql:
    version: "16"
  monitoring:
    enabled: true
---
apiVersion: v1
kind: Secret
metadata:
  name: api-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env DB_PASSWORD>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapp/api:v1
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              value: "postgres://appuser:<password>@api-db:5432/myapp"
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: default
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080`
      }
    ],
    operators: ["cnpg (CloudNativePG)"],
    resources: ["Cluster (postgresql.cnpg.io/v1)", "Secret", "ConfigMap"]
  },
  {
    slug: "web-service",
    title: "Web Service",
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
  />
);`,
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapp/api:v1
          ports:
            - containerPort: 8080
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: default
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080`,
    features: [
      "Deployment + Service",
      "Health checks",
      "Resource limits",
      "Auto-scaling ready",
      "Environment variables"
    ],
    parameters: [
      { name: "name", type: "string", required: true, description: "Service name (used for all resources)" },
      { name: "image", type: "string", required: true, description: "Container image (e.g., 'myapp/api:v1')" },
      { name: "port", type: "number", required: true, description: "Container port" },
      { name: "replicas", type: "number", required: false, default: "1", description: "Number of replicas" },
      { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
      { name: "env", type: "object", required: false, description: "Environment variables (key-value map)" },
      { name: "secrets", type: "object", required: false, description: "Secrets to mount (key = env name, value = secret name)" },
      { name: "resources", type: "object", required: false, description: "CPU/memory requests and limits" },
      { name: "healthCheck", type: "object", required: false, description: "Liveness/readiness probe configuration" },
    ],
    advancedExamples: [
      {
        title: "With Resource Limits",
        description: "Set CPU and memory constraints",
        code: `import { WebService } from '@r8s/recipes';

export default (
  <WebService
    name="api"
    image="myapp/api:v1"
    port={8080}
    replicas={3}
    resources={{
      requests: { cpu: "100m", memory: "128Mi" },
      limits: { cpu: "500m", memory: "512Mi" },
    }}
  />
);`,
        yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapp/api:v1
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: default
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080`
      },
      {
        title: "With Environment Variables",
        description: "Pass configuration via env vars",
        code: `import { WebService } from '@r8s/recipes';

export default (
  <WebService
    name="api"
    image="myapp/api:v1"
    port={8080}
    env={{
      NODE_ENV: "production",
      LOG_LEVEL: "info",
      API_KEY: process.env.API_KEY,
    }}
  />
);`,
        yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapp/api:v1
          ports:
            - containerPort: 8080
          env:
            - name: NODE_ENV
              value: "production"
            - name: LOG_LEVEL
              value: "info"
            - name: API_KEY
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: API_KEY
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: default
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080`
      },
      {
        title: "With Health Checks",
        description: "Configure liveness and readiness probes",
        code: `import { WebService } from '@r8s/recipes';

export default (
  <WebService
    name="api"
    image="myapp/api:v1"
    port={8080}
    healthCheck={{
      liveness: {
        path: "/health",
        interval: 30,
      },
      readiness: {
        path: "/ready",
        interval: 10,
      },
    }}
  />
);`,
        yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapp/api:v1
          ports:
            - containerPort: 8080
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: default
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080`
      },
      {
        title: "With Ingress",
        description: "Expose service with TLS",
        code: `import { WebService, Ingress } from '@r8s/recipes';

export default (
  <>
    <WebService
      name="api"
      image="myapp/api:v1"
      port={8080}
    />
    <Ingress
      host="api.example.com"
      serviceName="api"
      servicePort={80}
      tls={{ secretName: "api-tls", clusterIssuer: "letsencrypt" }}
    />
  </>
);`,
        yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapp/api:v1
          ports:
            - containerPort: 8080
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: default
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80`
      }
    ],
    operators: [],
    resources: ["Deployment (apps/v1)", "Service (v1)", "ConfigMap", "Secret"]
  },
  {
    slug: "app",
    title: "App",
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
  />
);`,
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myapp/api:v1
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: default
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  namespace: default
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp
                port:
                  number: 80`,
    features: [
      "Database + Web Service",
      "Ingress with TLS",
      "Auto-wired connections",
      "Operator management",
      "Production defaults"
    ],
    parameters: [
      { name: "name", type: "string", required: true, description: "Application name" },
      { name: "image", type: "string", required: true, description: "Container image" },
      { name: "host", type: "string", required: true, description: "Domain name (e.g., 'api.example.com')" },
      { name: "port", type: "number", required: false, default: "8080", description: "Container port" },
      { name: "replicas", type: "number", required: false, default: "1", description: "Number of replicas" },
      { name: "database", type: "boolean | object", required: false, default: "false", description: "Enable database (true for defaults, or object with name/storage)" },
      { name: "tls", type: "boolean | object", required: false, default: "false", description: "Enable TLS (true for defaults, or object with issuer/secretName)" },
      { name: "env", type: "object", required: false, description: "Environment variables" },
      { name: "secrets", type: "object", required: false, description: "Secrets to mount" },
      { name: "resources", type: "object", required: false, description: "CPU/memory requests and limits" },
    ],
    advancedExamples: [
      {
        title: "Full Production Setup",
        description: "Database, TLS, resource limits, and env vars",
        code: `import { App } from '@r8s/recipes';

export default (
  <App
    name="myapp"
    image="myapp/api:v1.2.3"
    host="api.example.com"
    port={3000}
    replicas={3}
    database={{ name: "myapp-db", storage: "20Gi" }}
    tls={{ issuer: "letsencrypt" }}
    env={{
      NODE_ENV: "production",
      LOG_LEVEL: "info",
    }}
    resources={{
      requests: { cpu: "100m", memory: "128Mi" },
      limits: { cpu: "500m", memory: "512Mi" },
    }}
  />
);`,
        yaml: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: myapp-db
  namespace: default
spec:
  instances: 3
  storage:
    size: 20Gi
  postgresql:
    version: "16"
  monitoring:
    enabled: true
---
apiVersion: v1
kind: Secret
metadata:
  name: myapp-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <auto-generated>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myapp/api:v1.2.3
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: LOG_LEVEL
              value: "info"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: myapp-db-credentials
                  key: uri
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: default
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 3000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: myapp-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp
                port:
                  number: 80`
      },
      {
        title: "Staging Environment",
        description: "Minimal setup for staging",
        code: `import { App } from '@r8s/recipes';

export default (
  <App
    name="myapp-staging"
    image="myapp/api:latest"
    host="staging.example.com"
    replicas={1}
    database={{ name: "staging-db", storage: "5Gi" }}
    env={{
      NODE_ENV: "staging",
      DEBUG: "true",
    }}
  />
);`,
        yaml: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: staging-db
  namespace: default
spec:
  instances: 1
  storage:
    size: 5Gi
  postgresql:
    version: "16"
---
apiVersion: v1
kind: Secret
metadata:
  name: staging-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <auto-generated>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-staging
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp-staging
  template:
    metadata:
      labels:
        app: myapp-staging
    spec:
      containers:
        - name: myapp-staging
          image: myapp/api:latest
          ports:
            - containerPort: 8080
          env:
            - name: NODE_ENV
              value: "staging"
            - name: DEBUG
              value: "true"
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-staging
  namespace: default
spec:
  selector:
    app: myapp-staging
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-staging-ingress
  namespace: default
spec:
  rules:
    - host: staging.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-staging
                port:
                  number: 80`
      },
      {
        title: "Multiple Apps with Shared Database",
        description: "API + Worker sharing the same database",
        code: `import { App, WebService } from '@r8s/recipes';

export default (
  <>
    <App
      name="api"
      image="myapp/api:v1"
      host="api.example.com"
      database={{ name: "app-db", storage: "10Gi" }}
    />
    <WebService
      name="worker"
      image="myapp/worker:v1"
      port={8080}
      env={{
        DATABASE_URL: "postgres://appuser@app-db:5432/app-db",
      }}
    />
  </>
);`,
        yaml: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: app-db
  namespace: default
spec:
  instances: 3
  storage:
    size: 10Gi
  postgresql:
    version: "16"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <auto-generated>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapp/api:v1
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-db-credentials
                  key: uri
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: default
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: default
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      containers:
        - name: worker
          image: myapp/worker:v1
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              value: "postgres://appuser:<password>@app-db:5432/app-db"
---
apiVersion: v1
kind: Service
metadata:
  name: worker
  namespace: default
spec:
  selector:
    app: worker
  ports:
    - port: 80
      targetPort: 8080`
      }
    ],
    operators: ["cnpg (CloudNativePG)", "nginx-ingress", "cert-manager"],
    resources: ["Deployment", "Service", "Ingress", "Cluster (CNPG)", "Secret", "ConfigMap"]
  },
  {
    slug: "ingress",
    title: "Ingress",
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
    yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  tls:
    - hosts:
        - app.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 80`,
    features: [
      "Automatic TLS",
      "cert-manager integration",
      "nginx-ingress",
      "Let's Encrypt",
      "Custom annotations"
    ],
    parameters: [
      { name: "name", type: "string", required: true, description: "Ingress resource name" },
      { name: "host", type: "string", required: true, description: "Domain name" },
      { name: "serviceName", type: "string", required: true, description: "Backend service name" },
      { name: "servicePort", type: "number", required: true, description: "Backend service port" },
      { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
      { name: "tls", type: "object | boolean", required: false, default: "false", description: "TLS configuration (or true for defaults)" },
      { name: "annotations", type: "object", required: false, description: "Ingress annotations (rate limiting, CORS, etc.)" },
      { name: "paths", type: "array", required: false, description: "Custom path rules (default: /)" },
    ],
    advancedExamples: [
      {
        title: "With Rate Limiting",
        description: "Add nginx rate limiting annotations",
        code: `import { Ingress } from '@r8s/recipes';

export default (
  <Ingress
    name="api-ingress"
    host="api.example.com"
    serviceName="api"
    servicePort={80}
    tls={{ secretName: "api-tls", clusterIssuer: "letsencrypt" }}
    annotations={{
      "nginx.ingress.kubernetes.io/rate-limit": "100",
      "nginx.ingress.kubernetes.io/rate-limit-window": "1m",
    }}
  />
);`,
        yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80`
      },
      {
        title: "With CORS",
        description: "Enable CORS for frontend access",
        code: `import { Ingress } from '@r8s/recipes';

export default (
  <Ingress
    name="api-ingress"
    host="api.example.com"
    serviceName="api"
    servicePort={80}
    tls={{ secretName: "api-tls", clusterIssuer: "letsencrypt" }}
    annotations={{
      "nginx.ingress.kubernetes.io/enable-cors": "true",
      "nginx.ingress.kubernetes.io/cors-allow-origin": "https://app.example.com",
    }}
  />
);`,
        yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://app.example.com"
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80`
      },
      {
        title: "Multiple Paths",
        description: "Route different paths to different services",
        code: `import { Ingress } from '@r8s/recipes';

export default (
  <Ingress
    name="app-ingress"
    host="app.example.com"
    serviceName="frontend"
    servicePort={80}
    tls={{ secretName: "app-tls", clusterIssuer: "letsencrypt" }}
    paths={[
      { path: "/", serviceName: "frontend", servicePort: 80 },
      { path: "/api", serviceName: "api", servicePort: 8080 },
      { path: "/ws", serviceName: "websocket", servicePort: 3000 },
    ]}
  />
);`,
        yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  tls:
    - hosts:
        - app.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 8080
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: websocket
                port:
                  number: 3000`
      }
    ],
    operators: ["nginx-ingress", "cert-manager"],
    resources: ["Ingress (networking.k8s.io/v1)", "Secret (TLS)"]
  },
  {
    slug: "cluster",
    title: "Cluster",
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
  </Cluster>
);`,
    yaml: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: main
  namespace: default
spec:
  instances: 3
  storage:
    size: 100Gi
  postgresql:
    version: "16"
  monitoring:
    enabled: true
---
apiVersion: v1
kind: Secret
metadata:
  name: users-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env USERS_DB_PASSWORD>
---
apiVersion: v1
kind: Secret
metadata:
  name: orders-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env ORDERS_DB_PASSWORD>`,
    features: [
      "Shared CNPG cluster",
      "Multiple databases",
      "Resource efficient",
      "Centralized management",
      "Cost optimized"
    ],
    parameters: [
      { name: "name", type: "string", required: true, description: "Cluster name" },
      { name: "storage", type: "string", required: true, description: "Total storage size" },
      { name: "namespace", type: "string", required: false, default: "default", description: "Kubernetes namespace" },
      { name: "instances", type: "number", required: false, default: "3", description: "Number of PostgreSQL instances" },
      { name: "version", type: "string", required: false, default: "16", description: "PostgreSQL version" },
      { name: "children", type: "Database[]", required: false, description: "Database components to create within the cluster" },
    ],
    advancedExamples: [
      {
        title: "Multi-Tenant Setup",
        description: "Separate databases per service with shared infrastructure",
        code: `import { Cluster, Database, WebService } from '@r8s/recipes';

export default (
  <>
    <Cluster name="platform" storage="500Gi">
      <Database name="users-db" password={process.env.USERS_DB_PASSWORD} />
      <Database name="orders-db" password={process.env.ORDERS_DB_PASSWORD} />
      <Database name="inventory-db" password={process.env.INVENTORY_DB_PASSWORD} />
      <Database name="analytics-db" password={process.env.ANALYTICS_DB_PASSWORD} />
    </Cluster>

    <WebService name="api" image="myapp/api:v1" port={8080} />
    <WebService name="worker" image="myapp/worker:v1" port={8080} />
  </>
);`,
        yaml: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: platform
  namespace: default
spec:
  instances: 3
  storage:
    size: 500Gi
  postgresql:
    version: "16"
  monitoring:
    enabled: true
---
apiVersion: v1
kind: Secret
metadata:
  name: users-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env USERS_DB_PASSWORD>
---
apiVersion: v1
kind: Secret
metadata:
  name: orders-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env ORDERS_DB_PASSWORD>
---
apiVersion: v1
kind: Secret
metadata:
  name: inventory-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env INVENTORY_DB_PASSWORD>
---
apiVersion: v1
kind: Secret
metadata:
  name: analytics-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env ANALYTICS_DB_PASSWORD>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myapp/api:v1
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: default
spec:
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      containers:
        - name: worker
          image: myapp/worker:v1
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: worker
  namespace: default
spec:
  selector:
    app: worker
  ports:
    - port: 80
      targetPort: 8080`
      },
      {
        title: "With Backup",
        description: "Shared cluster with centralized backup",
        code: `import { Cluster, Database } from '@r8s/recipes';

export default (
  <Cluster
    name="production"
    storage="1Ti"
    backup={{
      retention: "90d",
      schedule: "0 3 * * *",
      s3: {
        bucket: "company-backups",
        region: "eu-north-1",
      },
    }}
  >
    <Database name="app-db" password={process.env.APP_DB_PASSWORD} />
    <Database name="cache-db" password={process.env.CACHE_DB_PASSWORD} />
  </Cluster>
);`,
        yaml: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: production
  namespace: default
spec:
  instances: 3
  storage:
    size: 1Ti
  postgresql:
    version: "16"
  backup:
    retentionPolicy: "90d"
    schedule: "0 3 * * *"
    s3:
      bucket: company-backups
      region: eu-north-1
      path: /production
  monitoring:
    enabled: true
---
apiVersion: v1
kind: Secret
metadata:
  name: app-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env APP_DB_PASSWORD>
---
apiVersion: v1
kind: Secret
metadata:
  name: cache-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <from env CACHE_DB_PASSWORD>`
      }
    ],
    operators: ["cnpg (CloudNativePG)"],
    resources: ["Cluster (postgresql.cnpg.io/v1)", "Secret", "ConfigMap"]
  }
];

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return recipes.find(r => r.slug === slug);
}
