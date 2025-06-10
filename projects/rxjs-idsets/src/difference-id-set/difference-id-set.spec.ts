import { IdSet, DifferenceIdSet } from '../public-api';

const value1 = { id: '1', value: 'value1' };
const value2 = { id: '2', value: 'value2' };
const value3 = { id: '3', value: 'value3' };
const value4 = { id: '4', value: 'value4' };
const value5 = { id: '5', value: 'value5' };
const value1update = { id: '1', value: 'value1' };

const idSet123 = [value1, value2, value3];
const idSet25 = [value2, value5];
const idSet3 = [value3];
const idSet14 = [value1, value4];

type TestValue = { id: string; value: string };
let set1: IdSet<TestValue>;
let set2: IdSet<TestValue>;
let set3: IdSet<TestValue>;
let set4: IdSet<TestValue>;
let testObject: DifferenceIdSet<TestValue>;

let created: TestValue[];
let updated: TestValue[];
let deleted: TestValue[];

fdescribe('DifferenceIdSet', () => {
  beforeEach(() => {
    set1 = new IdSet(idSet123);
    set2 = new IdSet(idSet25);
    set3 = new IdSet(idSet3);
    set4 = new IdSet(idSet14);
    testObject = new DifferenceIdSet(set1, [set2, set3]);

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
    it('should create a DifferenceIdSet from the given IdSets', () => {
      expect(testObject.size).toBe(1);
      expect(testObject.get(value1.id)).toBe(value1);
    });

    describe('complete', () => {
      it('should complete after all inputs complete, source set completed first', () => {
        const subscription = testObject.create$.subscribe();
        expect(subscription.closed).toBeFalse();
        set1.complete();
        expect(subscription.closed).toBeFalse();
        set2.complete();
        expect(subscription.closed).toBeFalse();
        set3.complete();
        expect(subscription.closed).toBeTrue();
      });

      it('should complete after all inputs complete, other sets completed first', () => {
        const subscription = testObject.create$.subscribe();
        expect(subscription.closed).toBeFalse();
        set2.complete();
        expect(subscription.closed).toBeFalse();
        set3.complete();
        expect(subscription.closed).toBeFalse();
        set1.complete();
        expect(subscription.closed).toBeTrue();
      });
    });

    describe('propagate mutations in source IdSets', () => {
      it('should add a value to the set if it is added to the sourceset and not present in the other sets', () => {
        set1.add(value4);

        expect(testObject.size).toBe(2);
        expect(created).toEqual([value4]);
      });

      it('should not add a value to the set if it is added to the sourceset and present in one of the other sets', () => {
        set1.add(value5);

        expect(testObject.size).toBe(1);
        expect(testObject.has(value5.id)).toBeFalse();
        expect(created).toEqual([]);
      });

      it('should remove a value from the set if it is added to one of the other sets', () => {
        set2.add(value1);

        expect(testObject.size).toBe(0);
        expect(deleted).toEqual([value1]);
      });

      it('should remove a value if it is removed from the sourceset', () => {
        set1.delete(value1.id);

        expect(testObject.size).toBe(0);
        expect(deleted).toEqual([value1]);
      });

      it('should add a value if it is present in the sourceset and removed from all other sets', () => {
        set2.delete(value2.id);

        expect(testObject.size).toBe(2);
        expect(created).toEqual([value2]);
      });

      it('should not add a value if it is present in the sourceset, removed a other set, but still present in another subset', () => {
        set3.add(value2);
        set2.delete(value2.id);

        expect(testObject.size).toBe(1);
        expect(created).toEqual([]);
      });

      it('should only publish the same update for a value from different source sets once', () => {
        set1.add(value1update);
        set1.add(value1update);

        expect(testObject.size).toBe(1);
        expect(updated).toEqual([value1update]);
      });
    });
  });

  describe('add', () => {
    it('should add a new IdSet to subtraction sets', () => {
      testObject.add(set4);

      expect(testObject.size).toBe(0);
      expect(deleted).toEqual([value1]);
    });
  });

  describe('delete', () => {
    it('should remove an existing IdSet from subtraction sets', () => {
      testObject.delete(set3);

      expect(testObject.size).toBe(2);
      expect(created).toEqual([value3]);
    });

    it('should remove an existing IdSet from subtraction sets and ignore unsubtracted sets', () => {
      testObject.delete([set3, set4]);

      expect(testObject.size).toBe(2);
      expect(created).toEqual([value3]);
    });
  });
});
