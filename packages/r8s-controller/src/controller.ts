import { KubeConfig, CustomObjectsApi, Watch, KubernetesObject } from '@kubernetes/client-node';
import { renderToYaml } from '@r8s/cli/src/renderer.js';
import { execSync } from 'child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

interface R8sSourceSpec {
  git: {
    url: string;
    ref?: string;
    secretRef?: string;
  };
  entry?: string;
  output?: string;
  includeOperators?: boolean;
  interval?: string;
  suspend?: boolean;
}

interface R8sSourceStatus {
  observedGeneration?: number;
  conditions?: Array<{
    type: string;
    status: string;
    reason?: string;
    message?: string;
    lastTransitionTime?: string;
  }>;
  lastAttemptedRevision?: string;
  lastAppliedRevision?: string;
  resources?: number;
}

interface R8sSource extends KubernetesObject {
  spec: R8sSourceSpec;
  status?: R8sSourceStatus;
}

const GROUP = 'r8s.berget.ai';
const VERSION = 'v1';
const PLURAL = 'r8ssources';

export class R8sController {
  private k8sApi: CustomObjectsApi;
  private watch: Watch;
  private namespace: string;

  constructor(namespace = 'default') {
    const kc = new KubeConfig();
    kc.loadFromDefault();
    this.k8sApi = kc.makeApiClient(CustomObjectsApi);
    this.watch = new Watch(kc);
    this.namespace = namespace;
  }

  async start() {
    console.log('[r8s-controller] Starting...');
    console.log(`[r8s-controller] Watching ${PLURAL} in namespace ${this.namespace}`);

    // Watch for R8sSource changes
    await this.watch.watch(
      `/apis/${GROUP}/${VERSION}/namespaces/${this.namespace}/${PLURAL}`,
      {},
      (type, obj: R8sSource) => {
        this.handleEvent(type, obj);
      },
      (err) => {
        console.error('[r8s-controller] Watch error:', err);
        // Restart watch after error
        setTimeout(() => this.start(), 5000);
      }
    );
  }

  private async handleEvent(type: string, obj: R8sSource) {
    if (type === 'DELETED') {
      console.log(`[r8s-controller] Deleted: ${obj.metadata?.name}`);
      return;
    }

    if (obj.spec.suspend) {
      console.log(`[r8s-controller] Suspended: ${obj.metadata?.name}`);
      return;
    }

    console.log(`[r8s-controller] Reconciling: ${obj.metadata?.name}`);
    await this.reconcile(obj);
  }

  private async reconcile(obj: R8sSource) {
    const name = obj.metadata?.name || 'unknown';
    const namespace = obj.metadata?.namespace || 'default';
    const generation = obj.metadata?.generation || 0;

    try {
      // Update status to Progressing
      await this.updateStatus(name, namespace, {
        observedGeneration: generation,
        conditions: [{
          type: 'Ready',
          status: 'Unknown',
          reason: 'Progressing',
          message: 'Reconciliation in progress',
          lastTransitionTime: new Date().toISOString(),
        }],
      });

      // 1. Clone repo
      const tmpDir = mkdtempSync(join(tmpdir(), 'r8s-'));
      const repoUrl = obj.spec.git.url;
      const ref = obj.spec.git.ref || 'main';

      console.log(`[r8s-controller] Cloning ${repoUrl}@${ref}`);
      execSync(`git clone --depth 1 --branch ${ref} ${repoUrl} ${tmpDir}`, {
        timeout: 60000,
      });

      // 2. Render TSX → YAML
      const entryPath = join(tmpDir, obj.spec.entry || 'k8s/r8s.tsx');
      const outputDir = join(tmpDir, obj.spec.output || 'rendered/');
      mkdirSync(outputDir, { recursive: true });

      console.log(`[r8s-controller] Rendering ${entryPath}`);
      const yaml = await renderToYaml(entryPath, {
        includeOperators: obj.spec.includeOperators,
      });

      const outputFile = join(outputDir, 'manifest.yaml');
      writeFileSync(outputFile, yaml);

      // 3. Apply with kubectl
      console.log(`[r8s-controller] Applying ${outputFile}`);
      execSync(`kubectl apply -f ${outputFile} --server-side`, {
        timeout: 60000,
      });

      // 4. Count resources
      const resourceCount = yaml.split('---').length - 1;

      // 5. Update status to Ready
      await this.updateStatus(name, namespace, {
        observedGeneration: generation,
        lastAppliedRevision: ref,
        resources: resourceCount,
        conditions: [{
          type: 'Ready',
          status: 'True',
          reason: 'ReconciliationSucceeded',
          message: `Applied ${resourceCount} resources`,
          lastTransitionTime: new Date().toISOString(),
        }],
      });

      console.log(`[r8s-controller] Reconciled: ${name} (${resourceCount} resources)`);

      // Cleanup
      rmSync(tmpDir, { recursive: true, force: true });
    } catch (error: any) {
      console.error(`[r8s-controller] Failed: ${name}:`, error.message);

      await this.updateStatus(name, namespace, {
        observedGeneration: generation,
        conditions: [{
          type: 'Ready',
          status: 'False',
          reason: 'ReconciliationFailed',
          message: error.message,
          lastTransitionTime: new Date().toISOString(),
        }],
      });
    }
  }

  private async updateStatus(
    name: string,
    namespace: string,
    status: Partial<R8sSourceStatus>
  ) {
    try {
      await this.k8sApi.patchNamespacedCustomObjectStatus(
        GROUP,
        VERSION,
        namespace,
        PLURAL,
        name,
        { status },
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
    } catch (error: any) {
      console.error(`[r8s-controller] Failed to update status:`, error.message);
    }
  }
}

// Start controller if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const namespace = process.env.NAMESPACE || 'default';
  const controller = new R8sController(namespace);
  controller.start().catch(console.error);
}
