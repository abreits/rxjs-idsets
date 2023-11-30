import { of } from 'rxjs';
import { DeltaProperty, DeltaValue, IdObject } from '../types';
import { mapDelta } from './map-delta';

const propertyPermutations: DeltaProperty[][] = [];

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
  propertyPermutations.forEach(deltaproperty => {
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
