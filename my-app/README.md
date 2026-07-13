# my-app

Generated with r8s.

## Getting Started

```bash
# Install dependencies
npm install

# Render Kubernetes manifests
npm run render-k8s

# Or use the CLI directly
npx r8s render
npx r8s render --out k8s/manifest.yaml
```

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── render.yaml   # Auto-render on push
├── k8s/
│   ├── r8s.tsx    # Your Kubernetes components
│   └── manifest.yaml       # Generated YAML (auto-committed)
├── package.json
└── tsconfig.json
```

## Editing Manifests

Open `k8s/r8s.tsx` and edit your components. Run `npm run render-k8s` to generate YAML.

## GitHub Actions

This project includes a GitHub Actions workflow that automatically renders your Kubernetes manifests on every push to `main` or `master`. The rendered `k8s/manifest.yaml` is automatically committed back to the repository.

## Learn More

- [r8s Documentation](https://github.com/yourusername/r8s)
- [Recipes](https://github.com/yourusername/r8s/tree/main/packages/recipes)
