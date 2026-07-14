/**
 * Shared routing interfaces for Ingress and Gateway API.
 *
 * These types abstract the common concepts between different
 * routing implementations (nginx Ingress, Envoy Gateway, etc.)
 */

/** Backend target for routing (service + port) */
export interface RouteTarget {
  /** Service name */
  name: string;
  /** Service namespace (if different from route) */
  namespace?: string;
  /** Service port */
  port: number;
  /** Weight for traffic splitting (0-100) */
  weight?: number;
}

/** TLS configuration for routes */
export interface TLSConfig {
  /** TLS termination mode */
  mode?: 'Terminate' | 'Passthrough';
  /** Secret containing TLS certificate */
  secretName?: string;
  /** cert-manager ClusterIssuer name */
  clusterIssuer?: string;
  /** Pre-existing certificate references */
  certificateRefs?: Array<{
    name: string;
    namespace?: string;
  }>;
}

/** A single route rule (host + path → target) */
export interface RouteRule {
  /** Hostname for this route */
  host?: string;
  /** Path matching */
  path?: {
    /** Path match type */
    type?: 'Exact' | 'Prefix' | 'RegularExpression';
    /** Path value */
    value: string;
  };
  /** HTTP method match */
  method?: string;
  /** Header matches */
  headers?: Array<{
    name: string;
    value: string;
    type?: 'Exact' | 'RegularExpression';
  }>;
  /** Backend targets */
  targets: RouteTarget[];
}

/** Common properties for all routing components */
export interface BaseRouteProps {
  /** Route name */
  name: string;
  /** Namespace */
  namespace?: string;
  /** Hostname(s) */
  host?: string;
  hostnames?: string[];
  /** TLS configuration */
  tls?: TLSConfig;
  /** Custom annotations (for Ingress) */
  annotations?: Record<string, string>;
}

/** Listener configuration for Gateway API */
export interface ListenerConfig {
  /** Listener name */
  name: string;
  /** Protocol */
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'TLS' | 'UDP';
  /** Port number */
  port: number;
  /** Hostname for this listener */
  hostname?: string;
  /** TLS config (for HTTPS/TLS) */
  tls?: TLSConfig;
}
