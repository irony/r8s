import { jsx } from '@r8s/core';
import { DNSEndpoint } from '@r8s/k8s-types';
import { manifestOperator } from '@r8s/k8s-types';

/** ExternalDNS operator declaration */
export const externalDNSOperator = (version = '0.14.0') =>
  manifestOperator(
    'external-dns',
    `https://raw.githubusercontent.com/kubernetes-sigs/external-dns/v${version}/docs/sources/manifest.yaml`,
    version,
    {
      description: 'ExternalDNS for automatic DNS management',
      namespace: 'external-dns',
    }
  );

export interface ExternalDNSRecordProps {
  name: string;
  namespace?: string;
  dnsName: string;
  targets: string[];
  recordType?: string;
  ttl?: number;
}

export function ExternalDNSRecord(props: ExternalDNSRecordProps) {
  const { name, namespace = 'default', dnsName, targets, recordType = 'A', ttl = 300 } = props;

  const endpoint: DNSEndpoint = {
    apiVersion: 'externaldns.k8s.io/v1alpha1',
    kind: 'DNSEndpoint',
    metadata: { name, namespace },
    spec: {
      endpoints: [
        {
          dnsName,
          recordType,
          targets,
          recordTTL: ttl,
        },
      ],
    },
  };

  return jsx('DNSEndpoint', endpoint);
}

export interface ExternalDNSIngressAnnotationProps {
  domain: string;
  targets: string[];
}

export function externalDNSAnnotations(
  props: ExternalDNSIngressAnnotationProps
): Record<string, string> {
  return {
    'external-dns.alpha.kubernetes.io/hostname': props.domain,
    'external-dns.alpha.kubernetes.io/target': props.targets.join(','),
  };
}
