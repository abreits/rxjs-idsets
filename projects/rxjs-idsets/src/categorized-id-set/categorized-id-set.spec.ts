import { CategorizedIdSet } from './categorized-id-set';
import { IdObject } from '../types';
import { IntersectionIdSet, DifferenceIdSet, UnionIdSet } from '../public-api';

type IdValue = { id: string, value: string };

const value1 = { id: '1', value: 'value1' };
const value2 = { id: '2', value: 'value2' };
const value3 = { id: '3', value: 'value3' };
const value4 = { id: '4', value: 'value4' };
const value1update = { id: '1', value: 'value1' };

let testObject = new CategorizedIdSet();

describe('CategorizedIdSet', () => {
  beforeEach(() => {
    testObject = new CategorizedIdSet();
  });

  afterEach(() => {
    testObject.complete(); // close all subscriptions
  });

  describe('constructor', () => {
    it('should create', () => {
      expect(new CategorizedIdSet()).toBeDefined();
    });

    it('should create an empty set if no categoriesBelongedTo are defined', () => {
      const categorizedIdSet = new CategorizedIdSet([value1, value2]);
      expect(categorizedIdSet.size).toBe(0);
    });

    it('should create a populated set according to categoriesBelongedTo', () => {
      const newValues: [IdValue, Iterable<string>][] = [
        [value1, ['category1']],
        [value2, ['category1']]
      ];
      const categorizedIdSet = new CategorizedIdSet(newValues);
      expect(categorizedIdSet.size).toBe(2);
    });
  });


  describe('categories', () => {
    it('should return an empty map for a new empty CategorizedIdSet', () => {
      const categories = testObject.categories;
      expect(categories.size).toBe(0);
    });

    it('should return a map with the category as key and an IdSet with the category members as value', () => {
      testObject.add(value1, 'category1');
      testObject.add(value2, 'category1');
      testObject.add(value3, 'category2');

      const categories = testObject.categories;
      expect(categories.size).toBe(2);
      expect(categories.get('category1')?.size).toBe(2);
      expect(categories.get('category1')?.get(value1.id)).toBe(value1);
      expect(categories.get('category1')?.get(value2.id)).toBe(value2);
      expect(categories.get('category2')?.size).toBe(1);
      expect(categories.get('category2')?.get(value3.id)).toBe(value3);
      expect(categories.get('category3')).toBeUndefined();
    });
  });

  describe('add', () => {
    it('should not add an element if no category is provided', () => {
      testObject.add(value1);
      expect(testObject.get(value1.id)).toBeUndefined();
    });

    it('should add a new element to the CategorisedIdSet and update the specified categories', () => {
      testObject.add(value1, 'category1');
      expect(testObject.get(value1.id)).toBe(value1);
      expect(testObject.categoriesBelongedTo(value1.id)?.size).toBe(1);
      expect(testObject.categoriesBelongedTo(value1.id)).toContain('category1');
      expect(testObject.categories.get('category1')?.size).toBe(1);
      expect(testObject.categories.get('category1')?.get(value1.id)).toBe(value1);

      testObject.add(value2, ['category1', 'category2']);
      expect(testObject.get(value2.id)).toBe(value2);
      expect(testObject.categoriesBelongedTo(value2.id)?.size).toBe(2);
      expect(testObject.categoriesBelongedTo(value2.id)).toContain('category1');
      expect(testObject.categoriesBelongedTo(value2.id)).toContain('category2');
      expect(testObject.categories.get('category1')?.size).toBe(2);
      expect(testObject.categories.get('category1')?.get(value1.id)).toBe(value1);
      expect(testObject.categories.get('category1')?.get(value2.id)).toBe(value2);
      expect(testObject.categories.get('category2')?.size).toBe(1);
      expect(testObject.categories.get('category2')?.get(value2.id)).toBe(value2);
    });

    it('should update an existing updated value in all categories the value belongs to', () => {
      testObject.add(value1, ['category1', 'category2']);
      expect(testObject.categories.get('category2')?.get(value1.id)).toBe(value1);

      testObject.add(value1update, 'category1');
      expect(testObject.categories.get('category2')?.get(value1.id)).toBe(value1update);
    });

    it('should publish the added value to the CategorizedIdSet and the IdSet of the category', () => {
      const added: IdObject[] = [];
      const addedToCategory: IdObject[] = [];

      testObject.add$.subscribe(value => added.push(value));
      testObject.getIdSet('category1').add$.subscribe(value => addedToCategory.push(value));
      testObject.add(value1, 'category1');
      expect(added).toEqual([value1]);
      expect(addedToCategory).toEqual([value1]);
    });
  });

  describe('delete', () => {
    it('should delete the value with specified id from the CategorizedIdSet and all categories if no categories are provided', () => {
      testObject.add(value1, 'category1');
      testObject.add(value2, ['category1', 'category2']);

      expect(testObject.delete(value2.id)).toBeTrue();
      expect(testObject.get(value2.id)).toBeUndefined();
      expect(testObject.categories.get('category1')?.size).toBe(1);
      expect(testObject.categories.get('category2')?.size).toBe(0);
    });

    // TODO: only for readonly version 
    // it('should not delete the category if it is observed', () => {
    //   testObject.add(value1, 'category1');
    //   const category1 = testObject.categories.get('category1');
    //   category1?.allAdd$.subscribe();
    //   testObject.delete(value1.id);

    //   expect(testObject.categories.get('category1')).toBeDefined();
    //   expect(testObject.categories.get('category1')?.size).toBe(0);
    //   testObject.complete();
    // });

    it('should publish the deleted value to the IdSet of the category', () => {
      const deleted: IdObject[] = [];
      const deleteFromCategory: IdObject[] = [];

      testObject.add(value1, 'category1');

      testObject.delete$.subscribe(value => deleted.push(value));
      testObject.getIdSet('category1').delete$.subscribe(value => deleteFromCategory.push(value));

      testObject.categories.get('category1')?.delete(value1.id);
      expect(deleted).toEqual([value1]);
      expect(deleteFromCategory).toEqual([value1]);
    });

    it('should not publish the deleted value to the CategorizedIdSet if it is present in a category', () => {
      const deleted: IdObject[] = [];
      const deleteFromCategory: IdObject[] = [];


      testObject.add(value1, ['category1', 'category2']);

      testObject.delete$.subscribe(value => deleted.push(value));
      testObject.getIdSet('category1').delete$.subscribe(value => deleteFromCategory.push(value));

      testObject.categories.get('category1')?.delete(value1.id);
      expect(deleted).toEqual([]);
      expect(deleteFromCategory).toEqual([value1]);
    });

    it('should publish the deleted value to the CategorizedIdSet if it is no longer present in any category', () => {
      const deleted: IdObject[] = [];
      const deleteFromCategory: IdObject[] = [];
      testObject.add(value1, ['category1', 'category2']);

      testObject.delete$.subscribe(value => deleted.push(value));
      testObject.getIdSet('category1').delete$.subscribe(value => deleteFromCategory.push(value));

      testObject.delete(value1.id);
      expect(deleted).toEqual([value1]);
      expect(deleteFromCategory).toEqual([value1]);
    });
  });

  describe('replace', () => {
    it('should clear the CategorizedIdSet if categoriesBelongedTo is undefined', () => {
      testObject.add([value1, value2, value3], 'category1');
      expect(testObject.size).toBe(3);

      testObject.replace([value3, value4]);
      expect(testObject.size).toBe(0);
    });

    it('should only use the values referenced in the categoriesBelongedTo in the replace', () => {
      testObject.add([value1, value2, value3], 'category1');
      testObject.add([value4], 'category2');
      expect(testObject.size).toBe(4);

      const categoriesBelongedTo: [IdValue, Iterable<string>][] = [
        [value3, ['category1', 'category3']],
        [value4, ['category3']]
      ];
      testObject.replace(categoriesBelongedTo);
      expect(testObject.size).toBe(2);
      expect(testObject.categories.get('category1')?.size).toBe(1);
      expect(testObject.categories.get('category2')?.size).toBe(0);
      expect(testObject.categories.get('category3')?.size).toBe(2);
    });

    it('should use the same values if cloneValues is false', () => {
      const categoriesBelongedTo: [IdValue, Iterable<string>][] = [
        [value1, ['category1']],
        [value2, ['category1']]
      ];
      testObject.replace(categoriesBelongedTo);
      expect(testObject.size).toBe(2);
      expect(testObject.get(value1.id)).toBe(value1);
      expect(testObject.get(value2.id)).toBe(value2);
    });

    it('should clone values if cloneValues is true', () => {
      const categoriesBelongedTo: [IdValue, Iterable<string>][] = [
        [value1, ['category1']],
        [value2, ['category1']]
      ];
      testObject.replace(categoriesBelongedTo, true);
      expect(testObject.size).toBe(2);
      expect(testObject.get(value1.id)).not.toBe(value1);
      expect(testObject.get(value2.id)).not.toBe(value2);
    });
  });

  describe('export', () => {
    it('should create the export Iterable that can be used to duplicate a CategorizedIdSet', () => {
      testObject.add([value1, value2, value3], 'category1');
      testObject.add([value3, value4], 'category2');

      const duplicateObject = new CategorizedIdSet(testObject.export());
      expect(duplicateObject).toEqual(testObject);
    });
  });

  describe('replaceCategories', () => {
    it('should delete the value if no categories defined', () => {
      testObject.add(value1, 'category1');

      testObject.replaceCategories(value1);
      expect(testObject.get(value1.id)).toBeUndefined();
    });

    it('should replace the categories the value belongs to with the defined categories', () => {
      testObject.add(value1, 'category1');

      testObject.replaceCategories(value1, 'category2');
      expect(testObject.get(value1.id)).toBe(value1);
      expect(testObject.categoriesBelongedTo(value1.id)?.size).toBe(1);
      expect(testObject.categoriesBelongedTo(value1.id)?.has('category2')).toBeTrue();
    });

    it('should publish updates to the relevant IdSets', () => {
      const added: IdObject[] = [];
      const deleted: IdObject[] = [];
      const deleteFromCategory1: IdObject[] = [];
      const addedToCategory2: IdObject[] = [];

      testObject.add(value1, 'category1');

      testObject.add$.subscribe(value => added.push(value));
      testObject.delete$.subscribe(value => deleted.push(value));
      testObject.getIdSet('category1').delete$.subscribe(value => deleteFromCategory1.push(value));
      testObject.getIdSet('category2').add$.subscribe(value => addedToCategory2.push(value));

      testObject.replaceCategories(value1, 'category2');

      expect(added).toEqual([]);
      expect(deleted).toEqual([]);
      expect(deleteFromCategory1).toEqual([value1]);
      expect(addedToCategory2).toEqual([value1]);
    });

    it('should publish updates to the relevant IdSets with an updated value', () => {
      const added: IdObject[] = [];
      const deleted: IdObject[] = [];
      const deleteFromCategory1: IdObject[] = [];
      const addedToCategory2: IdObject[] = [];

      testObject.add(value1update, 'category1');

      testObject.add$.subscribe(value => added.push(value));
      testObject.delete$.subscribe(value => deleted.push(value));
      testObject.getIdSet('category1').delete$.subscribe(value => deleteFromCategory1.push(value));
      testObject.getIdSet('category2').add$.subscribe(value => addedToCategory2.push(value));

      testObject.replaceCategories(value1, 'category2');

      expect(added).toEqual([value1]);
      expect(deleted).toEqual([]);
      expect(deleteFromCategory1).toEqual([value1]);
      expect(addedToCategory2).toEqual([value1]);
    });
  });

  describe('clear', () => {
    it('should remove all values from the CategorizedIdSet when no categories defined', () => {
      testObject.add([value1, value2, value3, value4], 'category1');
      expect(testObject.size).toBe(4);

      testObject.clear();

      expect(testObject.size).toBe(0);
    });

    it('should remove all values from defined category IdSets and remove them if unobserved', () => {
      const category1Set = testObject.getIdSet('category1');
      const category2Set = testObject.getIdSet('category2');
      const category3Set = testObject.getIdSet('category3');

      category1Set.add([value1, value2]);
      category2Set.add([value2, value3]);
      category3Set.add([value1, value4]);
      expect(testObject.size).toBe(4);

      // unobserved category should be removed
      testObject.clear('category2');

      expect(testObject.size).toBe(3);
      expect(category2Set.size).toBe(0);
      expect(testObject.categories.get('category2')?.size).toBe(0);

      // observed category should remain, even if it is empty
      testObject.categories.get('category3')?.add$.subscribe();
      testObject.clear('category3');

      expect(testObject.size).toBe(2);
      expect(testObject.categories.get('category3')?.size).toBe(0);
    });
  });

  describe('complete', () => {
    it('should complete all subscriptions to the CategorizedIdSet and all category IdSets', () => {
      testObject.add([value1, value2], 'category1');
      testObject.add([value2, value3], 'category2');
      testObject.add([value1, value4], 'category3');

      testObject.allAdd$.subscribe();
      testObject.categories.get('category1')?.delete$.subscribe();
      testObject.categories.get('category2')?.create$.subscribe();
      testObject.categories.get('category3')?.update$.subscribe();

      expect(testObject.observed).toBeTrue();
      expect(testObject.categories.get('category1')?.observed).toBeTrue();
      expect(testObject.categories.get('category2')?.observed).toBeTrue();
      expect(testObject.categories.get('category3')?.observed).toBeTrue();

      testObject.complete();

      expect(testObject.observed).toBeFalse();
      expect(testObject.categories.get('category1')?.observed).toBeFalse();
      expect(testObject.categories.get('category2')?.observed).toBeFalse();
      expect(testObject.categories.get('category3')?.observed).toBeFalse();
    });
  });

  describe('categoriesBelongedTo', () => {
    it('should return a Set containing the categories the id (IdValue) belongs to', () => {
      testObject.add(value1, 'category1');
      expect(testObject.categoriesBelongedTo(value1.id)?.size).toBe(1);
      expect(testObject.categoriesBelongedTo(value1.id)?.has('category1')).toBeTrue();

      testObject.add(value1, 'category2');
      expect(testObject.categoriesBelongedTo(value1.id)?.size).toBe(2);
      expect(testObject.categoriesBelongedTo(value1.id)?.has('category1')).toBeTrue();
      expect(testObject.categoriesBelongedTo(value1.id)?.has('category2')).toBeTrue();

      testObject.delete(value1.id, 'category1');
      expect(testObject.categoriesBelongedTo(value1.id)?.size).toBe(1);
      expect(testObject.categoriesBelongedTo(value1.id)?.has('category2')).toBeTrue();
    });

    it('should return undefined if a value with the specified id does not exist', () => {
      expect(testObject.categoriesBelongedTo(value1.id)).toBeUndefined();
    });
  });

  describe('getIdSet', () => {
    it('should return a new empty IdSet for the category if the category does not exist', () => {
      const category1Set = testObject.getIdSet('category1');
      expect(category1Set).toBeDefined();
      expect(category1Set.size).toBe(0);

      expect(testObject.categories.get('category1')).toBe(category1Set);
    });

    it('should return the existing IdSet for the category if the category does exist', () => {
      testObject.add(value1, 'category1');

      const category1Set = testObject.getIdSet('category1');
      expect(category1Set).toBeDefined();
      expect(category1Set.size).toBe(1);
      expect(category1Set.get(value1.id)).toBe(value1);

      expect(testObject.categories.get('category1')).toBe(category1Set);
    });
  });

  describe('union', () => {
    it('should return a UnionIdSet for the specified categories', () => {
      testObject.add([value1, value2], 'category1');
      testObject.add([value2, value3], 'category2');
      testObject.add([value1, value4], 'category3');

      const union = testObject.union(['category1', 'category2']);
      expect(union instanceof UnionIdSet).toBeTrue();
      expect(union.size).toBe(3);
    });
  });

  describe('intersection', () => {
    it('should return a IntersectionIdSet for the specified categories', () => {
      testObject.add([value1, value2], 'category1');
      testObject.add([value1, value2, value3], 'category2');
      testObject.add([value1, value4], 'category3');

      const intersection = testObject.intersection(['category1', 'category2', 'category3']);
      expect(intersection instanceof IntersectionIdSet).toBeTrue();
      expect(intersection.size).toBe(1);
    });
  });

  describe('difference', () => {
    it('should return a DifferenceIdSet for the specified categories', () => {
      testObject.add([value1, value2, value3, value4], 'category1');
      testObject.add([value3], 'category2');
      testObject.add([value4], 'category3');

      const intersection = testObject.difference('category1', ['category2', 'category3']);
      expect(intersection instanceof DifferenceIdSet).toBeTrue();
      expect(intersection.size).toBe(2);
    });
  });

  describe('complement', () => {
    it('should return a DifferenceIdSet for the CategorizedIdSet and the specified categories', () => {
      testObject.add([value1, value2, value3, value4], 'category1');
      testObject.add([value3], 'category2');
      testObject.add([value4], 'category3');

      const intersection = testObject.complement(['category2', 'category3']);
      expect(intersection instanceof DifferenceIdSet).toBeTrue();
      expect(intersection.size).toBe(2);
    });
  });

  // given that the implementation at the moment is little more than calling the corresponding 
  // parent CategorizedIdSet method for most methods, most category tests are shallow for the moment 
  describe('category IdSet methods', () => {
    describe('add', () => {
      it('should add a value to the category IdSet and the CategorizedIdSet', () => {
        const category1Set = testObject.getIdSet('category1');
        category1Set.add(value1);
        expect(category1Set.size).toBe(1);
        expect(category1Set.get(value1.id)).toBe(value1);

        expect(testObject.size).toBe(1);
        expect(testObject.get(value1.id)).toBe(value1);
      });
    });

    describe('delete', () => {
      it('should delete a value from the category IdSet', () => {
        testObject.add(value1, 'category1');

        const category1Set = testObject.getIdSet('category1');
        expect(category1Set.size).toBe(1);

        category1Set.delete(value1.id);
        expect(category1Set.size).toBe(0);
      });
    });

    describe('replace', () => {
      it('should replace the content of this category with the defined values and keep them in other categories', () => {
        testObject.add([value1, value2], ['category1', 'category2']);

        const category1Set = testObject.getIdSet('category1');
        const category2Set = testObject.getIdSet('category2');
        expect(category1Set.size).toBe(2);
        expect(category2Set.size).toBe(2);

        category1Set.replace([value2, value3, value4]);
        expect(category1Set.size).toBe(3);
        expect(category2Set.size).toBe(2);
      });
    });

    describe('clear', () => {
      it('should clear the category and remove values without categories in the CategorizedIdSet', () => {
        const category1Set = testObject.getIdSet('category1');
        const category2Set = testObject.getIdSet('category2');

        category1Set.add([value1, value2]);
        category2Set.add([value2, value3]);
        expect(testObject.size).toBe(3);

        category2Set.clear();
        expect(testObject.size).toBe(2);
        expect(category1Set.size).toBe(2);
        expect(category2Set.size).toBe(0);

      });
    });
  });
});