import { jsx } from '@r8s/core';
import { Ingress } from '@r8s/k8s-types';

export interface CustomIngressProps {
  name: string;
  namespace?: string;
  host: string;
  serviceName: string;
  servicePort?: number;
  tlsSecretName?: string;
  annotations?: Record<string, string>;
}

/**
 * Simple ingress with automatic TLS via cert-manager.
 * 
 * @example
 * <CustomIngress 
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
    annotations = {},
  } = props;

  const defaultAnnotations: Record<string, string> = {
    'nginx.ingress.kubernetes.io/rewrite-target': '/',
    ...(tlsSecretName && {
      'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
    }),
    ...annotations,
  };

  const ingress: Ingress = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name,
      namespace,
      annotations: defaultAnnotations,
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
