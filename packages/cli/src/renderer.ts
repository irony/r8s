import { render, r8sElement } from '@r8s/core';
import * as yaml from 'js-yaml';
import { resolve } from 'path';

interface EntryModule {
  default: r8sElement | ((props: unknown) => r8sElement);
}

export async function renderToYaml(entryFile: string): Promise<string> {
  const absolutePath = resolve(entryFile);

  let result;
  try {
    // Bundle everything with esbuild to resolve all imports
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

  // Create a data URL from the bundled code
  const dataUrl = 'data:text/javascript;base64,' + Buffer.from(bundledCode).toString('base64');

  // Import the bundled module
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

  const renderResult = render(element);

  if (renderResult.resources.length === 0) {
    throw new Error(
      `No Kubernetes resources rendered from ${entryFile}. ` +
        `Ensure your component returns resources with 'apiVersion' and 'kind'.`
    );
  }

  const yamlDocs = renderResult.resources.map((resource) =>
    yaml.dump(resource, {
      sortKeys: false,
      noRefs: true,
      lineWidth: -1,
    })
  );

  return yamlDocs.join('---\n');
}
