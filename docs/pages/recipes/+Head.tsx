export function Head() {
  const title = "Kubernetes Infrastructure Recipes & Templates — r8s";
  const description = "Production-ready Kubernetes infrastructure recipes and boilerplates. PostgreSQL, web services, ingress, and complete application templates.";
  const keywords = [
    "kubernetes recipes",
    "k8s templates",
    "infrastructure boilerplates",
    "kubernetes deployment templates",
    "k8s starter templates",
    "postgresql kubernetes",
    "web service kubernetes",
    "infrastructure as code templates",
    "kubernetes examples",
    "k8s recipes"
  ].join(", ");

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href="https://r8s.dev/recipes" />
    </>
  );
}
