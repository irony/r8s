import { jsx } from '@reactnetes/core';
import { Ingress } from '@reactnetes/k8s-types';

export interface CustomIngressProps {
  name: string;
  namespace?: string;
  host: string;
  serviceName: string;
  servicePort?: number;
  tlsSecretName?: string;
}

/**
 * Simple ingress with automatic TLS via cert-manager.
 * 
 * @example
 * <Ingress 
 *   name="app" 
 *   host="app.example.com" 
 *   serviceName="frontend" 
 * />
 */
export function CustomIngress(props: CustomIngressProps) {
  const {
    name,
    namespace = 'default',
    host,
    serviceName,
    servicePort = 80,
    tlsSecretName,
  } = props;

  const ingress: Ingress = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name,
      namespace,
      annotations: {
        'nginx.ingress.kubernetes.io/rewrite-target': '/',
        ...(tlsSecretName && {
          'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
        }),
      },
    },
    spec: {
      ingressClassName: 'nginx',
      rules: [{
        host,
        http: {
          paths: [{
            path: '/',
            pathType: 'Prefix',
            backend: {
              service: {
                name: serviceName,
                port: { number: servicePort },
              },
            },
          }],
        },
      }],
      ...(tlsSecretName && {
        tls: [{
          hosts: [host],
          secretName: tlsSecretName,
        }],
      }),
    },
  };

  return jsx('Ingress', ingress);
}
