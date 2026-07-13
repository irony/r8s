import { jsx } from '@reactnetes/core';
import { Database } from './database';
import { WebService } from './web-service';
import { Ingress } from './ingress';

export interface AppProps {
  name: string;
  namespace?: string;
  domain: string;
  image: string;
  port?: number;
  replicas?: number;
  database?: boolean;
  tls?: boolean;
}

/**
 * Complete application stack.
 * 
 * Composes Database + WebService + Ingress into one component.
 * 
 * @example
 * <App 
 *   name="myapp"
 *   domain="myapp.example.com"
 *   image="myapp/api:v1"
 *   database={true}
 *   tls={true}
 * />
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

  return resources;
}
