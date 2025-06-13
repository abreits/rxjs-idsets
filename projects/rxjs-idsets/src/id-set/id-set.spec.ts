import { IdObject, IdSet } from '../public-api';

const value1 = { id: '1', value: 'value1' };
const value2 = { id: '2', value: 'value2' };
const value3 = { id: '3', value: 'value3' };
const value4 = { id: '4', value: 'value4' };
const value1update = { id: '1', value: 'value1' };

const idSet123 = [value1, value2, value3];
const idSet124 = [value1update, value2, value4];

describe('IdSet', () => {
  describe('add', () => {
    it('should add new values to the IdSet', () => {
      const testObject = new IdSet();

      testObject.add(value1);

      expect(testObject.has(value1.id)).toBeTrue();
      expect(testObject.get(value1.id)).toBe(value1);
    });

    it('should update existing values in the IdSet', () => {
      const testObject = new IdSet(idSet123);

      expect(testObject.add(value1update)).toBe(testObject);
      expect(testObject.has(value1.id)).toBeTrue();
      expect(testObject.get(value1.id)).toBe(value1update);
      expect(testObject.get(value1.id)).not.toBe(value1);
    });

    describe('create$', () => {
      it('should publish new values', () => {
        const created: IdObject[] = [];
        const testObject = new IdSet(idSet123);

        testObject.create$.subscribe((value) => created.push(value));

        testObject.add(value4);
        expect(created).toEqual([value4]);
        testObject.complete();
      });

      it('should not publish updates of existing values', () => {
        const published: IdObject[] = [];
        const testObject = new IdSet(idSet123);

        testObject.create$.subscribe((value) => published.push(value));

        testObject.add(value1update);
        expect(published).toEqual([]);
        testObject.complete();
      });
    });

    describe('update$', () => {
      it('should not publish new values', () => {
        const updated: IdObject[] = [];
        const testObject = new IdSet(idSet123);

        testObject.update$.subscribe((value) => updated.push(value));

        testObject.add(value4);
        expect(updated).toEqual([]);
        testObject.complete();
      });

      it('should publish updates of existing values', () => {
        const updated: IdObject[] = [];
        const testObject = new IdSet(idSet123);

        testObject.update$.subscribe((value) => updated.push(value));

        testObject.add(value1update);
        expect(updated).toEqual([value1update]);
        testObject.complete();
      });

      it('should not publish updates if the value is not updated', () => {
        const updated: IdObject[] = [];
        const testObject = new IdSet(idSet123);

        testObject.update$.subscribe((value) => updated.push(value));

        testObject.add(value1);
        expect(updated).toEqual([]);
        testObject.complete();
      });
    });

    describe('add$', () => {
      it('should publish new values', () => {
        const added: IdObject[] = [];
        const testObject = new IdSet(idSet123);

        testObject.add$.subscribe((value) => added.push(value));

        testObject.add(value4);
        expect(added).toEqual([value4]);
        testObject.complete();
      });

      it('should publish only real updates of existing values', () => {
        const added: IdObject[] = [];
        const testObject = new IdSet(idSet123);

        testObject.add$.subscribe((value) => added.push(value));

        testObject.add(value1); // no publish: same value object added again
        expect(added).toEqual([]);
        testObject.add(value1update); // publish: different value object (although with same values) added
        expect(added).toEqual([value1update]);
        testObject.complete();
      });
    });

    describe('allAdd$', () => {
      it('should publish all existing values and new values', () => {
        let allAdded: IdObject[] = [];
        const testObject = new IdSet(idSet123);

        testObject.allAdd$.subscribe((value) => allAdded.push(value));
        expect(allAdded).toEqual([value1, value2, value3]);

        allAdded = [];
        testObject.add(value4);
        expect(allAdded).toEqual([value4]);
        testObject.complete();
      });

      it('should publish all existing values and real updates of existing values', () => {
        let allAdded: IdObject[] = [];
        const testObject = new IdSet(idSet123);

        testObject.allAdd$.subscribe((value) => allAdded.push(value));
        expect(allAdded).toEqual([value1, value2, value3]);

        allAdded = [];
        testObject.add(value1);
        expect(allAdded).toEqual([]);
        testObject.add(value1update);
        expect(allAdded).toEqual([value1]);
        testObject.complete();
      });
    });

    it('should filter the values if a filter is defined', () => {
      type IdValue = { id: string; value: number };
      const value1 = { id: '1', value: 1 };
      const value2 = { id: '2', value: 2 };
      const testObject = new IdSet<IdValue>([], {
        filter: (value: IdValue) => value.value % 2 === 0,
      });
      expect(testObject.size).toBe(0);
      testObject.add(value1);
      expect(testObject.get(value1.id)).not.toBeDefined();
      testObject.add(value2);
      expect(testObject.get(value2.id)).toBe(value2);
    });

    it('should transform the values if a transform is defined', () => {
      type IdValue = { id: string; value: number };
      const value1 = { id: '1', value: 1 };
      const value2 = { id: '2', value: 2 };
      const testObject = new IdSet<IdValue>([], {
        transform: (value: IdValue) => ({
          id: value.id,
          value: value.value * 2,
        }),
      });
      testObject.add(value1);
      testObject.add(value2);
      expect(testObject.size).toBe(2);
      expect(testObject.get(value1.id)?.value).toBe(2);
      expect(testObject.get(value2.id)?.value).toBe(4);
    });
  });

  describe('delete', () => {
    it('should delete values with an existing id from the IdSet and return true', () => {
      const testObject = new IdSet(idSet123);

      expect(testObject.delete(value2.id)).toBeTrue();
      expect(testObject.has(value2.id)).toBeFalse();
    });

    it('should ignore non existing id\'s and return false', () => {
      const testObject = new IdSet(idSet123);

      expect(testObject.delete(value4.id)).toBeFalse();
    });

    describe('delete$', () => {
      it('should publish deleted values', () => {
        const published: IdObject[] = [];
        const testObject = new IdSet(idSet123);

        testObject.delete$.subscribe((value) => published.push(value));

        testObject.delete(value1.id);
        expect(published).toEqual([value1]);
        testObject.complete();
      });
    });
  });

  describe('replace', () => {
    it('should replace the IdSet values with the given values and publish changes', () => {
      const testObject = new IdSet(idSet123);
      const createdValues: IdObject[] = [];
      const updatedValues: IdObject[] = [];
      const deletedValues: IdObject[] = [];

      testObject.create$.subscribe((value) => createdValues.push(value));
      testObject.update$.subscribe((value) => updatedValues.push(value));
      testObject.delete$.subscribe((value) => deletedValues.push(value));

      expect(testObject.replace(idSet124)).toBe(testObject);
      expect(testObject.size).toBe(3);
      expect(testObject.has(value3.id)).toBeFalse();
      expect(testObject.has(value4.id)).toBeTrue();

      expect(createdValues).toContain(value4);
      expect(updatedValues).toContain(value1);
      expect(deletedValues).toContain(value3);

      testObject.complete();
    });

    it('should clone the values if cloneValues is true', () => {
      const testObject = new IdSet(idSet123);
      testObject.replace(idSet123, true);
      expect(testObject.get(value1.id)).not.toBe(value1);
      expect(testObject.get(value1.id)).toEqual(value1);
    });
  });

  describe('clear', () => {
    it('should remove the IdSet values', () => {
      const testObject = new IdSet(idSet123);

      expect(testObject.clear()).toBe(testObject);
      expect(testObject.size).toBe(0);
    });

    it('should remove the IdSet values and publish deletions', () => {
      const testObject = new IdSet(idSet123);
      const deletedValues: IdObject[] = [];

      testObject.delete$.subscribe((value) => deletedValues.push(value));

      expect(testObject.clear()).toBe(testObject);
      expect(testObject.size).toBe(0);

      expect(deletedValues).toContain(value1);
      expect(deletedValues).toContain(value2);
      expect(deletedValues).toContain(value3);

      testObject.complete();
    });
  });
});
