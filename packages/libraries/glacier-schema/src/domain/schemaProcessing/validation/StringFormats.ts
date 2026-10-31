import type { IStringFormat } from "../schema/IStringFormat.js";

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
  static readonly #CHECKS: Readonly<Record<IStringFormat, (value: string) => boolean>> = {
    email: (value) => value.length <= 254 && EMAIL.test(value),
    uuid: (value) => UUID.test(value),
    url: (value) => URL_WITH_AUTHORITY.test(value),
    "date-time": (value) => StringFormats.#isDateTime(value),
    date: (value) => StringFormats.#isDate(value),
    ipv4: (value) => IPV4.test(value),
  };

  /** Whether `name` is one of the supported formats. */
  public static isKnown(name: string): name is IStringFormat {
    return Object.hasOwn(StringFormats.#CHECKS, name);
  }

  /** Whether `value` is a well-formed instance of `format`. */
  public static matches(format: IStringFormat, value: string): boolean {
    return StringFormats.#CHECKS[format](value);
  }

  /** An RFC 3339 `full-date` naming a real calendar day. */
  static #isDate(value: string): boolean {
    const parts = DATE.exec(value);
    if (parts === null) return false;
    const [year, month, day] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
    const calendar = new Date(Date.UTC(year, month - 1, day));
    return calendar.getUTCMonth() === month - 1 && calendar.getUTCDate() === day;
  }

  /** An RFC 3339 `date-time`: a real day, `T`, a time with an offset (leap second 60 allowed). */
  static #isDateTime(value: string): boolean {
    const separator = value.search(/t/i);
    if (separator === -1 || !StringFormats.#isDate(value.slice(0, separator))) return false;
    const time = TIME.exec(value.slice(separator + 1));
    if (time === null) return false;
    const [hour, minute, second] = [Number(time[1]), Number(time[2]), Number(time[3])];
    const offsetHour = Number(time[4] ?? 0);
    const offsetMinute = Number(time[5] ?? 0);
    return hour < 24 && minute < 60 && second <= 60 && offsetHour < 24 && offsetMinute < 60;
  }
}
