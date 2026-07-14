// Auto-generated Kubernetes TypeScript types
// Based on Kubernetes API v1.28

export interface ObjectMeta {
  name?: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  [key: string]: unknown;
}

export interface LabelSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: Array<{
    key: string;
    operator: string;
    values?: string[];
  }>;
}

export interface Container {
  name: string;
  image: string;
  command?: string[];
  args?: string[];
  ports?: ContainerPort[];
  env?: EnvVar[];
  resources?: ResourceRequirements;
  volumeMounts?: VolumeMount[];
  livenessProbe?: Probe;
  readinessProbe?: Probe;
  startupProbe?: Probe;
}

export interface ContainerPort {
  name?: string;
  containerPort: number;
  protocol?: string;
}

export interface EnvVar {
  name: string;
  value?: string;
  valueFrom?: EnvVarSource;
}

export interface EnvVarSource {
  configMapKeyRef?: {
    name: string;
    key: string;
  };
  secretKeyRef?: {
    name: string;
    key: string;
  };
}

export interface ResourceRequirements {
  limits?: Record<string, string>;
  requests?: Record<string, string>;
}

export interface VolumeMount {
  name: string;
  mountPath: string;
  readOnly?: boolean;
}

export interface Probe {
  httpGet?: HTTPGetAction;
  tcpSocket?: TCPSocketAction;
  exec?: ExecAction;
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  failureThreshold?: number;
  successThreshold?: number;
}

export interface HTTPGetAction {
  path?: string;
  port: number | string;
  host?: string;
  scheme?: string;
}

export interface TCPSocketAction {
  port: number | string;
}

export interface ExecAction {
  command: string[];
}

export interface Volume {
  name: string;
  configMap?: {
    name: string;
  };
  secret?: {
    secretName: string;
  };
  persistentVolumeClaim?: {
    claimName: string;
  };
  emptyDir?: {};
}

export interface PodSpec {
  containers: Container[];
  initContainers?: Container[];
  volumes?: Volume[];
  restartPolicy?: string;
  nodeSelector?: Record<string, string>;
  affinity?: unknown;
  tolerations?: unknown[];
}

export interface PodTemplateSpec {
  metadata?: ObjectMeta;
  spec: PodSpec;
}

// Deployment
export interface Deployment {
  apiVersion: 'apps/v1';
  kind: 'Deployment';
  metadata: ObjectMeta;
  spec: DeploymentSpec;
}

export interface DeploymentSpec {
  replicas?: number;
  selector: LabelSelector;
  template: PodTemplateSpec;
  strategy?: DeploymentStrategy;
}

export interface DeploymentStrategy {
  type?: string;
  rollingUpdate?: {
    maxSurge?: number | string;
    maxUnavailable?: number | string;
  };
}

// StatefulSet
export interface StatefulSet {
  apiVersion: 'apps/v1';
  kind: 'StatefulSet';
  metadata: ObjectMeta;
  spec: StatefulSetSpec;
}

export interface StatefulSetSpec {
  serviceName: string;
  replicas?: number;
  selector: LabelSelector;
  template: PodTemplateSpec;
  volumeClaimTemplates?: PersistentVolumeClaim[];
}

// Service
export interface Service {
  apiVersion: 'v1';
  kind: 'Service';
  metadata: ObjectMeta;
  spec: ServiceSpec;
}

export interface ServiceSpec {
  type?: string;
  selector?: Record<string, string>;
  ports: ServicePort[];
  clusterIP?: string;
}

export interface ServicePort {
  name?: string;
  port: number;
  targetPort?: number | string;
  protocol?: string;
  nodePort?: number;
}

// ConfigMap
export interface ConfigMap {
  apiVersion: 'v1';
  kind: 'ConfigMap';
  metadata: ObjectMeta;
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
}

// Secret
export interface Secret {
  apiVersion: 'v1';
  kind: 'Secret';
  metadata: ObjectMeta;
  type?: string;
  data?: Record<string, string>;
  stringData?: Record<string, string>;
}

// Ingress
export interface Ingress {
  apiVersion: 'networking.k8s.io/v1';
  kind: 'Ingress';
  metadata: ObjectMeta;
  spec: IngressSpec;
}

export interface IngressSpec {
  ingressClassName?: string;
  rules?: IngressRule[];
  tls?: IngressTLS[];
  defaultBackend?: IngressBackend;
}

export interface IngressRule {
  host?: string;
  http: HTTPIngressRuleValue;
}

export interface HTTPIngressRuleValue {
  paths: HTTPIngressPath[];
}

export interface HTTPIngressPath {
  path?: string;
  pathType: string;
  backend: IngressBackend;
}

export interface IngressBackend {
  service?: IngressServiceBackend;
}

export interface IngressServiceBackend {
  name: string;
  port: ServiceBackendPort;
}

export interface ServiceBackendPort {
  number?: number;
  name?: string;
}

export interface IngressTLS {
  hosts?: string[];
  secretName?: string;
}

// PersistentVolumeClaim
export interface PersistentVolumeClaim {
  apiVersion: 'v1';
  kind: 'PersistentVolumeClaim';
  metadata: ObjectMeta;
  spec: PersistentVolumeClaimSpec;
}

export interface PersistentVolumeClaimSpec {
  accessModes: string[];
  resources?: ResourceRequirements;
  storageClassName?: string;
  volumeMode?: string;
}

// Union type for all Kubernetes resources
export type KubernetesResource =
  | Deployment
  | StatefulSet
  | Service
  | ConfigMap
  | Secret
  | Ingress
  | PersistentVolumeClaim;

// Operator CRDs
export * from './cert-manager';
export * from './external-dns';
export * from './vault';
export * from './keycloak';
export * from './cnpg';

// Operator base types
export * from './operator';

// Shared routing abstractions
export * from './routing';
