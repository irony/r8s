#!/bin/bash

# ReactNetes Terminal Demo
# This script demonstrates the ReactNetes workflow

clear

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ReactNetes Demo: Kubernetes YAML from TSX Components"
echo "═══════════════════════════════════════════════════════════════"
echo ""

sleep 1

echo "📦 Step 1: Create a new project"
echo ""
echo "$ npx reactnetes init my-app"
echo ""

node packages/cli/dist/cli.js init my-app 2>&1

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

sleep 1

echo "📁 Project Structure:"
echo ""
tree -L 3 -I 'node_modules' my-app 2>/dev/null || \
  find my-app -maxdepth 3 -not -path '*/node_modules/*' | sed 's|my-app|.|' | sort

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

sleep 1

echo "📝 k8s/ReactNetes.tsx:"
echo ""
cat my-app/k8s/ReactNetes.tsx

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

sleep 1

echo "⚙️  .github/workflows/render.yaml:"
echo ""
cat my-app/.github/workflows/render.yaml

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

sleep 2

echo "⚡ Step 2: Render to YAML"
echo ""
echo "$ cd my-app && npm run render-k8s"
echo ""

cd my-app
node ../packages/cli/dist/cli.js render 2>/dev/null

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

sleep 1

echo "✅ Generated 6 Kubernetes resources from 1 TSX file:"
echo "   • StatefulSet (Postgres database)"
echo "   • Service (Postgres endpoint)"
echo "   • ConfigMap (Postgres configuration)"
echo "   • Deployment (Web application)"
echo "   • Service (Web application endpoint)"
echo "   • Ingress (External access with TLS)"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

sleep 1

echo "🚀 Step 3: GitOps Integration"
echo ""
echo "Push to GitHub and the workflow will:"
echo "   1. Render k8s/ReactNetes.tsx → k8s/manifest.yaml"
echo "   2. Commit the rendered YAML"
echo "   3. FluxCD/ArgoCD applies it to your cluster"
echo ""

sleep 1

echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Done! Try it yourself:"
echo ""
echo "  npx reactnetes init my-project"
echo "  cd my-project"
echo "  npm install"
echo "  npm run render-k8s"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Cleanup
cd ..
rm -rf my-app
