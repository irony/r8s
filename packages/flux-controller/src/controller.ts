#!/usr/bin/env node
/**
 * r8s FluxCD Source Controller
 *
 * Renders r8s TSX manifests to YAML for FluxCD consumption.
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, relative, resolve } from 'path';

export interface ControllerOptions {
  source: string;
  output: string;
  entry?: string;
  verbose?: boolean;
  includeOperators?: boolean;
}

export interface RenderResult {
  file: string;
  success: boolean;
  resources?: number;
  operators?: number;
  outputFile?: string;
  error?: string;
}

const log = {
  info: (msg: string) => console.log('[r8s-controller] ' + msg),
  error: (msg: string) => console.error('[r8s-controller] ERROR: ' + msg),
  debug: (msg: string, verbose?: boolean) =>
    verbose && console.log('[r8s-controller] DEBUG: ' + msg),
};

/** Fetch operator manifests from URLs */
async function fetchOperatorManifests(operators: any[]): Promise<string[]> {
  const manifests: string[] = [];

  for (const op of operators) {
    if (op.source?.type !== 'manifest' || !op.source?.url) {
      continue;
    }

    try {
      const response = await fetch(op.source.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const yaml = await response.text();
      manifests.push(`# Operator: ${op.name} v${op.version}\n${yaml}`);
    } catch (error: any) {
      log.error(`Failed to fetch operator ${op.name}: ${error.message}`);
      // Continue without this operator — better to have partial output than nothing
    }
  }

  return manifests;
}

/** Find all r8s entry files */
export function findEntryFiles(sourcePath: string, entryPattern = 'r8s.tsx'): string[] {
  const files: string[] = [];

  function scan(dir: string) {
    if (!existsSync(dir)) return;

    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (entry !== 'node_modules' && !entry.startsWith('.') && entry !== 'dist') {
          scan(fullPath);
        }
      } else if (entry === entryPattern || entry.endsWith('.r8s.tsx')) {
        files.push(fullPath);
      }
    }
  }

  scan(sourcePath);
  return files;
}

/** Render a TSX file to YAML */
export async function renderFile(filePath: string, outputDir: string, verbose?: boolean, includeOperators?: boolean): Promise<RenderResult> {
  const startTime = Date.now();
  const relativePath = relative(process.cwd(), filePath);

  try {
    log.debug('Rendering ' + relativePath + '...', verbose);

    const script = [
      "import { render } from '@r8s/core';",
      'async function main() {',
      '  try {',
      "    const m = await import('" + filePath.replace(/\\/g, '/') + "');",
      '    const Component = m.default || m;',
      "    if (typeof Component !== 'function') {",
      "      console.log(JSON.stringify({ error: 'Not a function' }));",
      '      process.exit(1);',
      '    }',
      '    const result = render(Component());',
      '    console.log(JSON.stringify({',
      '      success: true,',
      '      resources: result.resources.length,',
      '      operators: result.operators?.length || 0,',
      '      operatorList: result.operators || [],',
      '      yaml: result.resources',
      '    }));',
      '  } catch (err) {',
      '    console.log(JSON.stringify({ error: err.message }));',
      '    process.exit(1);',
      '  }',
      '}',
      'main();',
    ].join('\n');

    const result = execSync('npx tsx --eval "' + script.replace(/"/g, '\\"') + '"', {
      encoding: 'utf-8',
      cwd: dirname(filePath),
      timeout: 60000,
      env: {
        ...process.env,
        NODE_PATH: resolve(process.cwd(), 'node_modules'),
      },
    });

    const lines = result.trim().split('\n');
    const jsonLine = lines.find((l) => l.startsWith('{')) || '{}';
    const parsed = JSON.parse(jsonLine);

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    // Fetch operator manifests only if requested
    const operatorManifests = (includeOperators && parsed.operatorList?.length > 0)
      ? await fetchOperatorManifests(parsed.operatorList)
      : [];

    const resourceYaml = resourcesToYAML(parsed.yaml || []);
    const combinedYaml = operatorManifests.length > 0
      ? operatorManifests.join('\n---\n') + '\n---\n' + resourceYaml
      : resourceYaml;

    const outputFile = join(outputDir, relativePath.replace(/\.tsx$/, '.yaml'));
    mkdirSync(dirname(outputFile), { recursive: true });
    writeFileSync(outputFile, combinedYaml);

    const duration = Date.now() - startTime;
    log.debug('Rendered ' + parsed.resources + ' resources in ' + duration + 'ms', verbose);

    return {
      file: filePath,
      success: true,
      resources: parsed.resources,
      operators: parsed.operators,
      outputFile,
    };
  } catch (error: any) {
    log.error('Failed to render ' + relativePath + ': ' + error.message);
    return {
      file: filePath,
      success: false,
      error: error.message,
    };
  }
}

/** Convert resources array to YAML */
export function resourcesToYAML(resources: any[]): string {
  if (resources.length === 0) {
    return '# No resources generated\n';
  }

  return (
    resources
      .map((resource) => {
        const lines: string[] = ['---'];

        function serialize(obj: any, indent = 0): string[] {
          const prefix = '  '.repeat(indent);
          const result: string[] = [];

          for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) {
              continue;
            } else if (Array.isArray(value)) {
              if (value.length === 0) {
                result.push(prefix + key + ': []');
              } else if (typeof value[0] === 'object') {
                result.push(prefix + key + ':');
                for (const item of value) {
                  result.push(prefix + '-');
                  result.push(...serialize(item, indent + 1));
                }
              } else {
                result.push(prefix + key + ':');
                for (const item of value) {
                  result.push(prefix + '- ' + JSON.stringify(item));
                }
              }
            } else if (typeof value === 'object') {
              result.push(prefix + key + ':');
              result.push(...serialize(value, indent + 1));
            } else if (typeof value === 'string') {
              if (
                value.includes(':') ||
                value.includes('#') ||
                value.startsWith('*') ||
                value === '' ||
                value.includes('\n')
              ) {
                result.push(prefix + key + ': "' + value.replace(/"/g, '\\"') + '"');
              } else {
                result.push(prefix + key + ': ' + value);
              }
            } else {
              result.push(prefix + key + ': ' + value);
            }
          }

          return result;
        }

        lines.push(...serialize(resource));
        return lines.join('\n');
      })
      .join('\n') + '\n'
  );
}

/** Main controller function */
export async function runController(options: ControllerOptions): Promise<RenderResult[]> {
  const { source, output, entry = 'r8s.tsx', verbose, includeOperators } = options;

  log.info('Starting r8s-controller');
  log.info('Source: ' + source);
  log.info('Output: ' + output);
  log.info('Entry pattern: ' + entry);
  if (includeOperators) {
    log.info('Including operator manifests');
  }

  if (!existsSync(source)) {
    log.error('Source directory does not exist: ' + source);
    return [];
  }

  const entryFiles = findEntryFiles(source, entry);
  log.info('Found ' + entryFiles.length + ' entry file(s)');

  if (entryFiles.length === 0) {
    log.info('No entry files found, creating empty output');
    mkdirSync(output, { recursive: true });
    writeFileSync(
      join(output, 'README.md'),
      '# r8s rendered output\n\nNo .tsx entry files found.\n'
    );
    return [];
  }

  const results: RenderResult[] = [];
  for (const file of entryFiles) {
    const result = await renderFile(file, output, verbose, includeOperators);
    results.push(result);

    if (result.success) {
      log.info(
        'OK ' +
          relative(source, file) +
          ' -> ' +
          relative(output, result.outputFile!) +
          ' (' +
          result.resources +
          ' resources)'
      );
    } else {
      log.error('FAIL ' + relative(source, file) + ': ' + result.error);
    }
  }

  const success = results.filter((r) => r.success).length;
  const totalResources = results.reduce((sum, r) => sum + (r.resources || 0), 0);
  const totalOperators = results.reduce((sum, r) => sum + (r.operators || 0), 0);

  log.info('Rendered ' + success + '/' + results.length + ' files');
  log.info('Total: ' + totalResources + ' resources, ' + totalOperators + ' operators');

  return results;
}

/** CLI entry point */
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: Partial<ControllerOptions> = {};

  for (const arg of args) {
    if (arg.startsWith('--source=')) {
      options.source = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg.startsWith('--entry=')) {
      options.entry = arg.split('=')[1];
    } else if (arg === '--include-operators') {
      options.includeOperators = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }

  if (!options.source || !options.output) {
    console.error(`
r8s-controller - FluxCD source controller for r8s TSX manifests

Usage:
  r8s-controller --source=<path> --output=<path> [options]

Options:
  --source=<path>        Source directory with .tsx files
  --output=<path>        Output directory for rendered YAML
  --entry=<pattern>      Entry file pattern (default: r8s.tsx)
  --include-operators    Include operator manifests in output
  --verbose, -v          Enable verbose logging

Example:
  r8s-controller --source=./k8s --output=./rendered --include-operators --verbose
`);
    process.exit(1);
  }

  runController(options as ControllerOptions)
    .then((results) => {
      const failed = results.filter((r) => !r.success).length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      log.error('Controller failed: ' + err.message);
      process.exit(1);
    });
}
