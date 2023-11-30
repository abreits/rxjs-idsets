import { DeltaProcessor, DeltaProperty, DeltaValue, IdObject } from '../types';
import { processDelta } from './process-delta';

const propertyPermutations: DeltaProperty[][] = [];

// const processFunction = (idObject: IdObject) => (testEntries.push(idObject.id));
const deltaProperties: DeltaProperty[] = ['create', 'update', 'delete'];

// create all permutations
for (let i = 0; i < Math.pow(2, deltaProperties.length); i++) {
  const entry: DeltaProperty[] = [];
  for (let j = 0; j < deltaProperties.length; j++) {
    if ((i >>> j) % 2 === 1) {
      entry.push(deltaProperties[j]);
    }
  }
  propertyPermutations.push(entry);
}

type TestItem = {
  deltaProperties: DeltaProperty[];
  deltaFunctions: DeltaProperty[];
  expectedResult: string[];
}
function createTestItem(deltaProperties: DeltaProperty[], deltaFunctions: DeltaProperty[], transformFunction: (value: string) => string): TestItem {
  const expectedResult: string[] = [];
  deltaProperties.forEach(property => {
    if (deltaFunctions.includes(property)) {
      expectedResult.push(transformFunction(property));
    }
  });
  return { deltaProperties, deltaFunctions, expectedResult };
}

const transformFunction = (value: string) => value + ' processed';


let testResult: string[] = [];
const processFunction = (value: IdObject) => {
  testResult.push(transformFunction(value.id));
};

describe('processDelta', () => {
  propertyPermutations.forEach(deltaproperty => {
    propertyPermutations.forEach(deltafunction => {
      const testItem = createTestItem(deltaproperty, deltafunction, transformFunction);
      const testProperties = testItem.deltaProperties.join(', ');
      const testFunctions = testItem.deltaFunctions.join(', ');
      const testResults = testItem.expectedResult.join(', ');

      it(`should process deltas with properties [${testProperties}] and processing functions for [${testFunctions}] to [${testResults}] `, () => {
        const testDelta: DeltaValue = {};
        testItem.deltaProperties.forEach(property => testDelta[property] = { id: property });
        const testProcessor: DeltaProcessor<IdObject> = {};
        testItem.deltaFunctions.forEach(property => testProcessor[property] = processFunction);

        testResult = [];
        processDelta(testDelta, testProcessor);
        expect(testResult).toEqual(testItem.expectedResult);

      });
    });
  });
  // it('should process the create, update and/or delete fields with the supplied function', () => {
  //   for (const test of testSet) {
  //     processResult = [];
  //     processDelta(test.testDelta, test.testProcessFunction);
  //     expect(processResult).toEqual(test.testResult);
  //   }
  // });
});
