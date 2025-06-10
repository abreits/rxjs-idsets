import { IdSet, UnionIdSet } from '../public-api';

const value1 = { id: '1', value: 'value1' };
const value2 = { id: '2', value: 'value2' };
const value3 = { id: '3', value: 'value3' };
const value4 = { id: '4', value: 'value4' };
const value1update = { id: '1', value: 'value1' };

const idSet12 = [value1, value2];
const idSet23 = [value2, value3];
const idSet13 = [value1, value3];
const idSet24 = [value1, value4];

type TestValue = { id: string; value: string };
let set12: IdSet<TestValue>;
let set23: IdSet<TestValue>;
let set13: IdSet<TestValue>;
let set24: IdSet<TestValue>;
let testObject: UnionIdSet<TestValue>;

let created: TestValue[];
let updated: TestValue[];
let deleted: TestValue[];

describe('UnionIdSet', () => {
  beforeEach(() => {
    set12 = new IdSet(idSet12);
    set23 = new IdSet(idSet23);
    set13 = new IdSet(idSet13);
    set24 = new IdSet(idSet24);
    testObject = new UnionIdSet([set12, set23, set13]);

    created = [];
    updated = [];
    deleted = [];
    testObject.create$.subscribe((value) => created.push(value));
    testObject.update$.subscribe((value) => updated.push(value));
    testObject.delete$.subscribe((value) => deleted.push(value));
  });

  afterEach(() => {
    testObject.complete();
  });

  describe('constructor', () => {
    it('should create a UnionIdSet from the given IdSets', () => {
      expect(testObject.size).toBe(3);
      expect(testObject.get(value1.id)).toBe(value1);
      expect(testObject.get(value2.id)).toBe(value2);
      expect(testObject.get(value3.id)).toBe(value3);
    });

    it('should complete subscriptions to itself if all its sources are completed', () => {
      const subscription = testObject.create$.subscribe();
      expect(subscription.closed).toBeFalse();
      set12.complete();
      expect(subscription.closed).toBeFalse();
      set23.complete();
      expect(subscription.closed).toBeFalse();
      set13.complete();
      expect(subscription.closed).toBeTrue();
    });

    describe('propagate mutations in source IdSets', () => {
      it('should add a value to the set if it is added to one of the source sets', () => {
        set12.add(value4);

        expect(testObject.size).toBe(4);
        expect(created).toEqual([value4]);
      });

      it('should not remove a value from the set if it is still in one of the source sets', () => {
        set12.delete(value2.id);

        expect(testObject.size).toBe(3);
        expect(deleted).toEqual([]);
      });

      it('should remove a value from the set if no longer in one of the source sets', () => {
        set12.delete(value2.id);
        set23.delete(value2.id);

        expect(testObject.size).toBe(2);
        expect(deleted).toEqual([value2]);
      });

      it('should only publish the same update for a value from different source sets once', () => {
        set12.add(value1update);
        set13.add(value1update);

        expect(testObject.size).toBe(3);
        expect(updated).toEqual([value1update]);
      });
    });
  });

  describe('add', () => {
    it('should add an idset to the UnionIdSet', () => {
      testObject.add(set24);

      expect(created.length).toBe(1);
      expect(created).toEqual([value4]);
    });
  });

  describe('delete', () => {
    it('should remove an idset from the UnionIdSet', () => {
      testObject.delete([set13, set23]);

      expect(deleted.length).toBe(1);
      expect(deleted).toEqual([value3]);
    });
  });
});
