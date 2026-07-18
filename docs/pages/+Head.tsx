export function Head() {
  const title = "r8s — Kubernetes Infrastructure as TypeScript Components";
  const description = "Build Kubernetes infrastructure with familiar TSX components. Composable, testable, and type-safe infrastructure as code. Free templates and recipes included.";
  const keywords = [
    "kubernetes infrastructure",
    "infrastructure as code",
    "typescript kubernetes",
    "k8s components",
    "kubernetes templates",
    "k8s boilerplate",
    "infrastructure recipes",
    "kubernetes deployment",
    "devops tools",
    "cloud native"
  ].join(", ");

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href="https://r8s.dev" />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "r8s",
          "description": description,
          "applicationCategory": "DeveloperApplication",
          "operatingSystem": "Kubernetes",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "codeRepository": "https://github.com/irony/r8s"
        })}
      </script>
    </>
  );
}
