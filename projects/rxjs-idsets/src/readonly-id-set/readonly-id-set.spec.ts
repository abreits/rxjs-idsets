import { IdObject } from '../types';
import { ReadonlyIdSet } from './readonly-id-set';

const testSet = [{ id: '1' }, { id: '2' }, { id: '3' }];
const testSetEntries = [['1', { id: '1' }], ['2', { id: '2' }], ['3', { id: '3' }]];
const testSetKeys = ['1', '2', '3'];

describe('ReadonlyIdSet', () => {
  describe('constructor', () => {
    it('should create an empty set', () => {
      const testObject = new ReadonlyIdSet();
      expect(testObject).toBeDefined();
    });

    it('should create a prefilled set', () => {
      const testObject = new ReadonlyIdSet(testSet);
      expect(testObject).toBeDefined();
    });
  });

  describe('observed', () => {
    it('should return false if no subscriptions are active', () => {
      const testObject = new ReadonlyIdSet();

      expect(testObject.observed).toBeFalse();
    });

    it('should return true if at least one subscription is active', () => {
      const testObject = new ReadonlyIdSet();

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
      const testObject = new ReadonlyIdSet(testSet);
      const received: IdObject[] = [];

      testObject.all$.subscribe(value => received.push(value));
      expect(received).toEqual(testSet);
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('delete$', () => {
    it('should return an observable and make the set observed', () => {
      const testObject = new ReadonlyIdSet(testSet);

      const subscription = testObject.delete$.subscribe();
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('create$', () => {
    it('should return an observable and make the set observed', () => {
      const testObject = new ReadonlyIdSet(testSet);

      const subscription = testObject.create$.subscribe();
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('update$', () => {
    it('should return an observable and make the set observed', () => {
      const testObject = new ReadonlyIdSet(testSet);

      const subscription = testObject.update$.subscribe();
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('add$', () => {
    it('should return an observable and make the set observed', () => {
      const testObject = new ReadonlyIdSet(testSet);

      const subscription = testObject.add$.subscribe();
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('allAdd$', () => {
    it('should return all existing values in an observable and make the set observed', () => {
      const testObject = new ReadonlyIdSet(testSet);
      const results: IdObject[] = [];

      const subscription = testObject.allAdd$.subscribe(value => results.push(value));
      expect(results).toEqual(testSet);
      expect(subscription.closed).toBeFalse();
      expect(testObject.observed).toBeTrue();

      subscription.unsubscribe();
      expect(testObject.observed).toBeFalse();
    });
  });

  describe('complete', () => {
    it('should complete all existing subscriptions', () => {
      const testObject = new ReadonlyIdSet(testSet);
      // activate all subscriptions
      const addSubscription = testObject.add$.subscribe();
      const allAddSubscription = testObject.allAdd$.subscribe();
      const createSubscription = testObject.create$.subscribe();
      const updateSubscription = testObject.update$.subscribe();
      const deleteSubscription = testObject.delete$.subscribe();

      expect(addSubscription.closed).toBeFalse();
      expect(allAddSubscription.closed).toBeFalse();
      expect(createSubscription.closed).toBeFalse();
      expect(updateSubscription.closed).toBeFalse();
      expect(deleteSubscription.closed).toBeFalse();

      testObject.complete();

      expect(addSubscription.closed).toBeTrue();
      expect(allAddSubscription.closed).toBeTrue();
      expect(createSubscription.closed).toBeTrue();
      expect(updateSubscription.closed).toBeTrue();
      expect(deleteSubscription.closed).toBeTrue();      
    });
  });


  describe('implement readonly set methods and properties', () => {
    it('should implement size', () => {
      const testObject = new ReadonlyIdSet(testSet);
      expect(testObject.size).toBe(testSet.length);
    });

    it('should implement entries()', () => {
      const testObject = new ReadonlyIdSet(testSet);
      const entries = [...testObject.entries()] as any;
      expect(entries).toEqual(testSetEntries);
    });

    it('should implement forEach()', () => {
      const testObject = new ReadonlyIdSet(testSet);
      const results: IdObject[] = [];
      testObject.forEach(value => results.push(value));
      expect(results).toEqual(testSet);
    });

    it('should implement get()', () => {
      const testObject = new ReadonlyIdSet(testSet);
      expect(testObject.get('1')).toEqual({ id: '1' });
      expect(testObject.get('0')).toEqual(undefined);
    });

    it('should implement has()', () => {
      const testObject = new ReadonlyIdSet(testSet);
      expect(testObject.has('1')).toBeTrue();
      expect(testObject.has('0')).toBeFalse();
    });

    it('should implement keys()', () => {
      const testObject = new ReadonlyIdSet(testSet);
      const keys = [...testObject.keys()];
      expect(keys).toEqual(testSetKeys);
    });

    it('should implement [Symbol.iterator]()', () => {
      const testObject = new ReadonlyIdSet(testSet);
      const content = [...testObject] as any;
      expect(content).toEqual(testSet);
    });
  });
});
