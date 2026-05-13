import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';

describe('Financial Precision with Decimal.js', () => {
  it('should handle floating point addition correctly', () => {
    // 0.1 + 0.2 in standard JS is 0.30000000000000004
    const result = 0.1 + 0.2;
    expect(result).not.toBe(0.3);

    const decimalResult = new Decimal(0.1).plus(0.2).toNumber();
    expect(decimalResult).toBe(0.3);
  });

  it('should calculate freight with precision', () => {
    const pricePerKg = 1.05;
    const weight = 100.1;
    const fixedTax = 10.55;
    
    // Total should be: 10.55 + (1.05 * 100.1) = 10.55 + 105.105 = 115.655
    const expected = 115.655;
    
    const calculated = new Decimal(fixedTax).plus(new Decimal(pricePerKg).times(weight)).toNumber();
    expect(calculated).toBe(expected);
  });
});
