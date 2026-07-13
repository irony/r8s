import { StandardWebApp } from '../templates/standard-web-app';

export default function AnalyticsApp() {
  return (
    <StandardWebApp
      name="analytics"
      namespace="analytics"
      image="analytics/dashboard:v1.0.0"
      domain="analytics.example.com"
      port={8080}
      replicas={2}
      dbName="analytics"
      enableMonitoring={true}
      enableTracing={false}
    />
  );
}
