import { PublicService, InternalService } from './shared/platform';

export default function EcommercePlatform() {
  return (
    <>
      {/* Public-facing API Gateway */}
      <PublicService
        name="api-gateway"
        namespace="production"
        image="mycompany/api-gateway:v2.1.0"
        port={8080}
        replicas={3}
        domain="api.mycompany.com"
        tlsSecretName="api-tls"
        rateLimit="1000"
        env={[
          { name: 'USER_SERVICE_URL', value: 'http://user-service' },
          { name: 'ORDER_SERVICE_URL', value: 'http://order-service' },
          { name: 'INVENTORY_SERVICE_URL', value: 'http://inventory-service' },
        ]}
        resources={{
          requests: { memory: '256Mi', cpu: '250m' },
          limits: { memory: '512Mi', cpu: '500m' },
        }}
      />

      {/* Internal: User Service */}
      <InternalService
        name="user-service"
        namespace="production"
        image="mycompany/user-service:v1.5.2"
        port={3000}
        replicas={2}
        allowedClients={['api-gateway']}
        env={[
          { name: 'DATABASE_URL', value: 'postgresql://user:pass@user-db:5432/users' },
          { name: 'REDIS_URL', value: 'redis://user-cache:6379' },
        ]}
      />

      {/* Internal: Order Service */}
      <InternalService
        name="order-service"
        namespace="production"
        image="mycompany/order-service:v1.3.0"
        port={3000}
        replicas={3}
        allowedClients={['api-gateway', 'user-service']}
        env={[
          { name: 'DATABASE_URL', value: 'postgresql://order:pass@order-db:5432/orders' },
          { name: 'KAFKA_BROKERS', value: 'kafka:9092' },
        ]}
      />

      {/* Internal: Inventory Service */}
      <InternalService
        name="inventory-service"
        namespace="production"
        image="mycompany/inventory-service:v1.1.0"
        port={3000}
        replicas={2}
        allowedClients={['api-gateway', 'order-service']}
        env={[
          { name: 'DATABASE_URL', value: 'postgresql://inventory:pass@inventory-db:5432/inventory' },
        ]}
      />
    </>
  );
}
