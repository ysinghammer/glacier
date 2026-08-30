import { isValidDateFormat } from '../../formats/_functions/isValidDateFormat.js';
import { isValidDateTimeFormat } from '../../formats/_functions/isValidDateTimeFormat.js';
import { isValidEmailFormat } from '../../formats/_functions/isValidEmailFormat.js';
import { isValidIpv4Format } from '../../formats/_functions/isValidIpv4Format.js';
import { isValidIpv6Format } from '../../formats/_functions/isValidIpv6Format.js';
import { isValidTimeFormat } from '../../formats/_functions/isValidTimeFormat.js';
import { isValidUriFormat } from '../../formats/_functions/isValidUriFormat.js';
import { isValidUuidFormat } from '../../formats/_functions/isValidUuidFormat.js';
import type { ICompiledValidator } from '../_interfaces/ICompiledValidator.js';
import type { TFormat } from '../../../definition/TFormat.js';

const FORMAT_CHECKERS: Record<TFormat, (value: string) => boolean> = {
  email: isValidEmailFormat,
  'date-time': isValidDateTimeFormat,
  date: isValidDateFormat,
  time: isValidTimeFormat,
  uuid: isValidUuidFormat,
  uri: isValidUriFormat,
  ipv4: isValidIpv4Format,
  ipv6: isValidIpv6Format
};

/** Compiles the `format` keyword: `value` must satisfy the named format checker. */
export function compileFormatCheck(format: TFormat): ICompiledValidator {
  const checker = FORMAT_CHECKERS[format];
  return (value, path) => {
    if (typeof value !== 'string' || checker(value)) return [];
    return [
      {
        path: [...path],
        keyword: 'format',
        message: `must match format "${format}"`,
        params: { format }
      }
    ];
  };
}
