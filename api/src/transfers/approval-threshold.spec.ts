import { describe, expect, it } from 'vitest';
import { readApprovalThreshold } from './approval-threshold.js';

describe('readApprovalThreshold', () => {
  it('defaults to 5000.00 when the variable is unset or blank', () => {
    expect(readApprovalThreshold(undefined).equals('5000.00')).toBe(true);
    expect(readApprovalThreshold('  ').equals('5000.00')).toBe(true);
  });

  it('accepts a positive decimal', () => {
    expect(readApprovalThreshold('7500.25').equals('7500.25')).toBe(true);
  });

  it('rejects invalid and non-positive values', () => {
    expect(() => readApprovalThreshold('abc')).toThrow(/positive decimal/);
    expect(() => readApprovalThreshold('0')).toThrow(/positive decimal/);
    expect(() => readApprovalThreshold('-1')).toThrow(/positive decimal/);
  });
});
