import { Fragment } from '@reactnetes/core';
import { WebApp, Database } from '../../components/shared';

export default function Production() {
  return (
    <>
      <Database
        name="app-db"
        namespace="production"
        storage="50Gi"
        password="${DB_PASSWORD}"  // Use external secret management
      />

      <WebApp
        name="app"
        namespace="production"
        image="myapp/app:v1.2.3"
        replicas={5}
        dbHost="app-db"
        dbPassword="${DB_PASSWORD}"
        ingressHost="myapp.example.com"
        tlsSecretName="myapp-tls"
        enableHPA={true}
      />
    </>
  );
}
