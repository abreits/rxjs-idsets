
import { IdSet, IntersectionIdSet } from '../public-api';

const value1 = { id: '1', value: 'value1' };
const value2 = { id: '2', value: 'value2' };
const value3 = { id: '3', value: 'value3' };
const value4 = { id: '4', value: 'value4' };
const value1update = { id: '1', value: 'value1' };

const idSet12 = [value1, value2];
const idSet23 = [value2, value3];
const idSet123 = [value1, value2, value3];

type TestValue = { id: string, value: string };
let set1: IdSet<TestValue>;
let set2: IdSet<TestValue>;
let set3: IdSet<TestValue>;
let testObject: IntersectionIdSet<TestValue>;

let created: TestValue[];
let updated: TestValue[];
let deleted: TestValue[];

describe('IntersectionIdSet', () => {
  beforeEach(() => {
    set1 = new IdSet(idSet12);
    set2 = new IdSet(idSet23);
    set3 = new IdSet(idSet123);
    testObject = new IntersectionIdSet([set1, set2, set3]);

    created = [];
    updated = [];
    deleted = [];
    testObject.create$.subscribe(value => created.push(value));
    testObject.update$.subscribe(value => updated.push(value));
    testObject.delete$.subscribe(value => deleted.push(value));
  });

  afterEach(() => {
    testObject.complete();
  });
  
  describe('constructor', () => {
    it('should create a IntersectionIdSet from the given IdSets', () => {
      expect(testObject.size).toBe(1);
      expect(testObject.get(value2.id)).toBe(value2);
    });

    it('should complete subscriptions to itself if all its sources are completed', () => {
      const subscription = testObject.create$.subscribe();
      expect(subscription.closed).toBeFalse();
      set1.complete();
      expect(subscription.closed).toBeFalse();
      set2.complete();
      expect(subscription.closed).toBeFalse();
      set3.complete();
      expect(subscription.closed).toBeTrue();
    });

    describe('propagate mutations in source IdSets', () => {
      it('should not add a value to the set if it is not present in all source sets', () => {
        set1.add(value4);

        expect(testObject.size).toBe(1);
        expect(created).toEqual([]);
      });

      it('should add a value to the set if it is present in all source sets', () => {
        set1.add(value3);

        expect(testObject.size).toBe(2);
        expect(testObject.get(value3.id)).toBe(value3);
        expect(created).toEqual([value3]);
      });

      it('should remove a value from the set if it is removed from a source set', () => {
        set3.delete(value2.id);

        expect(testObject.size).toBe(0);
        expect(deleted).toEqual([value2]);
      });

      it('should not publish an already removed value', () => {
        set3.delete(value2.id);
        set2.delete(value2.id);

        expect(testObject.size).toBe(0);
        expect(deleted).toEqual([value2]);
      });

      it('should only publish the same update for a value from different source sets once', () => {
        set2.add(value1);
        expect(testObject.size).toBe(2);

        updated = [];
        set1.add(value1update);
        set2.add(value1update);
        set3.add(value1update);

        expect(updated).toEqual([value1update]);
      });
    });
  });
});