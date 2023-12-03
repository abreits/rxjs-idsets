import { DeltaValue, IdObject } from '../types';
import { BaseIdSet } from './base-id-set';
import { IdSet } from '../public-api';
import { processDelta } from '../utility/process-delta';

const value1 = { id: '1' };
const value2 = { id: '2' };

const testSet = [{ id: '1' }, { id: '2' }, { id: '3' }];
const testSetEntries = [['1', { id: '1' }], ['2', { id: '2' }], ['3', { id: '3' }]];
const testSetKeys = ['1', '2', '3'];

describe('BaseIdSet', () => {
  describe('constructor', () => {
    it('should create an empty set', () => {
      const testObject = new BaseIdSet();
      expect(testObject).toBeDefined();
    });

    it('should create a prefilled set', () => {
      const testObject = new BaseIdSet(testSet);
      expect(testObject).toBeDefined();
    });

    it('should use the original values if cloneValues is false or undefined', () => {
      const testObject = new BaseIdSet([value1, value2]);
      expect(testObject.get(value1.id)).toBe(value1);
    });

    it('should clone the values if cloneValues is true', () => {
      const testObject = new BaseIdSet([value1, value2], true);
      expect(testObject.get(value1.id)).not.toBe(value1);
      expect(testObject.get(value1.id)).toEqual(value1);
    });
  });

  describe('observed', () => {
    it('should return false if no subscriptions are active', () => {
      const testObject = new BaseIdSet();

      expect(testObject.observed).toBeFalse();
    });

    it('should return true if at least one subscription is active', () => {
      const testObject = new BaseIdSet();

      // test all possible subscriptions

      // all$ is synchronous and closes after all current elements have been sent
      testObject.all$.subscribe();
      expect(testObject.observed).toBeFalse();

      // activate all other subscriptions, for all observed should be true
      const addSubscription = testObject.add$.subscribe();
      expect(testObject.observed).toBeTrue();
      const allAddSubscription = testObject.allAdd$.subscribe();
      expect(testObject.observed).toBeTrue();
      const createSubscription = testObject.create$.subscribe();
      expect(testObject.observed).toBeTrue();
      const updateSubscription = testObject.update$.subscribe();
      expect(testObject.observed).toBeTrue();
      const deleteSubscription = testObject.delete$.subscribe();
      expect(testObject.observed).toBeTrue();

      // deactivate subscriptions again, only after the all have unsubscribed it should be false
      addSubscription.unsubscribe();
      expect(testObject.observed).toBeTrue();
      allAddSubscription.unsubscribe();
      expect(testObject.observed).toBeTrue();
      createSubscription.unsubscribe();
      expect(testObject.observed).toBeTrue();
      updateSubscription.unsubscribe();
      expect(testObject.observed).toBeTrue();
      deleteSubscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('all$', () => {
    it('should return the current values in the set and not make the set observed', () => {
      const testObject = new BaseIdSet(testSet);
      const received: IdObject[] = [];

      testObject.all$.subscribe(value => received.push(value));
      expect(received).toEqual(testSet);
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('delete$', () => {
    it('should return an observable and make the set observed', () => {
      const testObject = new BaseIdSet(testSet);

      const subscription = testObject.delete$.subscribe();
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('create$', () => {
    it('should return an observable and make the set observed', () => {
      const testObject = new BaseIdSet(testSet);

      const subscription = testObject.create$.subscribe();
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('update$', () => {
    it('should return an observable and make the set observed', () => {
      const testObject = new BaseIdSet(testSet);

      const subscription = testObject.update$.subscribe();
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('add$', () => {
    it('should return an observable and make the set observed', () => {
      const testObject = new BaseIdSet(testSet);

      const subscription = testObject.add$.subscribe();
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('allAdd$', () => {
    it('should return all existing values in an observable and make the set observed', () => {
      const testObject = new BaseIdSet(testSet);
      const results: IdObject[] = [];

      const subscription = testObject.allAdd$.subscribe(value => results.push(value));
      expect(results).toEqual(testSet);
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('delta$', () => {
    it('should return a DeltaValue observable and make the set observed', () => {
      const testObject = new BaseIdSet(testSet);

      const subscription = testObject.delta$.subscribe();
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });

    it('should return a DeltaValue create observable when a value is added to the set', () => {
      const testObject = new IdSet(); // use IdSet to test modifications
      let result: DeltaValue<IdObject> | undefined;
      const subscription = testObject.delta$.subscribe(value => result = value);

      testObject.add({ id: '1' });
      expect(result).toEqual({ create: { id: '1' } });

      subscription.unsubscribe();
    });

    it('should return a DeltaValue update observable when a value is updated in the set', () => {
      const testObject = new IdSet(testSet); // use IdSet to test modifications
      let result: DeltaValue<IdObject> | undefined;
      const subscription = testObject.delta$.subscribe(value => result = value);

      testObject.add({ id: '1' });
      expect(result).toEqual({ update: { id: '1' } });

      subscription.unsubscribe();
    });

    it('should return a DeltaValue delete observable when a value is deleted from the set', () => {
      const testObject = new IdSet(testSet); // use IdSet to test modifications
      let result: DeltaValue<IdObject> | undefined;
      const subscription = testObject.delta$.subscribe(value => result = value);

      testObject.delete('1');
      expect(result).toEqual({ delete: { id: '1' } });

      subscription.unsubscribe();
    });
  });

  describe('allDelta$', () => {
    it('should return all existing values as DeltaValues in an observable and make the set observed', () => {
      const testObject = new BaseIdSet(testSet);
      const results: IdObject[] = [];

      const subscription = testObject.allDelta$.subscribe(delta => processDelta(delta, {
        create: value => results.push(value)
      }));
      expect(results).toEqual(testSet);
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('complete', () => {
    it('should complete all existing subscriptions', () => {
      const testObject = new BaseIdSet(testSet);
      // activate all subscriptions
      const addSubscription = testObject.add$.subscribe();
      const allAddSubscription = testObject.allAdd$.subscribe();
      const deltaSubscription = testObject.delta$.subscribe();
      const allDeltaSubscription = testObject.allDelta$.subscribe();
      const createSubscription = testObject.create$.subscribe();
      const updateSubscription = testObject.update$.subscribe();
      const deleteSubscription = testObject.delete$.subscribe();

      expect(addSubscription.closed).toBeFalse();
      expect(allAddSubscription.closed).toBeFalse();
      expect(deltaSubscription.closed).toBeFalse();
      expect(allDeltaSubscription.closed).toBeFalse();
      expect(createSubscription.closed).toBeFalse();
      expect(updateSubscription.closed).toBeFalse();
      expect(deleteSubscription.closed).toBeFalse();

      testObject.complete();

      expect(addSubscription.closed).toBeTrue();
      expect(allAddSubscription.closed).toBeTrue();
      expect(deltaSubscription.closed).toBeTrue();
      expect(allDeltaSubscription.closed).toBeTrue();
      expect(createSubscription.closed).toBeTrue();
      expect(updateSubscription.closed).toBeTrue();
      expect(deleteSubscription.closed).toBeTrue();
    });
  });

  describe('implement readonly set methods and properties', () => {
    it('should implement size', () => {
      const testObject = new BaseIdSet(testSet);
      expect(testObject.size).toBe(testSet.length);
    });

    it('should implement entries()', () => {
      const testObject = new BaseIdSet(testSet);
      const entries = [...testObject.entries()] as any;
      expect(entries).toEqual(testSetEntries);
    });

    it('should implement forEach()', () => {
      const testObject = new BaseIdSet(testSet);
      const results: IdObject[] = [];
      testObject.forEach(value => results.push(value));
      expect(results).toEqual(testSet);
    });

    it('should implement get()', () => {
      const testObject = new BaseIdSet(testSet);
      expect(testObject.get('1')).toEqual({ id: '1' });
      expect(testObject.get('0')).toEqual(undefined);
    });

    it('should implement has()', () => {
      const testObject = new BaseIdSet(testSet);
      expect(testObject.has('1')).toBeTrue();
      expect(testObject.has('0')).toBeFalse();
    });

    it('should implement keys()', () => {
      const testObject = new BaseIdSet(testSet);
      const keys = [...testObject.keys()];
      expect(keys).toEqual(testSetKeys);
    });

    it('should implement values()', () => {
      const testObject = new BaseIdSet(testSet);
      const values = [...testObject.values()];
      expect(values).toEqual(testSet);
    });

    it('should implement [Symbol.iterator]()', () => {
      const testObject = new BaseIdSet(testSet);
      const content = [...testObject] as any;
      expect(content).toEqual(testSet);
    });
  });

  describe('pause and resume', () => {
    describe('pause()', () => {
      it('should no longer send updates', () => {
        // TODO
      });
    });

    describe('resume()', () => {
      it('should resume sending updates', () => {
        // TODO
      });
    });
  });
});
