import { Fragment } from '@r8s/core';
import { WebApp, Database } from '../../components/shared';

export default function Staging() {
  return (
    <>
      <Database
        name="app-db"
        namespace="staging"
        storage="5Gi"
        password="staging-password"
      />

      <WebApp
        name="app"
        namespace="staging"
        image="myapp/app:staging"
        replicas={1}
        dbHost="app-db"
        dbPassword="staging-password"
        ingressHost="staging.myapp.example.com"
      />
    </>
  );
}
