import { jsx } from '@reactnetes/core';
import { DNSEndpoint } from '@reactnetes/k8s-types';

export interface ExternalDNSRecordProps {
  name: string;
  namespace?: string;
  dnsName: string;
  targets: string[];
  recordType?: string;
  ttl?: number;
}

export function ExternalDNSRecord(props: ExternalDNSRecordProps) {
  const {
    name,
    namespace = 'default',
    dnsName,
    targets,
    recordType = 'A',
    ttl = 300,
  } = props;

  const endpoint: DNSEndpoint = {
    apiVersion: 'externaldns.k8s.io/v1alpha1',
    kind: 'DNSEndpoint',
    metadata: { name, namespace },
    spec: {
      endpoints: [{
        dnsName,
        recordType,
        targets,
        recordTTL: ttl,
      }],
    },
  };

  return jsx('DNSEndpoint', endpoint);
}

export interface ExternalDNSIngressAnnotationProps {
  domain: string;
  targets: string[];
}

export function externalDNSAnnotations(props: ExternalDNSIngressAnnotationProps): Record<string, string> {
  return {
    'external-dns.alpha.kubernetes.io/hostname': props.domain,
    'external-dns.alpha.kubernetes.io/target': props.targets.join(','),
  };
}
