import { IdSet, SubtractionIdSet } from '../public-api';

const value1 = { id: '1', value: 'value1' };
const value2 = { id: '2', value: 'value2' };
const value3 = { id: '3', value: 'value3' };
const value4 = { id: '4', value: 'value4' };
const value5 = { id: '5', value: 'value5' };
const value1update = { id: '1', value: 'value1' };

const idSet123 = [value1, value2, value3];
const idSet25 = [value2, value5];
const idSet3 = [value3];

type TestValue = { id: string, value: string };
let set1: IdSet<TestValue>;
let set2: IdSet<TestValue>;
let set3: IdSet<TestValue>;
let testObject: SubtractionIdSet<TestValue>;

let created: TestValue[];
let updated: TestValue[];
let deleted: TestValue[];

describe('SubtractionIdSet', () => {
  beforeEach(() => {
    set1 = new IdSet(idSet123);
    set2 = new IdSet(idSet25);
    set3 = new IdSet(idSet3);
    testObject = new SubtractionIdSet(set1, [set2, set3]);

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
    it('should create a SubtractionIdSet from the given IdSets', () => {
      expect(testObject.size).toBe(1);
      expect(testObject.get(value1.id)).toBe(value1);
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
      it('should add a value to the set if it is added to the sourceset and not present in the subtractsets', () => {
        set1.add(value4);

        expect(testObject.size).toBe(2);
        expect(created).toEqual([value4]);
      });

      it('should not add a value to the set if it is added to the sourceset and present in one of the subtractsets', () => {
        set1.add(value5);

        expect(testObject.size).toBe(1);
        expect(testObject.has(value5.id)).toBeFalse();
        expect(created).toEqual([]);
      });

      it('should remove a value if it is removed from the sourceset', () => {
        set1.delete(value1.id);

        expect(testObject.size).toBe(0);
        expect(deleted).toEqual([value1]);
      });

      it('should add a value if it is present in hte sourceset and removed from all subtractsets', () => {
        set2.delete(value2.id);

        expect(testObject.size).toBe(2);
        expect(created).toEqual([value2]);
      });

      it('should only publish the same update for a value from different source sets once', () => {
        set1.add(value1update);
        set1.add(value1update);

        expect(testObject.size).toBe(1);
        expect(updated).toEqual([value1update]);
      });
    });
  });
});