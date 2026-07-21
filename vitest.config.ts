import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: [
      // Map @r8s/* imports to their source directories for testing
      { find: /^@r8s\/core$/, replacement: resolve(__dirname, 'packages/core/src/index.ts') },
      { find: /^@r8s\/core\/defaults$/, replacement: resolve(__dirname, 'packages/core/src/defaults.ts') },
      { find: /^@r8s\/k8s-types$/, replacement: resolve(__dirname, 'packages/k8s-types/src/index.ts') },
      { find: /^@r8s\/recipes$/, replacement: resolve(__dirname, 'packages/recipes/src/index.ts') },
      { find: /^@r8s\/cert-manager$/, replacement: resolve(__dirname, 'packages/cert-manager/src/index.ts') },
      { find: /^@r8s\/openbao$/, replacement: resolve(__dirname, 'packages/openbao/src/index.ts') },
      { find: /^@r8s\/keycloak$/, replacement: resolve(__dirname, 'packages/keycloak/src/index.ts') },
      { find: /^@r8s\/external-dns$/, replacement: resolve(__dirname, 'packages/external-dns/src/index.ts') },
      { find: /^@r8s\/redis$/, replacement: resolve(__dirname, 'packages/redis/src/index.ts') },
      { find: /^@r8s\/gateway$/, replacement: resolve(__dirname, 'packages/gateway/src/index.ts') },
      { find: /^@r8s\/monitoring$/, replacement: resolve(__dirname, 'packages/monitoring/src/index.ts') },
      { find: /^@r8s\/clickhouse$/, replacement: resolve(__dirname, 'packages/clickhouse/src/index.ts') },
      { find: /^@r8s\/logging$/, replacement: resolve(__dirname, 'packages/logging/src/index.ts') },
      { find: /^@r8s\/loki$/, replacement: resolve(__dirname, 'packages/loki/src/index.ts') },
      { find: /^@r8s\/flux-controller$/, replacement: resolve(__dirname, 'packages/flux-controller/src/index.ts') },
    ],
  },
});
