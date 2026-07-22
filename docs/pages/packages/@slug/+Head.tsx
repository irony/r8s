import { usePageContext } from "vike-react/usePageContext";
import type { Package } from "../../../data/packages";

export function Head() {
  const pageContext = usePageContext();
  const pkg = pageContext.package as Package | undefined;

  if (!pkg) {
    return (
      <>
        <title>{`Package Not Found — r8s`}</title>
        <meta name="robots" content="noindex" />
      </>
    );
  }

  const keywords = pkg.keywords.join(", ");
  const title = `${pkg.title} — r8s Packages`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={pkg.description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:title" content={pkg.title} />
      <meta property="og:description" content={pkg.description} />
      <meta property="og:type" content="article" />
      <meta property="article:section" content={pkg.category} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pkg.title} />
      <meta name="twitter:description" content={pkg.description} />
      <link rel="canonical" href={`https://r8s.dev/packages/${pkg.slug}`} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "headline": pkg.title,
          "description": pkg.description,
          "keywords": keywords,
          "articleSection": pkg.category,
          "codeRepository": "https://github.com/irony/r8s",
          "programmingLanguage": "TypeScript"
        })}
      </script>
    </>
  );
}
