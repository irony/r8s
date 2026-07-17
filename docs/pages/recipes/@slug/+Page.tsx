import { usePageContext } from "vike-react/usePageContext";
import { useConfig } from "vike-react/useConfig";
import type { Recipe } from "../../../data/recipes";
import { CodeBlock } from "../../../components/CodeBlock";

export default function Page() {
  const pageContext = usePageContext();
  const recipe = pageContext.recipe as Recipe | undefined;
  const config = useConfig();

  if (!recipe) {
    config({
      title: "Recipe Not Found — r8s",
    });
    return (
      <div className="space-y-8">
        <h1 className="text-4xl tracking-tight">Recipe Not Found</h1>
        <p className="text-cloud/70">The recipe you're looking for doesn't exist.</p>
        <a href="/recipes" className="text-moss hover:text-lichen">← Back to recipes</a>
      </div>
    );
  }

  config({
    title: `${recipe.title} — r8s Recipes`,
    description: recipe.description,
  });

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-moss uppercase tracking-wider font-medium">
            {recipe.category}
          </span>
        </div>
        <h1 className="text-4xl tracking-tight">{recipe.title}</h1>
        <p className="text-xl text-cloud/80">{recipe.description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {recipe.keywords.map((keyword) => (
          <span 
            key={keyword}
            className="text-xs px-3 py-1 rounded-full bg-white/5 text-cloud/60 border border-white/5"
          >
            {keyword}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-2xl">Code Example</h2>
        <CodeBlock code={recipe.code} language="tsx" />
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-2xl">Features</h2>
        <ul className="grid grid-cols-2 gap-3">
          {recipe.features.map((feature) => (
            <li 
              key={feature}
              className="flex items-center gap-2 text-cloud/80"
            >
              <span className="text-moss">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-8 border-t border-white/10">
        <a href="/recipes" className="text-moss hover:text-lichen flex items-center gap-2">
          <span>←</span>
          Back to all recipes
        </a>
      </div>
    </div>
  );
}
