import type { Operator } from '@r8s/k8s-types';

/**
 * Fetch operator manifests from their source URLs.
 * Returns YAML strings that can be prepended to rendered output.
 */
export async function fetchOperatorManifests(operators: Operator[]): Promise<string[]> {
  const manifests: string[] = [];

  for (const op of operators) {
    if (op.source.type !== 'manifest' || !op.source.url) {
      // Skip non-manifest operators (helm, olm, flux) — they need external tooling
      continue;
    }

    try {
      const response = await fetch(op.source.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const yaml = await response.text();
      manifests.push(`# Operator: ${op.name} v${op.version}\n${yaml}`);
    } catch (error) {
      throw new Error(
        `Failed to fetch operator manifest for ${op.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return manifests;
}
