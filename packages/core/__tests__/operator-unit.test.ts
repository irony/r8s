import { describe, it, expect } from 'vitest';
import { declareOperator, isOperatorDeclaration, getOperator } from '../src/operator';
import { manifestOperator } from '@r8s/k8s-types';

describe('Operator', () => {
  describe('declareOperator', () => {
    it('should create operator declaration element', () => {
      const operator = manifestOperator('test', 'https://example.com/test.yaml', '1.0.0');
      const element = declareOperator(operator);

      expect(element.type).toBe(Symbol.for('r8s.operator'));
      expect(element.props.operator).toEqual(operator);
    });

    it('should handle operator with complex source', () => {
      const operator = manifestOperator('test', 'https://example.com/test.yaml', '1.0.0', {
        description: 'Test operator',
        namespace: 'test-system',
      });
      const element = declareOperator(operator);

      expect(element.props.operator.source.type).toBe('manifest');
      expect(element.props.operator.source.url).toBe('https://example.com/test.yaml');
    });
  });

  describe('isOperatorDeclaration', () => {
    it('should return true for operator declaration', () => {
      const operator = manifestOperator('test', 'https://example.com/test.yaml', '1.0.0');
      const element = declareOperator(operator);

      expect(isOperatorDeclaration(element)).toBe(true);
    });

    it('should return false for regular element', () => {
      const element = {
        type: 'div',
        props: {},
        key: null,
      };

      expect(isOperatorDeclaration(element)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isOperatorDeclaration(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isOperatorDeclaration(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isOperatorDeclaration('string')).toBe(false);
      expect(isOperatorDeclaration(123)).toBe(false);
    });

    it('should return false for object without type', () => {
      expect(isOperatorDeclaration({ props: {} })).toBe(false);
    });

    it('should return false for object with wrong symbol', () => {
      const element = {
        type: Symbol.for('r8s.fragment'),
        props: {},
        key: null,
      };

      expect(isOperatorDeclaration(element)).toBe(false);
    });
  });

  describe('getOperator', () => {
    it('should return operator from declaration', () => {
      const operator = manifestOperator('test', 'https://example.com/test.yaml', '1.0.0');
      const element = declareOperator(operator);

      expect(getOperator(element)).toEqual(operator);
    });

    it('should return null for non-operator element', () => {
      const element = {
        type: 'div',
        props: {},
        key: null,
      };

      expect(getOperator(element)).toBeNull();
    });

    it('should return null for null', () => {
      expect(getOperator(null)).toBeNull();
    });

    it('should return null for element without operator prop', () => {
      const element = {
        type: Symbol.for('r8s.operator'),
        props: {},
        key: null,
      };

      expect(getOperator(element)).toBeNull();
    });
  });
});
