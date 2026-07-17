import { jsx } from '@r8s/core';
import { helmOperator } from '@r8s/k8s-types';
import type { BaseRouteProps, RouteTarget, TLSConfig, ListenerConfig } from '@r8s/k8s-types';

/** Envoy Gateway operator declaration */
export const envoyGatewayOperator = (version = '1.7.0') =>
  helmOperator('envoy-gateway', 'gateway-helm', 'oci://docker.io/envoyproxy', version, {
    description: 'Envoy Gateway - Kubernetes Gateway API implementation',
    namespace: 'envoy-gateway-system',
    crds: [
      'gatewayclasses.gateway.networking.k8s.io',
      'gateways.gateway.networking.k8s.io',
      'httproutes.gateway.networking.k8s.io',
      'grpcroutes.gateway.networking.k8s.io',
      'tlsroutes.gateway.networking.k8s.io',
      'tcproutes.gateway.networking.k8s.io',
      'udproutes.gateway.networking.k8s.io',
      'envoyproxies.gateway.envoyproxy.io',
    ],
  });

export interface GatewayProps {
  name: string;
  namespace?: string;
  gatewayClassName?: string;
  listeners: ListenerConfig[];
  addresses?: Array<{
    type?: 'IPAddress' | 'Hostname';
    value: string;
  }>;
}

/**
 * Gateway resource using Gateway API (Envoy Gateway).
 *
 * Requires Envoy Gateway operator to be installed.
 *
 * @example
 * <Gateway
 *   name="public-gateway"
 *   namespace="envoy-gateway-system"
 *   gatewayClassName="eg"
 *   listeners={[
 *     { name: 'https', protocol: 'HTTPS', port: 443, hostname: 'api.example.com' },
 *   ]}
 * />
 */
export function Gateway(props: GatewayProps) {
  const { name, namespace = 'default', gatewayClassName = 'eg', listeners, addresses } = props;

  const gateway = {
    apiVersion: 'gateway.networking.k8s.io/v1',
    kind: 'Gateway',
    metadata: { name, namespace },
    spec: {
      gatewayClassName,
      listeners: listeners.map((l) => ({
        name: l.name,
        protocol: l.protocol,
        port: l.port,
        ...(l.hostname && { hostname: l.hostname }),
        ...(l.tls && {
          tls: {
            mode: l.tls.mode || 'Terminate',
            ...(l.tls.certificateRefs && {
              certificateRefs: l.tls.certificateRefs,
            }),
          },
        }),
      })),
      ...(addresses && { addresses }),
    },
  };

  return jsx('Gateway', gateway);
}

export interface HTTPRouteProps {
  name: string;
  namespace?: string;
  parentRefs: Array<{
    name: string;
    namespace?: string;
    sectionName?: string;
  }>;
  hostnames?: string[];
  rules: Array<{
    matches?: Array<{
      path?: {
        type?: 'Exact' | 'PathPrefix' | 'RegularExpression';
        value: string;
      };
      method?: string;
      headers?: Array<{
        name: string;
        value: string;
        type?: 'Exact' | 'RegularExpression';
      }>;
    }>;
    backendRefs: RouteTarget[];
    filters?: Array<{
      type:
        | 'URLRewrite'
        | 'RequestHeaderModifier'
        | 'ResponseHeaderModifier'
        | 'RequestRedirect'
        | 'RequestMirror'
        | 'ExtensionRef';
      urlRewrite?: {
        hostname?: string;
        path?: {
          type: 'ReplaceFullPath' | 'ReplacePrefixMatch';
          replaceFullPath?: string;
          replacePrefixMatch?: string;
        };
      };
    }>;
  }>;
}

/**
 * HTTPRoute for Gateway API routing.
 */
export function HTTPRoute(props: HTTPRouteProps) {
  const { name, namespace = 'default', parentRefs, hostnames, rules } = props;

  const route = {
    apiVersion: 'gateway.networking.k8s.io/v1',
    kind: 'HTTPRoute',
    metadata: { name, namespace },
    spec: {
      parentRefs,
      ...(hostnames && { hostnames }),
      rules: rules.map((r) => ({
        ...(r.matches && {
          matches: r.matches.map((m) => ({
            ...(m.path && { path: m.path }),
            ...(m.method && { method: m.method }),
            ...(m.headers && { headers: m.headers }),
          })),
        }),
        backendRefs: r.backendRefs,
        ...(r.filters && { filters: r.filters }),
      })),
    },
  };

  return jsx('HTTPRoute', route);
}

export interface EnvoyProxyProps {
  name: string;
  namespace?: string;
  mergeGateways?: boolean;
  serviceType?: 'LoadBalancer' | 'NodePort' | 'ClusterIP';
  nodePort?: number;
}

/**
 * EnvoyProxy configuration for Envoy Gateway.
 */
export function EnvoyProxy(props: EnvoyProxyProps) {
  const {
    name,
    namespace = 'envoy-gateway-system',
    mergeGateways = false,
    serviceType = 'LoadBalancer',
    nodePort,
  } = props;

  const proxy = {
    apiVersion: 'gateway.envoyproxy.io/v1alpha1',
    kind: 'EnvoyProxy',
    metadata: { name, namespace },
    spec: {
      ...(mergeGateways && { mergeGateways }),
      provider: {
        type: 'Kubernetes',
        kubernetes: {
          envoyService: {
            ...(nodePort && {
              patch: {
                type: 'StrategicMerge',
                value: {
                  spec: {
                    ports: [
                      {
                        name: `https-${nodePort}`,
                        port: nodePort,
                        nodePort,
                        protocol: 'TCP',
                        targetPort: nodePort,
                      },
                    ],
                  },
                },
              },
            }),
          },
        },
      },
    },
  };

  return jsx('EnvoyProxy', proxy);
}
