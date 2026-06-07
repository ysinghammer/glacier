export function compareArray<T>(a1: T[], a2: T[]): boolean {
  if (a1.length !== a2.length) {
    return false;
  }
  for (const [i, element] of a1.entries()) {
    if (element !== a2[i]) {
      return false;
    }
  }
  return true;
}
