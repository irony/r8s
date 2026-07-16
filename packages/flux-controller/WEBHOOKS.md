# FluxCD Webhooks for r8s

## Overview

By default, FluxCD polls Git repositories every 1-5 minutes. With webhooks, you get **instant reconciliation** when you push changes.

## Architecture

```
Git Push (tsx files)
    ↓
GitHub/GitLab Webhook
    ↓
Flux Receiver (in cluster)
    ↓
GitRepository reconciliation (instant)
    ↓
r8s-controller renders TSX → YAML
    ↓
Kustomization applies to cluster
    ↓
Slack/Discord notification (optional)
```

## Setup

### 1. Configure Flux Receiver

```bash
# Generate a random webhook secret
WEBHOOK_SECRET=$(openssl rand -hex 20)
echo "Webhook secret: $WEBHOOK_SECRET"

# Create the secret in your cluster
kubectl create secret generic r8s-webhook-token \
  --from-literal=token=$WEBHOOK_SECRET \
  -n flux-system
```

### 2. Apply Receiver Configuration

```bash
kubectl apply -f webhooks.yaml
```

### 3. Get the Webhook URL

```bash
# For LoadBalancer service
kubectl get receiver -n flux-system r8s-github-webhook -o jsonpath='{.status.webhookPath}'

# Or with port-forwarding
kubectl port-forward -n flux-system svc/notification-controller 9292:80
# Webhook URL: http://localhost:9292/hook/flux-system/r8s-github-webhook
```

### 4. Configure GitHub

1. Go to your repository → Settings → Webhooks
2. Add webhook:
   - **Payload URL**: `https://flux-webhook.yourdomain.com/hook/flux-system/r8s-github-webhook`
   - **Content type**: `application/json`
   - **Secret**: (the token you generated)
   - **Events**: Just the push event

### 5. Configure GitLab

1. Go to Project → Settings → Webhooks
2. Add webhook:
   - **URL**: `https://flux-webhook.yourdomain.com/hook/flux-system/r8s-github-webhook`
   - **Secret token**: (the token you generated)
   - **Trigger**: Push events

## Provider-Specific Configurations

### GitHub

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1
kind: Receiver
metadata:
  name: github-webhook
  namespace: flux-system
spec:
  type: github
  events:
    - ping
    - push
  secretRef:
    name: r8s-webhook-token
  resources:
    - apiVersion: source.toolkit.fluxcd.io/v1
      kind: GitRepository
      name: r8s-manifests
```

### GitLab

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1
kind: Receiver
metadata:
  name: gitlab-webhook
  namespace: flux-system
spec:
  type: gitlab
  events:
    - Push Hook
    - Merge Request Hook
  secretRef:
    name: r8s-webhook-token
  resources:
    - apiVersion: source.toolkit.fluxcd.io/v1
      kind: GitRepository
      name: r8s-manifests
```

### Bitbucket

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1
kind: Receiver
metadata:
  name: bitbucket-webhook
  namespace: flux-system
spec:
  type: bitbucket
  events:
    - repo:push
  secretRef:
    name: r8s-webhook-token
  resources:
    - apiVersion: source.toolkit.fluxcd.io/v1
      kind: GitRepository
      name: r8s-manifests
```

## Exposing the Webhook Endpoint

### Option 1: Ingress (recommended)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: flux-webhook
  namespace: flux-system
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - flux-webhook.yourdomain.com
      secretName: flux-webhook-tls
  rules:
    - host: flux-webhook.yourdomain.com
      http:
        paths:
          - path: /hook/
            pathType: Prefix
            backend:
              service:
                name: notification-controller
                port:
                  number: 80
```

### Option 2: LoadBalancer Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: flux-webhook-lb
  namespace: flux-system
spec:
  type: LoadBalancer
  selector:
    app: notification-controller
  ports:
    - port: 80
      targetPort: 9292
```

### Option 3: External-DNS with automatic registration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: flux-webhook
  namespace: flux-system
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    external-dns.alpha.kubernetes.io/hostname: flux-webhook.yourdomain.com
spec:
  ingressClassName: nginx
  rules:
    - host: flux-webhook.yourdomain.com
      http:
        paths:
          - path: /hook/
            pathType: Prefix
            backend:
              service:
                name: notification-controller
                port:
                  number: 80
```

## Notifications

### Slack

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: slack
  namespace: flux-system
spec:
  type: slack
  channel: kubernetes-alerts
  secretRef:
    name: slack-webhook
---
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Alert
metadata:
  name: r8s-alerts
  namespace: flux-system
spec:
  providerRef:
    name: slack
  eventSources:
    - kind: Kustomization
      name: r8s-rendered
    - kind: GitRepository
      name: r8s-manifests
  eventSeverity: error
```

### Discord

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: discord
  namespace: flux-system
spec:
  type: discord
  channel: kubernetes-alerts
  secretRef:
    name: discord-webhook
```

### Microsoft Teams

```yaml
apiVersion: notification.toolkit.fluxcd.io/v1beta3
kind: Provider
metadata:
  name: teams
  namespace: flux-system
spec:
  type: msteams
  secretRef:
    name: teams-webhook
```

## Testing

### Manual Webhook Test

```bash
# Get the webhook path
WEBHOOK_PATH=$(kubectl get receiver -n flux-system r8s-github-webhook -o jsonpath='{.status.webhookPath}')

# Send test payload
curl -X POST http://localhost:9292$WEBHOOK_PATH \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/main","repository":{"clone_url":"https://github.com/your-org/your-repo"}}'
```

### Verify Instant Reconciliation

```bash
# Watch the GitRepository
kubectl get gitrepository r8s-manifests -n flux-system -w

# After pushing, you should see the Last Handled Reconcile At update immediately
```

## Security Considerations

1. **Always use HTTPS** for webhook endpoints in production
2. **Use strong secrets** (20+ random characters)
3. **Rotate secrets regularly**
4. **Restrict webhook events** to only push (not all events)
5. **Use network policies** to restrict access to notification-controller

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: flux-webhook
  namespace: flux-system
spec:
  podSelector:
    matchLabels:
      app: notification-controller
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 9292
```

## Troubleshooting

### Webhook not triggering

```bash
# Check receiver status
kubectl get receiver -n flux-system
kubectl describe receiver r8s-github-webhook -n flux-system

# Check notification-controller logs
kubectl logs -n flux-system deployment/notification-controller

# Verify secret matches
kubectl get secret r8s-webhook-token -n flux-system -o jsonpath='{.data.token}' | base64 -d
```

### r8s-controller not rendering

```bash
# Check if controller ran
kubectl logs -n flux-system job/r8s-render-*

# Check rendered output
kubectl exec -n flux-system deployment/source-controller -- ls /data/rendered/
```

## Complete Example

See [deploy.yaml](deploy.yaml) for a complete deployment with:
- r8s-controller as init container
- Webhook receiver
- Slack notifications
- Ingress with cert-manager
