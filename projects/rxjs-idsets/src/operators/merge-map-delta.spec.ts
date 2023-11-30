import { of } from 'rxjs';
import { DeltaProperty, DeltaValue, IdObject, MergeMapDeltaProcessor } from '../types';
import { mergeMapDelta } from './merge-map-delta';
import { getDeltaPropertyPermutations } from '../utility/test-utilities.spec';


const deltaPropertyPermutations = getDeltaPropertyPermutations();

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
const mapFunction = (value: IdObject) => {
  return of(transformFunction(value.id));
};

describe('mergeMapDelta', () => {
  deltaPropertyPermutations.forEach(deltaproperty => {
    deltaPropertyPermutations.forEach(deltafunction => {
      const testItem = createTestItem(deltaproperty, deltafunction, transformFunction);
      const testProperties = testItem.deltaProperties.join(', ');
      const testFunctions = testItem.deltaFunctions.join(', ');
      const testResults = testItem.expectedResult.join(', ');

      it(`should process deltas with properties [${testProperties}] and processing functions for [${testFunctions}] to [${testResults}] `, () => {
        const testDelta: DeltaValue = {};
        testItem.deltaProperties.forEach(property => testDelta[property] = { id: property });
        const testProcessor: MergeMapDeltaProcessor<string, IdObject> = {};
        testItem.deltaFunctions.forEach(property => testProcessor[property] = mapFunction);

        const testResult: string[] = [];
        of(testDelta).pipe(mergeMapDelta(testProcessor)).subscribe(result => testResult.push(result as string));
        expect(testResult).toEqual(testItem.expectedResult);
      });
    });
  });
});
