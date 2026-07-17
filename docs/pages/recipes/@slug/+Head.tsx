import { usePageContext } from "vike-react/usePageContext";
import type { Recipe } from "../../../data/recipes";

export function Head() {
  const pageContext = usePageContext();
  const recipe = pageContext.recipe as Recipe | undefined;

  if (!recipe) {
    return (
      <>
        <title>Recipe Not Found — r8s</title>
        <meta name="robots" content="noindex" />
      </>
    );
  }

  const keywords = recipe.keywords.join(", ");
  
  return (
    <>
      <title>{recipe.title} — r8s Recipes</title>
      <meta name="description" content={recipe.description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:title" content={recipe.title} />
      <meta property="og:description" content={recipe.description} />
      <meta property="og:type" content="article" />
      <meta property="article:section" content={recipe.category} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={recipe.title} />
      <meta name="twitter:description" content={recipe.description} />
      <link rel="canonical" href={`https://r8s.dev/recipes/${recipe.slug}`} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "headline": recipe.title,
          "description": recipe.description,
          "keywords": keywords,
          "articleSection": recipe.category,
          "codeRepository": "https://github.com/irony/r8s",
          "programmingLanguage": "TypeScript"
        })}
      </script>
    </>
  );
}
