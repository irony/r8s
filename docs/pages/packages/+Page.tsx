import { useConfig } from "vike-react/useConfig";
import { packages, getPackageCategories } from "../../data/packages";

export default function Page() {
  const config = useConfig();

  config({
    title: "Kubernetes Infrastructure Packages — r8s",
    description:
      "Operator-backed infrastructure packages for r8s: cert-manager, OpenBao, Keycloak, ExternalDNS, Redis, Envoy Gateway, Prometheus, ClickHouse, Logging, and Loki.",
  });

  const categories = getPackageCategories();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl tracking-tight">Packages</h1>
        <p className="text-xl text-cloud/80">
          Operator-backed components for Kubernetes infrastructure
        </p>
      </div>

      <div className="prose prose-invert max-w-none">
        <p className="text-base leading-relaxed">
          Each package declares the operators it depends on and exports typed
          components. Use them alone or combine them inside recipes for
          end-to-end infrastructure.
        </p>
      </div>

      <div className="space-y-12">
        {categories.map((category) => {
          const catPackages = packages.filter((p) => p.category === category);
          return (
            <div key={category} className="space-y-4">
              <h2 className="text-xs text-moss uppercase tracking-wider font-medium">
                {category}
              </h2>
              <div className="grid gap-6">
                {catPackages.map((pkg) => (
                  <a
                    key={pkg.slug}
                    href={`/packages/${pkg.slug}`}
                    className="block p-6 rounded-lg border border-white/10 hover:border-moss transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-serif text-2xl group-hover:text-moss transition-colors">
                          {pkg.title}
                        </h3>
                        <p className="text-xs font-mono text-cloud/50 mt-1">
                          {pkg.name}
                        </p>
                      </div>
                      <span className="text-cloud/40 text-sm">→</span>
                    </div>
                    <p className="text-cloud/70 text-sm leading-relaxed mb-4">
                      {pkg.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pkg.operator && (
                        <span className="text-xs px-2 py-1 rounded bg-moss/10 text-moss">
                          ⚙ {pkg.operator}
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 rounded bg-white/5 text-cloud/60">
                        {pkg.components.length} component{pkg.components.length === 1 ? "" : "s"}
                      </span>
                      {pkg.components.slice(0, 2).map((c) => (
                        <span
                          key={c.name}
                          className="text-xs px-2 py-1 font-mono rounded bg-white/5 text-cloud/50"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 p-6 rounded-lg border border-white/10 bg-spruce/20">
        <h2 className="font-serif text-2xl mb-3">Looking for recipes?</h2>
        <p className="text-cloud/70 text-sm leading-relaxed">
          These packages power the higher-level{" "}
          <a href="/recipes" className="text-moss hover:text-lichen">recipes</a>{" "}
          — like Database, WebService, and App — which combine packages and
          operators into complete infrastructure.
        </p>
      </div>
    </div>
  );
}
