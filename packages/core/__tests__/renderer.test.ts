import { describe, it, expect } from 'vitest';
import { jsx, Fragment } from '../src/jsx-runtime';
import { render } from '../src/renderer';
import { Deployment, Service, ConfigMap } from '@r8s/k8s-types';

// Helper to create elements without JSX transform
const createElement = jsx;

describe('JSX Runtime', () => {
  it('should create a simple element', () => {
    const element = createElement('Deployment', { name: 'test' });
    
    expect(element.type).toBe('Deployment');
    expect(element.props).toEqual({ name: 'test' });
    expect(element.key).toBeNull();
  });

  it('should create element with key', () => {
    const element = createElement('Service', { name: 'svc' }, 'my-key');
    
    expect(element.key).toBe('my-key');
  });

  it('should handle Fragment', () => {
    const element = createElement(Fragment, {});
    
    expect(element.type).toBe(Fragment);
  });
});

describe('Renderer', () => {
  it('should render a raw Kubernetes resource', () => {
    const deployment: Deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'nginx' },
      spec: {
        selector: { matchLabels: { app: 'nginx' } },
        template: {
          metadata: { labels: { app: 'nginx' } },
          spec: {
            containers: [{
              name: 'nginx',
              image: 'nginx:latest',
            }],
          },
        },
      },
    };

    const element = createElement('Deployment', deployment);
    const result = render(element);

    expect(result.resources).toHaveLength(1);
    expect(result.resources[0]).toEqual(deployment);
  });

  it('should render multiple resources from Fragment', () => {
    const deployment: Deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'app' },
      spec: {
        selector: { matchLabels: { app: 'test' } },
        template: {
          metadata: { labels: { app: 'test' } },
          spec: {
            containers: [{
              name: 'app',
              image: 'app:latest',
            }],
          },
        },
      },
    };

    const service: Service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: 'app' },
      spec: {
        selector: { app: 'test' },
        ports: [{ port: 80 }],
      },
    };

    const element = createElement(Fragment, {
      children: [
        createElement('Deployment', deployment),
        createElement('Service', service),
      ],
    });

    const result = render(element);

    expect(result.resources).toHaveLength(2);
    expect(result.resources[0]).toEqual(deployment);
    expect(result.resources[1]).toEqual(service);
  });

  it('should render function components', () => {
    interface AppProps {
      name: string;
      image: string;
    }

    function AppDeployment(props: AppProps): ReturnType<typeof jsx> {
      const deployment: Deployment = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: props.name },
        spec: {
          selector: { matchLabels: { app: props.name } },
          template: {
            metadata: { labels: { app: props.name } },
            spec: {
              containers: [{
                name: props.name,
                image: props.image,
              }],
            },
          },
        },
      };

      return createElement('Deployment', deployment);
    }

    const element = createElement(AppDeployment, {
      name: 'myapp',
      image: 'myapp:v1',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].metadata.name).toBe('myapp');
    expect((result.resources[0] as Deployment).spec.template.spec.containers[0].image).toBe('myapp:v1');
  });

  it('should render function components returning arrays', () => {
    interface PostgresProps {
      name: string;
    }

    function Postgres(props: PostgresProps): ReturnType<typeof jsx>[] {
      const deployment: Deployment = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: props.name },
        spec: {
          selector: { matchLabels: { app: props.name } },
          template: {
            metadata: { labels: { app: props.name } },
            spec: {
              containers: [{
                name: 'postgres',
                image: 'postgres:15',
              }],
            },
          },
        },
      };

      const service: Service = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: { name: props.name },
        spec: {
          selector: { app: props.name },
          ports: [{ port: 5432 }],
        },
      };

      const configMap: ConfigMap = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: `${props.name}-config` },
        data: { 'postgres.conf': 'max_connections = 100' },
      };

      return [
        createElement('Deployment', deployment),
        createElement('Service', service),
        createElement('ConfigMap', configMap),
      ];
    }

    const element = createElement(Postgres, { name: 'mydb' });
    const result = render(element);

    expect(result.resources).toHaveLength(3);
    expect(result.resources[0].kind).toBe('Deployment');
    expect(result.resources[1].kind).toBe('Service');
    expect(result.resources[2].kind).toBe('ConfigMap');
  });

  it('should handle nested function components', () => {
    interface WebAppProps {
      name: string;
      image: string;
      port: number;
    }

    function WebApp(props: WebAppProps): ReturnType<typeof jsx> {
      const deployment: Deployment = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: { name: props.name },
        spec: {
          selector: { matchLabels: { app: props.name } },
          template: {
            metadata: { labels: { app: props.name } },
            spec: {
              containers: [{
                name: props.name,
                image: props.image,
                ports: [{ containerPort: props.port }],
              }],
            },
          },
        },
      };

      return createElement('Deployment', deployment);
    }

    interface FullStackProps {
      appName: string;
      appImage: string;
      appPort: number;
      dbName: string;
    }

    function FullStack(props: FullStackProps): ReturnType<typeof jsx> {
      return createElement(Fragment, {
        children: [
          createElement(WebApp, {
            name: props.appName,
            image: props.appImage,
            port: props.appPort,
          }),
          createElement('Service', {
            apiVersion: 'v1',
            kind: 'Service',
            metadata: { name: props.appName },
            spec: {
              selector: { app: props.appName },
              ports: [{ port: props.appPort }],
            },
          } as Service),
        ],
      });
    }

    const element = createElement(FullStack, {
      appName: 'myapp',
      appImage: 'myapp:v1',
      appPort: 3000,
      dbName: 'mydb',
    });

    const result = render(element);

    expect(result.resources).toHaveLength(2);
    expect(result.resources[0].kind).toBe('Deployment');
    expect(result.resources[1].kind).toBe('Service');
  });

  it('should ignore null and boolean children', () => {
    const deployment: Deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'app' },
      spec: {
        selector: { matchLabels: { app: 'test' } },
        template: {
          metadata: { labels: { app: 'test' } },
          spec: {
            containers: [{
              name: 'app',
              image: 'app:latest',
            }],
          },
        },
      },
    };

    const element = createElement(Fragment, {
      children: [
        null,
        createElement('Deployment', deployment),
        false,
        undefined,
      ],
    });

    const result = render(element);

    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].kind).toBe('Deployment');
  });
});
