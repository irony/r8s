import { describe, it, expect } from 'vitest';
import { jsx, Fragment, render } from '../src/index';
import { declareOperator } from '../src/operator';
import { useContext } from '../src/context';
import { OperatorContext } from '../src/defaults';
import { manifestOperator, helmOperator, olmOperator } from '@r8s/k8s-types';

describe('Operator Declaration', () => {
  it('should declare an operator using helper', () => {
    const operator = manifestOperator('test', 'https://example.com/test.yaml', '1.0.0');
    const element = declareOperator(operator);

    expect(element.type).toBe(Symbol.for('r8s.operator'));
    expect(element.props.operator).toEqual(operator);
  });

  it('should collect operators in render result', () => {
    const operator = manifestOperator('test', 'https://example.com/test.yaml', '1.0.0');
    const element = declareOperator(operator);

    const result = render(element);

    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].name).toBe('test');
    expect(result.operators[0].version).toBe('1.0.0');
    expect(result.operators[0].source.type).toBe('manifest');
    expect(result.operators[0].source.url).toBe('https://example.com/test.yaml');
  });

  it('should deduplicate operators by name', () => {
    const element = jsx(Fragment, {
      children: [
        declareOperator(manifestOperator('test', 'https://example.com/test.yaml', '1.0.0')),
        declareOperator(manifestOperator('test', 'https://example.com/test.yaml', '2.0.0')),
      ],
    });

    const result = render(element);

    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].version).toBe('2.0.0');
  });

  it('should collect multiple different operators', () => {
    const element = jsx(Fragment, {
      children: [
        declareOperator(manifestOperator('a', 'https://example.com/a.yaml', '1.0.0')),
        declareOperator(manifestOperator('b', 'https://example.com/b.yaml', '1.0.0')),
        declareOperator(manifestOperator('c', 'https://example.com/c.yaml', '1.0.0')),
      ],
    });

    const result = render(element);

    expect(result.operators).toHaveLength(3);
    const names = result.operators.map(op => op.name);
    expect(names).toContain('a');
    expect(names).toContain('b');
    expect(names).toContain('c');
  });
});

describe('Operator Context', () => {
  it('should read operators from OperatorContext', () => {
    function Component() {
      const operators = useContext(OperatorContext);
      return jsx('ConfigMap', {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: `ops-${operators.length}` },
      });
    }

    const result = render(
      jsx(OperatorContext.Provider, {
        value: [manifestOperator('test', 'https://example.com/test.yaml', '1.0.0')],
        children: jsx(Component, {}),
      })
    );

    expect(result.resources[0].metadata.name).toBe('ops-1');
  });

  it('should not duplicate operators already in context', () => {
    function Component() {
      const operators = useContext(OperatorContext);
      const hasTest = operators.some(op => op.name === 'test');
      if (!hasTest) {
        return declareOperator(manifestOperator('test', 'https://example.com/test.yaml', '1.0.0'));
      }
      return jsx('ConfigMap', {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: { name: 'already-have-test' },
      });
    }

    const result = render(
      jsx(OperatorContext.Provider, {
        value: [manifestOperator('test', 'https://example.com/test.yaml', '1.0.0')],
        children: jsx(Component, {}),
      })
    );

    expect(result.operators).toHaveLength(1);
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].metadata.name).toBe('already-have-test');
  });
});

describe('Operator Source Types', () => {
  it('should create manifest operator with correct structure', () => {
    const op = manifestOperator('test', 'https://example.com/test.yaml', '1.0.0', {
      description: 'Test operator',
      namespace: 'test-system',
      crds: ['tests.example.com'],
    });

    expect(op.name).toBe('test');
    expect(op.source.type).toBe('manifest');
    expect(op.source.url).toBe('https://example.com/test.yaml');
    expect(op.source.version).toBe('1.0.0');
    expect(op.source.namespace).toBe('test-system');
    expect(op.crds).toContain('tests.example.com');
    expect(op.installCommand).toContain('kubectl apply');
  });

  it('should create helm operator with correct structure', () => {
    const op = helmOperator('test', 'test-chart', 'https://charts.example.com', '1.0.0', {
      description: 'Test Helm operator',
      values: { key: 'value' },
    });

    expect(op.name).toBe('test');
    expect(op.source.type).toBe('helm');
    expect(op.source.chart).toBe('test-chart');
    expect(op.source.repository).toBe('https://charts.example.com');
    expect(op.source.values).toEqual({ key: 'value' });
  });

  it('should create OLM operator with correct structure', () => {
    const op = olmOperator('test', 'test-package', 'stable', '1.0.0');

    expect(op.name).toBe('test');
    expect(op.source.type).toBe('olm');
    expect(op.source.package).toBe('test-package');
    expect(op.source.channel).toBe('stable');
  });
});

describe('Operator with Function Components', () => {
  it('should collect operators from function components', () => {
    function DatabaseComponent() {
      return declareOperator(manifestOperator('cnpg', 'https://example.com/cnpg.yaml', '1.0.0'));
    }

    function AppComponent() {
      return [
        jsx(DatabaseComponent, {}),
        jsx('Deployment', {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: { name: 'app' },
        }),
      ];
    }

    const result = render(jsx(AppComponent, {}));

    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].name).toBe('cnpg');
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].kind).toBe('Deployment');
  });
});

describe('Operator Deduplication Logic', () => {
  it('should deduplicate same operator from multiple components', () => {
    function Database1() {
      return declareOperator(manifestOperator('cnpg', 'https://example.com/cnpg.yaml', '1.0.0'));
    }

    function Database2() {
      return declareOperator(manifestOperator('cnpg', 'https://example.com/cnpg.yaml', '1.0.0'));
    }

    const result = render(
      jsx(Fragment, {
        children: [
          jsx(Database1, {}),
          jsx(Database2, {}),
        ],
      })
    );

    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].name).toBe('cnpg');
  });
});
