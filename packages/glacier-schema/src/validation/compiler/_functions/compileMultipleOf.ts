import type { ICompiledValidator } from '../_interfaces/ICompiledValidator.js';

function decimalScaleFactor(value: number): number {
  const decimalPart = value.toString().split('.')[1];
  return decimalPart === undefined ? 1 : 10 ** decimalPart.length;
}

/** Compiles the `multipleOf` keyword using a scale-to-integer comparison to avoid float drift. */
export function compileMultipleOf(multipleOf: number): ICompiledValidator {
  const scale = decimalScaleFactor(multipleOf);
  const scaledDivisor = Math.round(multipleOf * scale);
  return (value, path) => {
    if (typeof value !== 'number') return [];
    const remainder = (value * scale) % scaledDivisor;
    const isMultiple = Math.abs(remainder) < 1e-9 || Math.abs(remainder - scaledDivisor) < 1e-9;
    if (isMultiple) return [];
    return [
      {
        path: [...path],
        keyword: 'multipleOf',
        message: `must be a multiple of ${String(multipleOf)}`,
        params: { multipleOf }
      }
    ];
  };
}
