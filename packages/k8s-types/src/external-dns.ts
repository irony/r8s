// external-dns CRDs
// https://github.com/kubernetes-sigs/external-dns

export interface DNSEndpoint {
  apiVersion: 'externaldns.k8s.io/v1alpha1';
  kind: 'DNSEndpoint';
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
  };
  spec: {
    endpoints: Array<{
      dnsName: string;
      recordType: string;
      targets: string[];
      recordTTL?: number;
    }>;
  };
}
