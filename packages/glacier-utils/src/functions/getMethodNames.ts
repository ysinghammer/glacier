export function getMethodNames(cls: Function): string[] {
  const methods = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment --- Prototype is not typed
  let currentProto = cls.prototype;

  while (currentProto) {
    Object.getOwnPropertyNames(currentProto)
      .filter((prop) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access --- Prototype is not typed
        return typeof cls.prototype[prop] === 'function' && prop !== 'constructor';
      })
      .forEach((prop) => methods.add(prop));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment --- Prototype is not typed
    currentProto = Object.getPrototypeOf(currentProto);
    if (currentProto === Object.prototype) {
      break;
    }
  }

  return [...methods];
}
