import { of } from 'rxjs';
import { IdObject } from '../types';
import { mapDelta, mergeMapDelta, processDelta } from './process-delta';

const testPermutations: string[][] = [];

// const processFunction = (idObject: IdObject) => (testEntries.push(idObject.id));
const properties = ['create', 'update', 'delete'];

// create all permutations
for (let i = 0; i < Math.pow(2, properties.length); i++) {
  const entry: string[] = [];
  for (let j = 0; j < properties.length; j++) {
    if ((i >>> j) % 2 === 1) {
      entry.push(properties[j]);
    }
  }
  testPermutations.push(entry);
}

let processResult: string[] = [];
const processFunction = (value: IdObject) => {
  processResult.push(value.id + ' processed');
};

const mergeMapFunction = (value: IdObject) => of(value.id + ' processed');


const testSet = testPermutations.map(permutationFunction => {
  const testProcessFunction: any = {};
  const testMergeMapFunction: any = {};
  permutationFunction.forEach(property => {
    testProcessFunction[property] = processFunction;
    testMergeMapFunction[property] = mergeMapFunction;
  });
  return testPermutations.map(permutationValue => {
    const testDelta: any = {};
    const testResult: string[] = [];
    permutationValue.forEach(property => {
      testDelta[property] = { id: property };
      if (permutationFunction.includes(property)) {
        testResult.push(property + ' processed');
      }
    });
    return {
      testProcessFunction,
      testMergeMapFunction,
      testDelta,
      testResult
    };
  });
}).flat();

describe('processDelta', () => {
  it('should process the create, update and/or delete fields with the supplied function', () => {
    for (const test of testSet) {
      processResult = [];
      processDelta(test.testDelta, test.testProcessFunction);
      expect(processResult).toEqual(test.testResult);
    }
  });
});

describe('mapDelta', () => {
  it('should transform the create, update and/or delete fields with the supplied function', () => {
    // only the last 8 entries of the testset apply to this test
    for (let i = 56; i < 64; i++) {
      const test = testSet[i];
      let testResult: any = {};
      of(test.testDelta).pipe(mapDelta(value => ({ id: value.id + ' mapped' }))).subscribe(result => testResult = result);
      const expectedResult: any = {};
      for (const property in test.testDelta) {
        expectedResult[property] = [{ id: property + ' mapped' }];
      }
      expect(testResult).toEqual(expectedResult);
    }
  });
});

describe('mergeMapDelta', () => {
  it('should process the create, update and/or delete fields with the supplied function', () => {
    for (const test of testSet) {
      const mergeMapResult: string[] = [];
      of(test.testDelta).pipe(mergeMapDelta(test.testMergeMapFunction)).subscribe(result => mergeMapResult.push(result as string));
      // console.log(mergeMapResult)
      expect(mergeMapResult).toEqual(test.testResult);
    }
  });
});