import type { IStringFormat } from "../schema/types/IStringFormat.js";

const EMAIL =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const UUID =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
const URL_WITH_AUTHORITY = /^[a-z][a-z0-9+.-]*:\/\/[^\s/?#]+(?:[/?#]\S*)?$/i;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:z|[+-](\d{2}):(\d{2}))$/i;
const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

/** Syntactic checks for the named string formats; none of them contacts the network or resolves names. */
export class StringFormats {
  /** Syntactic recognizers for each supported format; checks never perform network or name resolution. */
  private static readonly formatChecks: Readonly<
    Record<IStringFormat, (value: string) => boolean>
  > = {
    email: (value) => value.length <= 254 && EMAIL.test(value),
    uuid: (value) => UUID.test(value),
    url: (value) => URL_WITH_AUTHORITY.test(value),
    "date-time": (value) => StringFormats.isDateTime(value),
    date: (value) => StringFormats.isDate(value),
    ipv4: (value) => IPV4.test(value),
  };

  /**
   * Checks whether a format name is supported by this package.
   * @param name Untrusted name to narrow to a supported format.
   * @returns True when the name has a registered syntax checker.
   */
  public static isKnown(name: string): name is IStringFormat {
    return Object.hasOwn(StringFormats.formatChecks, name);
  }

  /**
   * Checks a string against the syntax rule for a named format.
   * @param format Supported string format to test.
   * @param value Candidate string value.
   * @returns True when the value satisfies the local syntax check.
   */
  public static matches(format: IStringFormat, value: string): boolean {
    return StringFormats.formatChecks[format](value);
  }

  /**
   * Checks an RFC 3339 full-date and verifies that its calendar day exists.
   * @param value Candidate date string in year-month-day form.
   * @returns True when syntax and calendar components form a real date.
   */
  private static isDate(value: string): boolean {
    const parts = DATE.exec(value);
    if (parts === null) return false;
    const [year, month, day] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
    const calendar = new Date(Date.UTC(year, month - 1, day));
    return calendar.getUTCMonth() === month - 1 && calendar.getUTCDate() === day;
  }

  /**
   * Checks an RFC 3339 date-time with a real date and timezone offset.
   * @param value Candidate date-time string.
   * @returns True when date and time components are in range; second 60 is accepted.
   */
  private static isDateTime(value: string): boolean {
    const separator = value.search(/t/i);
    if (separator === -1 || !StringFormats.isDate(value.slice(0, separator))) return false;
    const time = TIME.exec(value.slice(separator + 1));
    if (time === null) return false;
    const [hour, minute, second] = [Number(time[1]), Number(time[2]), Number(time[3])];
    const offsetHour = Number(time[4] ?? 0);
    const offsetMinute = Number(time[5] ?? 0);
    return hour < 24 && minute < 60 && second <= 60 && offsetHour < 24 && offsetMinute < 60;
  }
}
