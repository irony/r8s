#!/bin/bash

# r8s Terminal Recording Script
# Run this to create a demo recording

clear

echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│  r8s: Kubernetes YAML from TSX Components           │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

sleep 1

echo "$ ls"
echo "README.md  demo.sh  examples/  node_modules/  package.json  packages/"
echo ""

sleep 1

echo "$ cd examples/basic-app"
echo ""

sleep 0.5

echo "$ ls k8s/"
echo "r8s.tsx"
echo ""

sleep 1

echo "$ cat k8s/r8s.tsx"
echo ""
sleep 0.5
cat /Users/cln/src/r8s/examples/basic-app/k8s/r8s.tsx
echo ""

sleep 2

echo "┌─────────────────────────────────────────────────────────────┐"
echo "│  Rendering to YAML...                                      │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

sleep 1

echo "$ npx r8s render"
echo ""

cd /Users/cln/src/r8s/examples/basic-app
node ../../packages/cli/dist/cli.js render --entry ./k8s/r8s.tsx 2>/dev/null

echo ""
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│  ✅ 6 Kubernetes resources generated from 1 TSX file        │"
echo "│                                                             │"
echo "│  • StatefulSet  (Postgres database)                         │"
echo "│  • Service      (Postgres endpoint)                         │"
echo "│  • ConfigMap    (Postgres configuration)                    │"
echo "│  • Deployment   (Web application)                         │"
echo "│  • Service      (Web application endpoint)                  │"
echo "│  • Ingress      (External access with TLS)                │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""

sleep 1

echo "$ npx r8s render --out k8s/manifest.yaml"
echo "Rendering: /Users/cln/src/r8s/examples/basic-app/k8s/r8s.tsx"
echo "Output written to: /Users/cln/src/r8s/examples/basic-app/k8s/manifest.yaml"
echo ""

sleep 1

echo "$ kubectl apply -f k8s/manifest.yaml"
echo "statefulset.apps/myapp-db created"
echo "service/myapp-db created"
echo "configmap/myapp-db-config created"
echo "deployment.apps/myapp-web created"
echo "service/myapp-web created"
echo "ingress.networking.k8s.io/myapp-ingress created"
echo ""

echo "┌─────────────────────────────────────────────────────────────┐"
echo "│  Done! Your infrastructure is now live.                     │"
echo "│                                                             │"
echo "│  Try it yourself:                                           │"
echo "│  npm install @r8s/core @r8s/recipes         │"
echo "│  npm install -D @r8s/cli                            │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""
