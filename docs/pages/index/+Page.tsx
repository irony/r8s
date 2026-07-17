import React from 'react'

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          r8s
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Kubernetes YAML generator using TSX components
        </p>
      </section>

      {/* Description */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">What is r8s?</h2>
        <p className="mt-4 text-lg leading-relaxed text-gray-700">
          r8s lets you define Kubernetes resources with type-safe TSX
          components instead of handwritten YAML. Catch errors at build time,
          reuse components across environments, and render infrastructure
          alongside your application code.
        </p>
      </section>

      {/* Code Example */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Quick Example</h2>
        <div className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-6">
          <pre className="text-sm leading-relaxed text-gray-100">
            <code>{`import { Deployment, Namespace, Service } from 'r8s'

export default function MyApp() {
  return (
    <Namespace name="production">
      <Deployment
        name="api"
        image="my-app:latest"
        replicas={3}
      />
      <Service
        name="api"
        port={8080}
        targetPort={80}
      />
    </Namespace>
  )
}`}</code>
          </pre>
        </div>
      </section>

      {/* Link to GitHub */}
      <section className="mt-12 text-center">
        <a
          href="https://github.com/r8s-io/r8s"
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          View on GitHub
        </a>
      </section>
    </div>
  )
}
