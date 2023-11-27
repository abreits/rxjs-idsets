import { oneOrMoreForEach, oneOrMoreMap, oneOrMoreToArray, oneOrMoreToIterable } from './one-or-more';

describe('oneOrMoreForEach', () => {
  it('should execute the fn function if arg1 is a single element', () => {
    const result: string[] = [];
    oneOrMoreForEach('test', element => result.push(element));
    expect(result).toEqual(['test']);
  });

  it('should execute the forEach function for a each element in an arg1 if it is an iterator', () => {
    const result: string[] = [];
    oneOrMoreForEach(['test1', 'test2', 'test3'], element => result.push(element));
    expect(result).toEqual(['test1', 'test2', 'test3']);
  });
});

describe('oneOrMoreMap', () => {
  it('should execute the fn function if arg1 is a single element', () => {
    const result = oneOrMoreMap('test', element => `element:${element}`);
    expect(result).toEqual(['element:test']);
  });

  it('should execute the forEach function for a each element in an arg1 if it is an iterator', () => {
    const result = oneOrMoreMap(['test1', 'test2', 'test3'], element => `element:${element}`);
    expect(result).toEqual(['element:test1', 'element:test2', 'element:test3']);
  });
});

describe('oneOrMoreToArray', () => {
  it('should return [arg1] if arg1 is a single element', () => {
    const arg1 = 'test';
    const result = oneOrMoreToArray(arg1);
    expect(result).toEqual(['test']);
  });

  it('should return an array of its elements if it is an iterator', () => {
    const arg1 = new Set(['test1', 'test2']);
    const result = oneOrMoreToArray(arg1);
    expect(result).toEqual(['test1', 'test2']);
  });
});

describe('oneOrMoreToIterable', () => {
  it('should return [arg1] if arg1 is a single element', () => {
    const arg1 = 'test';
    const result = oneOrMoreToIterable(arg1);
    expect(result).toEqual(['test']);
  });

  it('should return arg1 if it is an iterator', () => {
    const arg1 = new Set(['test1', 'test2']);
    const result = oneOrMoreToIterable(arg1);
    expect(result).toBe(arg1);
  });
});