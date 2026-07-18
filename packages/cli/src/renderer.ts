import { render, r8sElement, fetchOperatorManifests } from '@r8s/core';
import * as yaml from 'js-yaml';
import { resolve } from 'path';

interface EntryModule {
  default: r8sElement | ((props: unknown) => r8sElement);
}

export interface RenderOptions {
  includeOperators?: boolean;
  operatorsOnly?: boolean;
}

async function bundleAndRender(entryFile: string) {
  const absolutePath = resolve(entryFile);

  let result;
  try {
    const { build } = await import('esbuild');

    result = await build({
      entryPoints: [absolutePath],
      bundle: true,
      format: 'esm',
      target: 'es2022',
      platform: 'node',
      write: false,
      jsx: 'automatic',
      jsxImportSource: '@r8s/core',
      external: [],
    });
  } catch (error) {
    throw new Error(
      `Failed to bundle ${entryFile}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!result.outputFiles?.[0]?.text) {
    throw new Error(`Bundling produced no output for ${entryFile}`);
  }

  const bundledCode = result.outputFiles[0].text;
  const dataUrl = 'data:text/javascript;base64,' + Buffer.from(bundledCode).toString('base64');

  let module: EntryModule;
  try {
    module = (await import(dataUrl)) as EntryModule;
  } catch (error) {
    throw new Error(
      `Failed to import bundled module: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const Component = module.default;

  if (!Component) {
    throw new Error(`Entry file ${entryFile} must export a default component or function`);
  }

  let element: r8sElement;
  if (typeof Component === 'function') {
    element = Component({});
  } else {
    element = Component;
  }

  return render(element);
}

export async function renderToYaml(entryFile: string, options: RenderOptions = {}): Promise<string> {
  const renderResult = await bundleAndRender(entryFile);

  if (renderResult.resources.length === 0 && !options.operatorsOnly) {
    throw new Error(
      `No Kubernetes resources rendered from ${entryFile}. ` +
        `Ensure your component returns resources with 'apiVersion' and 'kind'.`
    );
  }

  const yamlDocs: string[] = [];

  // Include operators if requested
  if ((options.includeOperators || options.operatorsOnly) && renderResult.operators.length > 0) {
    const operatorManifests = await fetchOperatorManifests(renderResult.operators);
    yamlDocs.push(...operatorManifests);
  }

  // Include resources unless operators-only
  if (!options.operatorsOnly) {
    const resourceDocs = renderResult.resources.map((resource) =>
      yaml.dump(resource, {
        sortKeys: false,
        noRefs: true,
        lineWidth: -1,
      })
    );
    yamlDocs.push(...resourceDocs);
  }

  if (yamlDocs.length === 0) {
    throw new Error(`No output generated from ${entryFile}.`);
  }

  return yamlDocs.join('---\n');
}

export async function renderToOperatorsYaml(entryFile: string): Promise<string> {
  return renderToYaml(entryFile, { operatorsOnly: true });
}
