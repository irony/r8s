import { jsx, useContext, declareOperator } from '@r8s/core';
import { Ingress } from '@r8s/k8s-types';
import { OperatorContext } from '@r8s/core/defaults';
import { nginxIngressOperator } from './operators';
import { certManagerOperator } from '@r8s/cert-manager';

export interface IngressProps {
  name: string;
  namespace?: string;
  host: string;
  serviceName: string;
  servicePort?: number;
  tlsSecretName?: string;
  annotations?: Record<string, string>;
  /** cert-manager version override */
  certManagerVersion?: string;
  /** nginx-ingress version override */
  nginxIngressVersion?: string;
}

/**
 * Ingress with automatic TLS via cert-manager and explicit operator dependencies.
 *
 * Declares nginx-ingress and cert-manager (when TLS is enabled) as dependencies.
 * If operators are already provided via OperatorContext, they won't be duplicated.
 *
 * @example
 * <Ingress
 *   name="app"
 *   host="app.example.com"
 *   serviceName="frontend"
 * />
 *
 * // With TLS - also declares cert-manager dependency
 * <Ingress
 *   name="app"
 *   host="app.example.com"
 *   serviceName="frontend"
 *   tlsSecretName="app-tls"
 * />
 */
export function Ingress(props: IngressProps) {
  const {
    name,
    namespace = 'default',
    host,
    serviceName,
    servicePort = 80,
    tlsSecretName,
    annotations = {},
    certManagerVersion,
    nginxIngressVersion,
  } = props;

  const sharedOperators = useContext(OperatorContext);

  // Check which operators are already provided
  const hasNginxIngress = sharedOperators.some(op => op.name === 'nginx-ingress');
  const hasCertManager = sharedOperators.some(op => op.name === 'cert-manager');

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
        ...annotations,
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

  const resources: ReturnType<typeof jsx>[] = [];

  // Declare nginx-ingress operator if not already provided
  if (!hasNginxIngress) {
    resources.push(
      declareOperator(nginxIngressOperator(nginxIngressVersion))
    );
  }

  // Declare cert-manager operator if TLS is enabled and not already provided
  if (tlsSecretName && !hasCertManager) {
    resources.push(
      declareOperator(certManagerOperator(certManagerVersion))
    );
  }

  resources.push(jsx('Ingress', ingress));

  return resources;
}
