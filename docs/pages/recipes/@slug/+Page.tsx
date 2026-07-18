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

  const keywords = recipe.keywords.join(", ");

  config({
    title: `${recipe.title} — r8s Recipes`,
    description: recipe.description,
  });

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-moss uppercase tracking-wider font-medium">
            {recipe.category}
          </span>
        </div>
        <h1 className="text-4xl tracking-tight">{recipe.title}</h1>
        <p className="text-xl text-cloud/80">{recipe.description}</p>
      </div>

      {/* Keywords */}
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

      {/* Quick Start */}
      <div className="space-y-4">
        <h2 className="text-2xl tracking-tight">Quick Start</h2>
        <CodeBlock code={recipe.code} yaml={recipe.yaml} language="tsx" />
      </div>

      {/* Parameters */}
      <div className="space-y-6">
        <h2 className="text-2xl tracking-tight">Parameters</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Parameter</th>
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Required</th>
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Default</th>
                <th className="text-left py-3 px-4 text-cloud/60 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-cloud/80">
              {recipe.parameters.map((param) => (
                <tr key={param.name} className="border-b border-white/5">
                  <td className="py-3 px-4 font-mono text-moss">{param.name}</td>
                  <td className="py-3 px-4 font-mono text-cloud/60">{param.type}</td>
                  <td className="py-3 px-4">
                    {param.required ? (
                      <span className="text-red-400">Required</span>
                    ) : (
                      <span className="text-cloud/40">Optional</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-cloud/40">
                    {param.default || "—"}
                  </td>
                  <td className="py-3 px-4 text-cloud/70">{param.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Examples */}
      <div className="space-y-8">
        <h2 className="text-2xl tracking-tight">Advanced Examples</h2>
        {recipe.advancedExamples.map((example, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-moss font-mono text-sm">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="text-xl">{example.title}</h3>
            </div>
            <p className="text-cloud/70">{example.description}</p>
            <CodeBlock code={example.code} yaml={example.yaml} language="tsx" />
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-2xl tracking-tight">Features</h2>
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

      {/* Operators & Resources */}
      <div className="grid md:grid-cols-2 gap-6">
        {recipe.operators.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl tracking-tight">Required Operators</h2>
            <ul className="space-y-2">
              {recipe.operators.map((op) => (
                <li key={op} className="flex items-center gap-2 text-cloud/80">
                  <span className="text-moss">⚙</span>
                  {op}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="space-y-4">
          <h2 className="text-2xl tracking-tight">Created Resources</h2>
          <ul className="space-y-2">
            {recipe.resources.map((resource) => (
              <li key={resource} className="flex items-center gap-2 text-cloud/80">
                <span className="text-moss">📄</span>
                {resource}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <div className="pt-8 border-t border-white/10 flex justify-between">
        <a href="/recipes" className="text-moss hover:text-lichen flex items-center gap-2">
          <span>←</span>
          All recipes
        </a>
      </div>
    </div>
  );
}
