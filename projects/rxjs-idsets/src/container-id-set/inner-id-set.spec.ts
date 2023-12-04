import { ContainerIdSet } from './container-id-set';

const value1 = { id: '1', value: 'value1' };
const value2 = { id: '2', value: 'value2' };
const value3 = { id: '3', value: 'value3' };
const value4 = { id: '4', value: 'value4' };


let testObject = new ContainerIdSet();

describe('ContainerIdSet', () => {
  beforeEach(() => {
    testObject = new ContainerIdSet();
  });

  afterEach(() => {
    testObject.complete(); // close all subscriptions
  });

  /**
   * The InnerIdSet can best be properly tested indirectly in a ContainerIdSet
   */
  describe('InnerIdSet', () => {
    describe('Active inside ContainerIdSet', () => {
      describe('add', () => {
        it('should add a value to the specified IdSet and the ContainerIdSet', () => {
          const set1 = testObject.getSet('set1');
          set1.add(value1);
          expect(set1.size).toBe(1);
          expect(set1.get(value1.id)).toBe(value1);

          expect(testObject.size).toBe(1);
          expect(testObject.get(value1.id)).toBe(value1);
        });
      });

      describe('delete', () => {
        it('should delete a value from the specified IdSet', () => {
          testObject.add(value1, 'set1');

          const set1 = testObject.getSet('set1');
          expect(set1.size).toBe(1);

          set1.delete(value1.id);
          expect(set1.size).toBe(0);
        });
      });

      describe('replace', () => {
        it('should replace the content of specified IdSet with the defined values and keep them in other sets', () => {
          testObject.add([value1, value2], ['set1', 'set2']);

          const set1 = testObject.getSet('set1');
          const set2 = testObject.getSet('set2');
          expect(set1.size).toBe(2);
          expect(set2.size).toBe(2);

          set1.replace([value2, value3, value4]);
          expect(set1.size).toBe(3);
          expect(set2.size).toBe(2);
        });
      });

      describe('clear', () => {
        it('should clear the specified IdSet and remove values without sets in the ContainerIdSet', () => {
          const set1 = testObject.getSet('set1');
          const set2 = testObject.getSet('set2');

          set1.add([value1, value2]);
          set2.add([value2, value3]);
          expect(testObject.size).toBe(3);

          set2.clear();
          expect(testObject.size).toBe(2);
          expect(set1.size).toBe(2);
          expect(set2.size).toBe(0);

        });
      });
    });

    describe('Detached from ContainerIdSet', () => {
      describe('add', () => {
        it('should add a value to the IdSet and not to the ContainerIdSet', () => {
          testObject.add(value2, 'set2');
          const set1 = testObject.getSet('set1');
          set1.add(value1);
          expect(set1.size).toBe(1);
          expect(testObject.size).toBe(2);

          testObject.detachSet('set1');
          expect(set1.size).toBe(1);
          expect(testObject.size).toBe(1);

          set1.add(value2);

          expect(set1.size).toBe(2);
          expect(testObject.size).toBe(1);
        });
      });

      describe('delete', () => {
        it('should delete a value from the IdSet and not from the ContainerIdSet ', () => {
          testObject.add(value1, 'set2');
          const set1 = testObject.getSet('set1');
          set1.add(value1);
          expect(set1.size).toBe(1);
          expect(testObject.size).toBe(1);

          testObject.detachSet('set1');
          expect(set1.size).toBe(1);
          expect(testObject.size).toBe(1);

          set1.delete(value1.id);

          expect(set1.size).toBe(0);
          expect(testObject.size).toBe(1);
        });
      });

      describe('replace', () => {
        it('should replace the content of this SetId with the defined values and keep them in other sets', () => {
          testObject.add(value1, 'set2');
          const set1 = testObject.getSet('set1');
          set1.add(value1);
          expect(set1.size).toBe(1);
          expect(testObject.size).toBe(1);

          testObject.detachSet('set1');
          expect(set1.size).toBe(1);
          expect(testObject.size).toBe(1);

          set1.replace([value1, value2, value3]);

          expect(set1.size).toBe(3);
          expect(testObject.size).toBe(1);
        });
      });

      describe('clear', () => {
        it('should clear the SetId and remove values without sets in the ContainerIdSet', () => {
          testObject.add(value1, 'set2');
          const set1 = testObject.getSet('set1');
          set1.add(value1);
          expect(set1.size).toBe(1);
          expect(testObject.size).toBe(1);

          testObject.detachSet('set1');
          expect(set1.size).toBe(1);
          expect(testObject.size).toBe(1);

          set1.clear();

          expect(set1.size).toBe(0);
          expect(testObject.size).toBe(1);
        });
      });
    });
  });
});