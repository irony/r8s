import { jsx, useContext } from '@r8s/core';
import { Database } from './database';
import { WebService } from './web-service';
import { Ingress } from './ingress';
import { DatabaseContext, OperatorContext } from '@r8s/core/defaults';

export interface AppProps {
  name: string;
  namespace?: string;
  domain: string;
  image: string;
  port?: number;
  replicas?: number;
  database?: boolean;
  tls?: boolean;
  children?: unknown;
}

/**
 * Complete application stack with composition support and explicit operators.
 *
 * Composes Database + WebService + Ingress into one component.
 * When database={true}, sets DatabaseContext for child components.
 *
 * Each sub-component declares its own operator dependencies, so:
 * - database=true → CNPG operator
 * - tls=true → cert-manager operator
 * - Ingress → nginx-ingress operator
 *
 * @example
 * // Standalone - auto-declares all needed operators
 * <App name="myapp" domain="myapp.example.com" image="myapp/api:v1" database={true} tls={true} />
 *
 * // With shared operators via context
 * <OperatorContext.Provider value={[cnpgOperator('1.22.5'), certManagerOperator('1.14.0')]}>
 *   <App name="myapp" domain="myapp.example.com" image="myapp/api:v1" database={true} tls={true} />
 * </OperatorContext.Provider>
 *
 * // With children that need database access
 * <App name="api" domain="api.example.com" image="myapp/api:v1" database={true}>
 *   <AnalyticsWorker />
 * </App>
 */
export function App(props: AppProps) {
  const {
    name,
    namespace = 'default',
    domain,
    image,
    port = 3000,
    replicas = 2,
    database = false,
    tls = false,
    children,
  } = props;

  const resources: ReturnType<typeof jsx>[] = [];

  if (database) {
    resources.push(
      jsx(Database, { name: `${name}-db`, namespace, storage: '10Gi' })
    );
  }

  resources.push(
    jsx(WebService, {
      name,
      namespace,
      image,
      port,
      replicas,
      env: database ? [
        {
          name: 'DATABASE_URL',
          valueFrom: {
            secretKeyRef: {
              name: `${name}-db-credentials`,
              key: 'uri',
            },
          },
        },
      ] : [],
    })
  );

  resources.push(
    jsx(Ingress, {
      name: `${name}-ingress`,
      namespace,
      host: domain,
      serviceName: name,
      servicePort: 80,
      ...(tls && { tlsSecretName: `${name}-tls` }),
    })
  );

  if (children) {
    resources.push(jsx('Fragment', { children }));
  }

  return resources;
}
