import { ContainerIdSet } from './container-id-set';
import { IdObject } from '../types';
import { IntersectionIdSet, DifferenceIdSet, UnionIdSet } from '../public-api';

type IdValue = { id: string, value: string };

const value1 = { id: '1', value: 'value1' };
const value2 = { id: '2', value: 'value2' };
const value3 = { id: '3', value: 'value3' };
const value4 = { id: '4', value: 'value4' };
const value1update = { id: '1', value: 'value1' };

let testObject = new ContainerIdSet();

describe('ContainerIdSet', () => {
  beforeEach(() => {
    testObject = new ContainerIdSet();
  });

  afterEach(() => {
    testObject.complete(); // close all subscriptions
  });

  describe('constructor', () => {
    it('should create', () => {
      expect(new ContainerIdSet()).toBeDefined();
    });

    it('should create an empty set if no values are defined', () => {
      const containerIdSet = new ContainerIdSet([value1, value2]);
      expect(containerIdSet.size).toBe(0);
    });

    it('should create a populated set according to setsBelongedTo', () => {
      const newValues: [IdValue, Iterable<string>][] = [
        [value1, ['set1']],
        [value2, ['set1']]
      ];
      const containerIdSet = new ContainerIdSet(newValues);
      expect(containerIdSet.size).toBe(2);
    });
  });


  describe('sets', () => {
    it('should return an empty map for a new empty ContainerIdSet', () => {
      const sets = testObject.sets;
      expect(sets.size).toBe(0);
    });

    it('should return a map with the SetId as key and an IdSet with the SetId members as value', () => {
      testObject.add(value1, 'set1');
      testObject.add(value2, 'set1');
      testObject.add(value3, 'set2');

      const sets = testObject.sets;
      expect(sets.size).toBe(2);
      expect(sets.get('set1')?.size).toBe(2);
      expect(sets.get('set1')?.get(value1.id)).toBe(value1);
      expect(sets.get('set1')?.get(value2.id)).toBe(value2);
      expect(sets.get('set2')?.size).toBe(1);
      expect(sets.get('set2')?.get(value3.id)).toBe(value3);
      expect(sets.get('set3')).toBeUndefined();
    });
  });

  describe('add', () => {
    it('should not add an element if no SetId is provided', () => {
      testObject.add(value1);
      expect(testObject.get(value1.id)).toBeUndefined();
    });

    it('should add a new element to the sets and update the specified sets', () => {
      testObject.add(value1, 'set1');
      expect(testObject.get(value1.id)).toBe(value1);
      expect(testObject.setsBelongedTo(value1.id)?.size).toBe(1);
      expect(testObject.setsBelongedTo(value1.id)).toContain('set1');
      expect(testObject.sets.get('set1')?.size).toBe(1);
      expect(testObject.sets.get('set1')?.get(value1.id)).toBe(value1);

      testObject.add(value2, ['set1', 'set2']);
      expect(testObject.get(value2.id)).toBe(value2);
      expect(testObject.setsBelongedTo(value2.id)?.size).toBe(2);
      expect(testObject.setsBelongedTo(value2.id)).toContain('set1');
      expect(testObject.setsBelongedTo(value2.id)).toContain('set2');
      expect(testObject.sets.get('set1')?.size).toBe(2);
      expect(testObject.sets.get('set1')?.get(value1.id)).toBe(value1);
      expect(testObject.sets.get('set1')?.get(value2.id)).toBe(value2);
      expect(testObject.sets.get('set2')?.size).toBe(1);
      expect(testObject.sets.get('set2')?.get(value2.id)).toBe(value2);
    });

    it('should update an existing updated value in all sets the value belongs to', () => {
      testObject.add(value1, ['set1', 'set2']);
      expect(testObject.sets.get('set2')?.get(value1.id)).toBe(value1);

      testObject.add(value1update, 'set1');
      expect(testObject.sets.get('set2')?.get(value1.id)).toBe(value1update);
    });

    it('should publish the added value to the ContainerIdSet and the IdSet of the SetId', () => {
      const added: IdObject[] = [];
      const addedToSetId: IdObject[] = [];

      testObject.add$.subscribe(value => added.push(value));
      testObject.getSet('set1').add$.subscribe(value => addedToSetId.push(value));
      testObject.add(value1, 'set1');
      expect(added).toEqual([value1]);
      expect(addedToSetId).toEqual([value1]);
    });
  });

  describe('delete', () => {
    it('should delete the value with specified id from the ContainerIdSet and all contained sets if no sets are provided', () => {
      testObject.add(value1, 'set1');
      testObject.add(value2, ['set1', 'set2']);

      expect(testObject.delete(value2.id)).toBeTrue();
      expect(testObject.get(value2.id)).toBeUndefined();
      expect(testObject.sets.get('set1')?.size).toBe(1);
      expect(testObject.sets.get('set2')?.size).toBe(0);
    });

    it('should publish the deleted value to the IdSet of the specified set', () => {
      const deleted: IdObject[] = [];
      const deleteFromSetId: IdObject[] = [];

      testObject.add(value1, 'set1');

      testObject.delete$.subscribe(value => deleted.push(value));
      testObject.getSet('set1').delete$.subscribe(value => deleteFromSetId.push(value));

      testObject.sets.get('set1')?.delete(value1.id);
      expect(deleted).toEqual([value1]);
      expect(deleteFromSetId).toEqual([value1]);
    });

    it('should not publish the deleted value to the ContainerIdSet if it is present in another set', () => {
      const deleted: IdObject[] = [];
      const deleteFromSetId: IdObject[] = [];


      testObject.add(value1, ['set1', 'set2']);

      testObject.delete$.subscribe(value => deleted.push(value));
      testObject.getSet('set1').delete$.subscribe(value => deleteFromSetId.push(value));

      testObject.sets.get('set1')?.delete(value1.id);
      expect(deleted).toEqual([]);
      expect(deleteFromSetId).toEqual([value1]);
    });

    it('should publish the deleted value to the ContainerIdSet if it is no longer present in any set', () => {
      const deleted: IdObject[] = [];
      const deleteFromSetId: IdObject[] = [];
      testObject.add(value1, ['set1', 'set2']);

      testObject.delete$.subscribe(value => deleted.push(value));
      testObject.getSet('set1').delete$.subscribe(value => deleteFromSetId.push(value));

      testObject.delete(value1.id);
      expect(deleted).toEqual([value1]);
      expect(deleteFromSetId).toEqual([value1]);
    });
  });

  describe('replace', () => {
    it('should clear the ContainerIdSet if value is not of type [IdValue, Iterable<SetId>]', () => {
      testObject.add([value1, value2, value3], 'set1');
      expect(testObject.size).toBe(3);

      testObject.replace([value3, value4]);
      expect(testObject.size).toBe(0);
    });

    it('should only contain the values defined in the replace', () => {
      testObject.add([value1, value2, value3], 'set1');
      testObject.add([value4], 'set2');
      expect(testObject.size).toBe(4);

      const setsBelongedTo: [IdValue, Iterable<string>][] = [
        [value3, ['set1', 'set3']],
        [value4, ['set3']]
      ];
      testObject.replace(setsBelongedTo);
      expect(testObject.size).toBe(2);
      expect(testObject.sets.get('set1')?.size).toBe(1);
      expect(testObject.sets.get('set2')?.size).toBe(0);
      expect(testObject.sets.get('set3')?.size).toBe(2);
    });

    it('should use the same values if cloneValues is false', () => {
      const setsBelongedTo: [IdValue, Iterable<string>][] = [
        [value1, ['set1']],
        [value2, ['set1']]
      ];
      testObject.replace(setsBelongedTo);
      expect(testObject.size).toBe(2);
      expect(testObject.get(value1.id)).toBe(value1);
      expect(testObject.get(value2.id)).toBe(value2);
    });

    it('should clone values if cloneValues is true', () => {
      const setsBelongedTo: [IdValue, Iterable<string>][] = [
        [value1, ['set1']],
        [value2, ['set1']]
      ];
      testObject.replace(setsBelongedTo, true);
      expect(testObject.size).toBe(2);
      expect(testObject.get(value1.id)).not.toBe(value1);
      expect(testObject.get(value2.id)).not.toBe(value2);
    });
  });

  describe('export', () => {
    it('should create the export Iterable that can be used to duplicate a ContainerIdSet', () => {
      testObject.add([value1, value2, value3], 'set1');
      testObject.add([value3, value4], 'set2');

      const duplicateObject = new ContainerIdSet(testObject.export());
      expect(duplicateObject).toEqual(testObject);
    });
  });

  describe('addExclusive', () => {
    it('should delete the value if no sets defined', () => {
      testObject.add(value1, 'set1');

      testObject.addExclusive(value1);
      expect(testObject.get(value1.id)).toBeUndefined();
    });

    it('should replace the sets the value belongs to with the defined sets', () => {
      testObject.add(value1, 'set1');

      testObject.addExclusive(value1, 'set2');
      expect(testObject.get(value1.id)).toBe(value1);
      expect(testObject.setsBelongedTo(value1.id)?.size).toBe(1);
      expect(testObject.setsBelongedTo(value1.id)?.has('set2')).toBeTrue();
    });

    it('should publish updates to the relevant IdSets', () => {
      const added: IdObject[] = [];
      const deleted: IdObject[] = [];
      const deleteFromSetId1: IdObject[] = [];
      const addedToSetId2: IdObject[] = [];

      testObject.add(value1, 'set1');

      testObject.add$.subscribe(value => added.push(value));
      testObject.delete$.subscribe(value => deleted.push(value));
      testObject.getSet('set1').delete$.subscribe(value => deleteFromSetId1.push(value));
      testObject.getSet('set2').add$.subscribe(value => addedToSetId2.push(value));

      testObject.addExclusive(value1, 'set2');

      expect(added).toEqual([]);
      expect(deleted).toEqual([]);
      expect(deleteFromSetId1).toEqual([value1]);
      expect(addedToSetId2).toEqual([value1]);
    });

    it('should publish updates to the relevant IdSets with an updated value', () => {
      const added: IdObject[] = [];
      const deleted: IdObject[] = [];
      const deleteFromSetId1: IdObject[] = [];
      const addedToSetId2: IdObject[] = [];

      testObject.add(value1update, 'set1');

      testObject.add$.subscribe(value => added.push(value));
      testObject.delete$.subscribe(value => deleted.push(value));
      testObject.getSet('set1').delete$.subscribe(value => deleteFromSetId1.push(value));
      testObject.getSet('set2').add$.subscribe(value => addedToSetId2.push(value));

      testObject.addExclusive(value1, 'set2');

      expect(added).toEqual([value1]);
      expect(deleted).toEqual([]);
      expect(deleteFromSetId1).toEqual([value1]);
      expect(addedToSetId2).toEqual([value1]);
    });
  });

  describe('clear', () => {
    it('should remove all values from the ContainerIdSet when no sets defined', () => {
      testObject.add([value1, value2, value3, value4], 'set1');
      expect(testObject.size).toBe(4);

      testObject.clear();

      expect(testObject.size).toBe(0);
    });

    it('should remove all values from defined SetId IdSets and remove them if unobserved', () => {
      const set1 = testObject.getSet('set1');
      const set2 = testObject.getSet('set2');
      const set3 = testObject.getSet('set3');

      set1.add([value1, value2]);
      set2.add([value2, value3]);
      set3.add([value1, value4]);
      expect(testObject.size).toBe(4);

      // unobserved SetId should be removed
      testObject.clear('set2');

      expect(testObject.size).toBe(3);
      expect(set2.size).toBe(0);
      expect(testObject.sets.get('set2')?.size).toBe(0);

      // observed SetId should remain, even if it is empty
      testObject.sets.get('set3')?.add$.subscribe();
      testObject.clear('set3');

      expect(testObject.size).toBe(2);
      expect(testObject.sets.get('set3')?.size).toBe(0);
    });
  });

  describe('complete', () => {
    it('should complete all subscriptions to the ContainerIdSet and all SetId IdSets', () => {
      testObject.add([value1, value2], 'set1');
      testObject.add([value2, value3], 'set2');
      testObject.add([value1, value4], 'set3');

      testObject.allAdd$.subscribe();
      testObject.sets.get('set1')?.delete$.subscribe();
      testObject.sets.get('set2')?.create$.subscribe();
      testObject.sets.get('set3')?.update$.subscribe();

      expect(testObject.observed).toBeTrue();
      expect(testObject.sets.get('set1')?.observed).toBeTrue();
      expect(testObject.sets.get('set2')?.observed).toBeTrue();
      expect(testObject.sets.get('set3')?.observed).toBeTrue();

      testObject.complete();

      expect(testObject.observed).toBeFalse();
      expect(testObject.sets.get('set1')?.observed).toBeFalse();
      expect(testObject.sets.get('set2')?.observed).toBeFalse();
      expect(testObject.sets.get('set3')?.observed).toBeFalse();
    });
  });

  describe('setsBelongedTo', () => {
    it('should return a Set containing the sets the id (IdValue) belongs to', () => {
      testObject.add(value1, 'set1');
      expect(testObject.setsBelongedTo(value1.id)?.size).toBe(1);
      expect(testObject.setsBelongedTo(value1.id)?.has('set1')).toBeTrue();

      testObject.add(value1, 'set2');
      expect(testObject.setsBelongedTo(value1.id)?.size).toBe(2);
      expect(testObject.setsBelongedTo(value1.id)?.has('set1')).toBeTrue();
      expect(testObject.setsBelongedTo(value1.id)?.has('set2')).toBeTrue();

      testObject.delete(value1.id, 'set1');
      expect(testObject.setsBelongedTo(value1.id)?.size).toBe(1);
      expect(testObject.setsBelongedTo(value1.id)?.has('set2')).toBeTrue();
    });

    it('should return undefined if a value with the specified id does not exist', () => {
      expect(testObject.setsBelongedTo(value1.id)).toBeUndefined();
    });
  });

  describe('getIdSet', () => {
    it('should return a new empty IdSet for the SetId if the SetId does not exist', () => {
      const set1 = testObject.getSet('set1');
      expect(set1).toBeDefined();
      expect(set1.size).toBe(0);

      expect(testObject.sets.get('set1')).toBe(set1);
    });

    it('should return the existing IdSet for the SetId if the SetId does exist', () => {
      testObject.add(value1, 'set1');

      const set1 = testObject.getSet('set1');
      expect(set1).toBeDefined();
      expect(set1.size).toBe(1);
      expect(set1.get(value1.id)).toBe(value1);

      expect(testObject.sets.get('set1')).toBe(set1);
    });
  });

  describe('union', () => {
    it('should return a UnionIdSet for the specified sets', () => {
      testObject.add([value1, value2], 'set1');
      testObject.add([value2, value3], 'set2');
      testObject.add([value1, value4], 'set3');

      const union = testObject.createUnion(['set1', 'set2']);
      expect(union instanceof UnionIdSet).toBeTrue();
      expect(union.size).toBe(3);
    });
  });

  describe('intersection', () => {
    it('should return a IntersectionIdSet for the specified sets', () => {
      testObject.add([value1, value2], 'set1');
      testObject.add([value1, value2, value3], 'set2');
      testObject.add([value1, value4], 'set3');

      const intersection = testObject.createIntersection(['set1', 'set2', 'set3']);
      expect(intersection instanceof IntersectionIdSet).toBeTrue();
      expect(intersection.size).toBe(1);
    });
  });

  describe('difference', () => {
    it('should return a DifferenceIdSet for the specified sets', () => {
      testObject.add([value1, value2, value3, value4], 'set1');
      testObject.add([value3], 'set2');
      testObject.add([value4], 'set3');

      const intersection = testObject.createDifference('set1', ['set2', 'set3']);
      expect(intersection instanceof DifferenceIdSet).toBeTrue();
      expect(intersection.size).toBe(2);
    });
  });

  describe('complement', () => {
    it('should return a DifferenceIdSet for the ContainerIdSet and the specified sets', () => {
      testObject.add([value1, value2, value3, value4], 'set1');
      testObject.add([value3], 'set2');
      testObject.add([value4], 'set3');

      const intersection = testObject.createComplement(['set2', 'set3']);
      expect(intersection instanceof DifferenceIdSet).toBeTrue();
      expect(intersection.size).toBe(2);
    });
  });

  describe('detachSet', () => {
    it('should detach the specified set from the ContainerIdSet', () => {
      testObject.add(value2, 'set2');
      const set1 = testObject.getSet('set1');
      set1.add(value1);
      expect(set1.size).toBe(1);
      expect(testObject.size).toBe(2);

      testObject.detachSet('set1');
      expect(testObject.sets.has('set1')).toBeFalse();

      expect(set1.size).toBe(1);
      expect(testObject.size).toBe(1);
    });
  });
});