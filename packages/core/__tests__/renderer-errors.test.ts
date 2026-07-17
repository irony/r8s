import { describe, it, expect } from 'vitest';
import { render } from '../src/renderer';
import { jsx, Fragment } from '../src/jsx-runtime';

describe('Renderer Error Cases', () => {
  it('should handle null children gracefully', () => {
    const element = jsx(Fragment, { children: null });
    const result = render(element);

    expect(result.resources).toEqual([]);
    expect(result.operators).toEqual([]);
  });

  it('should handle undefined children gracefully', () => {
    const element = jsx(Fragment, { children: undefined });
    const result = render(element);

    expect(result.resources).toEqual([]);
    expect(result.operators).toEqual([]);
  });

  it('should handle boolean children gracefully', () => {
    const element = jsx(Fragment, { children: true });
    const result = render(element);

    expect(result.resources).toEqual([]);
    expect(result.operators).toEqual([]);
  });

  it('should handle empty array children', () => {
    const element = jsx(Fragment, { children: [] });
    const result = render(element);

    expect(result.resources).toEqual([]);
    expect(result.operators).toEqual([]);
  });

  it('should handle component returning null', () => {
    function NullComponent() {
      return null;
    }

    const element = jsx(NullComponent, {});
    const result = render(element);

    expect(result.resources).toEqual([]);
    expect(result.operators).toEqual([]);
  });

  it('should handle component returning undefined', () => {
    function UndefinedComponent() {
      return undefined;
    }

    const element = jsx(UndefinedComponent, {});
    const result = render(element);

    expect(result.resources).toEqual([]);
    expect(result.operators).toEqual([]);
  });

  it('should handle component returning string', () => {
    function StringComponent() {
      return 'not a valid element' as any;
    }

    const element = jsx(StringComponent, {});
    const result = render(element);

    expect(result.resources).toEqual([]);
    expect(result.operators).toEqual([]);
  });

  it('should handle component returning number', () => {
    function NumberComponent() {
      return 42 as any;
    }

    const element = jsx(NumberComponent, {});
    const result = render(element);

    expect(result.resources).toEqual([]);
    expect(result.operators).toEqual([]);
  });

  it('should handle deeply nested fragments', () => {
    const element = jsx(Fragment, {
      children: [
        jsx('span', { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'child1' } }),
        jsx('span', { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'child2' } }),
        [
          jsx('span', { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'child3' } }),
          [
            jsx('span', { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'child4' } }),
          ],
        ],
      ],
    });

    const result = render(element);
    expect(result.resources).toHaveLength(4);
  });

  it('should handle mixed valid and invalid children', () => {
    const element = jsx(Fragment, {
      children: [
        jsx('span', { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'child1' } }),
        null,
        undefined,
        true,
        'string',
        42,
        jsx('span', { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'child2' } }),
      ],
    });

    const result = render(element);
    expect(result.resources).toHaveLength(2);
  });

  it('should handle resource without apiVersion', () => {
    const element = jsx('div', {
      kind: 'Deployment',
      metadata: { name: 'test' },
    });

    const result = render(element);
    expect(result.resources).toEqual([]);
  });

  it('should handle resource without kind', () => {
    const element = jsx('div', {
      apiVersion: 'apps/v1',
      metadata: { name: 'test' },
    });

    const result = render(element);
    expect(result.resources).toEqual([]);
  });

  it('should handle component throwing error', () => {
    function ErrorComponent() {
      throw new Error('Component error');
    }

    const element = jsx(ErrorComponent, {});
    expect(() => render(element)).toThrow('Component error');
  });

  it('should deduplicate operators correctly', () => {
    const operator1 = { name: 'test', source: { type: 'manifest' as const, url: 'https://example.com/1.yaml' }, version: '1.0.0' };
    const operator2 = { name: 'test', source: { type: 'manifest' as const, url: 'https://example.com/2.yaml' }, version: '2.0.0' };

    function MultiOperatorComponent() {
      return [
        { type: Symbol.for('r8s.operator'), props: { operator: operator1 }, key: null },
        { type: Symbol.for('r8s.operator'), props: { operator: operator2 }, key: null },
      ];
    }

    const element = jsx(MultiOperatorComponent, {});
    const result = render(element);

    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].version).toBe('2.0.0'); // Last one wins
  });
});
