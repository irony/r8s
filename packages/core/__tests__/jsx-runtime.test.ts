import { describe, it, expect } from 'vitest';
import { jsx, jsxs, jsxDEV, Fragment } from '../src/jsx-runtime';

describe('JSX Runtime', () => {
  describe('jsx', () => {
    it('should create element with string type', () => {
      const element = jsx('div', { className: 'test' });

      expect(element.type).toBe('div');
      expect(element.props).toEqual({ className: 'test' });
      expect(element.key).toBeNull();
    });

    it('should create element with function type', () => {
      const Component = () => null;
      const element = jsx(Component, { prop: 'value' });

      expect(element.type).toBe(Component);
      expect(element.props).toEqual({ prop: 'value' });
    });

    it('should create element with symbol type', () => {
      const element = jsx(Fragment, { children: [] });

      expect(element.type).toBe(Fragment);
    });

    it('should handle key parameter', () => {
      const element = jsx('div', { className: 'test' }, 'unique-key');

      expect(element.key).toBe('unique-key');
    });

    it('should handle null key', () => {
      const element = jsx('div', { className: 'test' });

      expect(element.key).toBeNull();
    });

    it('should handle empty props', () => {
      const element = jsx('div', {});

      expect(element.props).toEqual({});
    });

    it('should handle nested children', () => {
      const child = jsx('span', { text: 'child' });
      const element = jsx('div', { children: child });

      expect(element.props.children).toEqual(child);
    });

    it('should handle array children', () => {
      const children = [
        jsx('span', { key: '1' }),
        jsx('span', { key: '2' }),
      ];
      const element = jsx('div', { children });

      expect(Array.isArray(element.props.children)).toBe(true);
      expect(element.props.children).toHaveLength(2);
    });
  });

  describe('jsxs', () => {
    it('should behave like jsx', () => {
      const element = jsxs('div', { className: 'test' });

      expect(element.type).toBe('div');
      expect(element.props).toEqual({ className: 'test' });
    });

    it('should handle key parameter', () => {
      const element = jsxs('div', { className: 'test' }, 'key-1');

      expect(element.key).toBe('key-1');
    });
  });

  describe('jsxDEV', () => {
    it('should be same as jsx', () => {
      const element = jsxDEV('div', { className: 'test' });

      expect(element.type).toBe('div');
      expect(element.props).toEqual({ className: 'test' });
    });
  });

  describe('Fragment', () => {
    it('should be a symbol', () => {
      expect(typeof Fragment).toBe('symbol');
    });

    it('should have correct description', () => {
      expect(Fragment.toString()).toBe('Symbol(r8s.fragment)');
    });
  });

  describe('Edge cases', () => {
    it('should handle symbols as props', () => {
      const sym = Symbol('test');
      const element = jsx('div', { [sym]: 'value' });

      expect(element.props[sym]).toBe('value');
    });

    it('should handle undefined props', () => {
      const element = jsx('div', undefined as any);

      expect(element.props).toBeUndefined();
    });

    it('should handle null props', () => {
      const element = jsx('div', null as any);

      expect(element.props).toBeNull();
    });

    it('should handle deeply nested structures', () => {
      const deep = jsx('div', {
        children: jsx('div', {
          children: jsx('div', {
            children: jsx('span', { text: 'deep' }),
          }),
        }),
      });

      expect(deep.type).toBe('div');
      expect(deep.props.children.type).toBe('div');
      expect(deep.props.children.props.children.type).toBe('div');
      expect(deep.props.children.props.children.props.children.type).toBe('span');
    });
  });
});
