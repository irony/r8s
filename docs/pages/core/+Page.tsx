import { CodeBlock } from "../../components/CodeBlock";

const basicComponentCode = `import { jsx } from '@r8s/core';

function MyComponent(props: { name: string }) {
  return jsx('Deployment', {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name: props.name },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: props.name } },
      template: {
        metadata: { labels: { app: props.name } },
        spec: {
          containers: [{
            name: props.name,
            image: 'nginx:alpine',
          }],
        },
      },
    },
  });
}`;

const jsxComponentCode = `function MyComponent(props: { name: string }) {
  return (
    <Deployment
      metadata={{ name: props.name }}
      spec={{
        replicas: 1,
        selector: { matchLabels: { app: props.name } },
        template: {
          metadata: { labels: { app: props.name } },
          spec: {
            containers: [{
              name: props.name,
              image: 'nginx:alpine',
            }],
          },
        },
      }}
    />
  );
}`;

export default function Page() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl tracking-tight">Core Concepts</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-base leading-relaxed">
          r8s components are TypeScript functions that return Kubernetes resources.
          They follow the same patterns as React components but render infrastructure instead of DOM.
        </p>

        <h2 className="text-2xl mt-8 mb-4">Basic Component</h2>
        <CodeBlock code={basicComponentCode} language="tsx" />

        <h2 className="text-2xl mt-8 mb-4">Using JSX</h2>
        <CodeBlock code={jsxComponentCode} language="tsx" />
      </div>
    </div>
  );
}
