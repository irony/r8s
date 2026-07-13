import { StandardWebApp } from '../templates/standard-web-app';

export default function EcommerceApp() {
  return (
    <StandardWebApp
      name="ecommerce"
      namespace="ecommerce"
      image="ecommerce/shop:v3.2.1"
      domain="shop.example.com"
      port={3000}
      replicas={5}
      dbName="shop"
      enableMonitoring={true}
      enableTracing={true}
    />
  );
}
