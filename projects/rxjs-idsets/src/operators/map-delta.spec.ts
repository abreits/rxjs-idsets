import { of } from 'rxjs';
import { DeltaProperty, DeltaValue, IdObject } from '../types';
import { mapDelta } from './map-delta';
import { getDeltaPropertyPermutations } from '../utility/test-utilities.spec';

const deltaPropertyPermutations = getDeltaPropertyPermutations();

type TestItem = {
  deltaProperties: DeltaProperty[];
  expectedResult: DeltaValue<IdObject>;
}
function createTestItem(deltaProperties: DeltaProperty[], transformFunction: (value: IdObject) => IdObject): TestItem {
  const expectedResult: DeltaValue<IdObject> = {};
  deltaProperties.forEach(property => expectedResult[property] = [transformFunction({ id: property })]);
  return { deltaProperties, expectedResult };
}

const transformFunction = (value: IdObject) => {
  return { id: value.id + ' processed' };
};

describe('mapDelta', () => {
  deltaPropertyPermutations.forEach(deltaproperty => {
    const testItem = createTestItem(deltaproperty, transformFunction);
    const testProperties = testItem.deltaProperties.join(', ');
    const testResult = JSON.stringify(testItem.expectedResult);

    it(`should map deltas with properties [${testProperties}] to ${testResult}`, (done) => {
      const testDelta: DeltaValue = {};
      testItem.deltaProperties.forEach(property => testDelta[property] = { id: property });

      of(testDelta).pipe(mapDelta(transformFunction)).subscribe(testResult => {
        expect(testResult).toEqual(testItem.expectedResult);
        done();
      });
    });
  });
});
