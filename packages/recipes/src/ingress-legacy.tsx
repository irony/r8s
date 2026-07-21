import { jsx, declareOperator, useContext } from '@r8s/core';
import { Ingress } from '@r8s/k8s-types';
import { OperatorContext } from '@r8s/core/defaults';
import { nginxIngressOperator } from './operators';
import { certManagerOperator } from '@r8s/cert-manager';

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
      rules: [
        {
          host,
          http: {
            paths: [
              {
                path: '/',
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: serviceName,
                    port: { number: servicePort },
                  },
                },
              },
            ],
          },
        },
      ],
      ...(tlsSecretName && {
        tls: [
          {
            hosts: [host],
            secretName: tlsSecretName,
          },
        ],
      }),
    },
  };

  const sharedOperators = useContext(OperatorContext);
  const hasNginxIngress = sharedOperators.some((op) => op.name === 'nginx-ingress');
  const hasCertManager = sharedOperators.some((op) => op.name === 'cert-manager');

  const resources: ReturnType<typeof jsx>[] = [];

  if (!hasNginxIngress) {
    resources.push(declareOperator(nginxIngressOperator()));
  }

  if (tlsSecretName && !hasCertManager) {
    resources.push(declareOperator(certManagerOperator()));
  }

  resources.push(jsx('Ingress', ingress));

  return resources;
}
