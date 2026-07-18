import { useConfig } from "vike-react/useConfig";
import { recipes } from "../../data/recipes";

export default function Page() {
  const config = useConfig();
  
  config({
    title: "Kubernetes Infrastructure Recipes & Templates — r8s",
    description: "Production-ready Kubernetes infrastructure recipes and boilerplates. PostgreSQL, web services, ingress, and complete application templates.",
  });

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl tracking-tight">Recipes</h1>
        <p className="text-xl text-cloud/80">
          Production-ready Kubernetes infrastructure templates and boilerplates
        </p>
      </div>

      <div className="prose prose-invert max-w-none">
        <p className="text-base leading-relaxed">
          Browse our collection of infrastructure recipes. Each recipe is a tested, 
          production-ready template that you can copy and customize for your needs.
        </p>
      </div>

      <div className="grid gap-6">
        {recipes.map((recipe) => (
          <a 
            key={recipe.slug}
            href={`/recipes/${recipe.slug}`}
            className="block p-6 rounded-lg border border-white/10 hover:border-moss transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs text-moss uppercase tracking-wider font-medium">
                  {recipe.category}
                </span>
                <h2 className="font-serif text-2xl mt-1 group-hover:text-moss transition-colors">
                  {recipe.title}
                </h2>
              </div>
              <span className="text-cloud/40 text-sm">→</span>
            </div>
            <p className="text-cloud/70 text-sm leading-relaxed mb-4">
              {recipe.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {recipe.features.slice(0, 3).map((feature) => (
                <span 
                  key={feature}
                  className="text-xs px-2 py-1 rounded bg-white/5 text-cloud/60"
                >
                  {feature}
                </span>
              ))}
              {recipe.features.length > 3 && (
                <span className="text-xs px-2 py-1 text-cloud/40">
                  +{recipe.features.length - 3} more
                </span>
              )}
            </div>
          </a>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-lg border border-white/10 bg-spruce/20">
        <h2 className="font-serif text-2xl mb-3">Looking for something else?</h2>
        <p className="text-cloud/70 text-sm leading-relaxed">
          These recipes are built with r8s components. You can combine them, 
          customize them, or create your own. Check out the{" "}
          <a href="/core" className="text-moss hover:text-lichen">Core Concepts</a>{" "}
          to learn how to build custom recipes.
        </p>
      </div>
    </div>
  );
}
