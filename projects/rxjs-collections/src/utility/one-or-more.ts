
export type OneOrMore<T> = T | Iterable<T>;

export function oneOrMoreForEach<T>(arg1: OneOrMore<T>, fn: (v: T) => void) {
  if (arg1 && typeof arg1 === 'object' && Symbol.iterator in arg1) {
    const values = arg1;
    for (const value of values) {
      fn(value);
    }
  } else {
    const value = arg1 as T;
    fn(value);
  }
}

export function oneOrMoreToArray<T>(arg1: OneOrMore<T>) {
  if (arg1 && typeof arg1 === 'object' && Symbol.iterator in arg1) {
    return [...arg1];
  } else {
    return [arg1];
  }
}

export function oneOrMoreToIterable<T>(arg1: OneOrMore<T>) {
  if (arg1 && typeof arg1 === 'object' && Symbol.iterator in arg1) {
    return arg1;
  } else {
    return [arg1];
  }
}
