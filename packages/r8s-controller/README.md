# r8s-controller

Kubernetes-native controller for r8s. Renders TSX to YAML in-cluster.

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Git Repo   │────▶│  r8s-controller │────▶│  Kubernetes │
│  (r8s.tsx)  │     │  (renders YAML) │     │  (applied)  │
└─────────────┘     └─────────────────┘     └─────────────┘
```

## Installation

```bash
kubectl apply -f config/crd.yaml
kubectl apply -f config/deploy.yaml
```

## Usage

```yaml
apiVersion: r8s.berget.ai/v1
kind: R8sSource
metadata:
  name: my-app
  namespace: default
spec:
  git:
    url: https://github.com/my-org/my-app
    ref: main
  entry: k8s/r8s.tsx
  includeOperators: false
```

## Status

```bash
kubectl get r8ssource
# NAME      READY   REVISION   RESOURCES   AGE
# my-app    True    main       12          5m
```
