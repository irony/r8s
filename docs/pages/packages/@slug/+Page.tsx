import { usePageContext } from "vike-react/usePageContext";
import { useConfig } from "vike-react/useConfig";
import type { Package } from "../../../data/packages";
import { CodeBlock } from "../../../components/CodeBlock";

export default function Page() {
  const pageContext = usePageContext();
  const pkg = pageContext.package as Package | undefined;
  const config = useConfig();

  if (!pkg) {
    config({
      title: "Package Not Found — r8s",
    });
    return (
      <div className="space-y-8">
        <h1 className="text-4xl tracking-tight">Package Not Found</h1>
        <p className="text-cloud/70">The package you're looking for doesn't exist.</p>
        <a href="/packages" className="text-moss hover:text-lichen">← Back to packages</a>
      </div>
    );
  }

  config({
    title: `${pkg.title} — r8s Packages`,
    description: pkg.description,
  });

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-moss uppercase tracking-wider font-medium">
            {pkg.category}
          </span>
        </div>
        <h1 className="text-4xl tracking-tight">{pkg.title}</h1>
        <p className="text-xl text-cloud/80">{pkg.description}</p>
        <p className="text-sm font-mono text-cloud/60">{pkg.name}</p>
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-2">
        {pkg.keywords.map((keyword) => (
          <span
            key={keyword}
            className="text-xs px-3 py-1 rounded-full bg-white/5 text-cloud/60 border border-white/5"
          >
            {keyword}
          </span>
        ))}
      </div>

      {/* Operator badge */}
      {pkg.operator && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-2xl tracking-tight">Declared Operator</h2>
            <div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5">
              <span className="text-moss text-xl">⚙</span>
              <div>
                <p className="font-mono text-peak">{pkg.operator}</p>
                {pkg.operatorVersion && (
                  <p className="text-xs text-cloud/60 mt-1">version {pkg.operatorVersion}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Components */}
      <div className="space-y-16">
        <h2 className="text-2xl tracking-tight">
          Components {pkg.components.length > 0 && (
            <span className="text-cloud/40 text-base font-sans">({pkg.components.length})</span>
          )}
        </h2>

        {pkg.components.map((component, index) => (
          <div key={component.name} className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-moss font-mono text-sm">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="text-xl font-mono">{component.name}</h3>
            </div>
            <p className="text-cloud/70">{component.description}</p>

            {/* Code example */}
            <CodeBlock code={component.code} language="tsx" />

            {/* Props table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-cloud/60 font-medium">Prop</th>
                    <th className="text-left py-3 px-4 text-cloud/60 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-cloud/60 font-medium">Required</th>
                    <th className="text-left py-3 px-4 text-cloud/60 font-medium">Default</th>
                    <th className="text-left py-3 px-4 text-cloud/60 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-cloud/80">
                  {component.props.map((prop) => (
                    <tr key={prop.name} className="border-b border-white/5">
                      <td className="py-3 px-4 font-mono text-moss">{prop.name}</td>
                      <td className="py-3 px-4 font-mono text-cloud/60">{prop.type}</td>
                      <td className="py-3 px-4">
                        {prop.required ? (
                          <span className="text-red-400">Required</span>
                        ) : (
                          <span className="text-cloud/40">Optional</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-cloud/40">
                        {prop.default || "—"}
                      </td>
                      <td className="py-3 px-4 text-cloud/70">{prop.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Created resources */}
            {component.resources.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-cloud/60 uppercase tracking-wider">Created Resources</p>
                <ul className="space-y-1">
                  {component.resources.map((resource) => (
                    <li key={resource} className="flex items-center gap-2 text-cloud/80 text-sm">
                      <span className="text-moss">📄</span>
                      <span className="font-mono">{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="pt-8 border-t border-white/10 flex justify-between">
        <a href="/packages" className="text-moss hover:text-lichen flex items-center gap-2">
          <span>←</span>
          All packages
        </a>
      </div>
    </div>
  );
}
