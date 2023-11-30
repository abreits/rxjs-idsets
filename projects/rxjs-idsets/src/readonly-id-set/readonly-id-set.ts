import { from, Subject, concat, merge, Observable, map, of } from 'rxjs';
import { DeltaValue, IdObject } from '../types';

/**
 * Parent class for all IdSet classes containing all basic functionality
 */
export class ReadonlyIdSet<IdValue extends IdObject<Id>, Id = string> {
  // do not manipulate these properties directly unless you know what you are doing!
  /** WARNING: Do not use! Use addValue(), deleteId() or clear() */
  protected idMap = new Map<Id, IdValue>();
  /** WARNING: Do not use! Use addValue(), deleteId() or clear() */
  protected createSubject$ = new Subject<IdValue>();
  /** WARNING: Do not use! Use addValue(), deleteId() or clear() */
  protected updateSubject$ = new Subject<IdValue>();
  /** WARNING: Do not use! Use addValue(), deleteId() or clear() */
  protected deleteSubject$ = new Subject<IdValue>();

  /**
   * Is this IdSet being observed
   */
  get observed() {
    return this.createSubject$.observed || this.updateSubject$.observed || this.deleteSubject$.observed;
  }

  /**
   * Observable returning all values currently present
   */
  get all$(): Observable<IdValue> {
    return from(this.idMap.values());
  }

  /**
   * Observable returning values deleted later
   */
  get delete$(): Observable<IdValue> {
    return this.deleteSubject$.asObservable();
  }

  /**
   * Observable returning values created later
   */
  get create$(): Observable<IdValue> {
    return this.createSubject$.asObservable();
  }

  /**
   * Observable returning values updated later
   */
  get update$(): Observable<IdValue> {
    return this.updateSubject$.asObservable();
  }

  /**
   * Observable returning values added later (both created and updated)
   */
  get add$(): Observable<IdValue> {
    return merge(this.createSubject$, this.updateSubject$);
  }

  /**
   * Observable returning all values currently present and values added later
   */
  get allAdd$(): Observable<IdValue> {
    return concat(this.all$, this.add$);
  }

  /**
   * Return all future changes in a single Observable (created, updated and deleted)
   */
  get delta$(): Observable<DeltaValue<IdValue>> {
    return merge(
      this.createSubject$.pipe(map(value => ({ create: value }))),
      this.updateSubject$.pipe(map(value => ({ update: value }))),
      this.deleteSubject$.pipe(map(value => ({ delete: value })))
    );
  }

  /**
   * Return all current and future changes in a single Observable (created, updated and deleted)
   */
  get allDelta$(): Observable<DeltaValue<IdValue>> {
    return concat(
      of({ create: this.idMap.values() }),
      this.delta$);
  }

  /**
   * It will deep clone the values if `cloneValues` is true.
   */
  constructor(values?: Iterable<IdValue>, cloneValues = false) {
    if (values) {
      for (let value of values) {
        value = cloneValues ? structuredClone(value) : value;
        this.idMap.set(value.id, value);
      }
    }
  }

  /**
   * Completes all observables, updates are no longer published
   */
  complete(): void {
    this.createSubject$.complete();
    this.updateSubject$.complete();
    this, this.deleteSubject$.complete();
  }

  /**
   * Protected method to add a value to the set, publishes changes to relevant observables
   * 
   * For use in child classes
   */
  protected addValue(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue !== value) {
      if (currentValue) {
        this.idMap.set(id, value);
        if (this.updateSubject$.observed) {
          this.updateSubject$.next(value);
        }
      } else {
        this.idMap.set(id, value);
        if (this.createSubject$.observed) {
          this.createSubject$.next(value);
        }
      }
    }
  }

  /**
   * Protected method to delete a value from the set, publishes changes to relevant observables
   * 
   * For use in child classes
   */
  protected deleteId(id: Id): boolean {
    const deletedItem = this.idMap.get(id);
    if (deletedItem) {
      this.idMap.delete(id);
      this.deleteSubject$.next(deletedItem);
      return true;
    }
    return false;
  }

  /**
   * Removes all values and returns the resulting empty set.
   * Existing subscriptions remain active.
   * 
   * For use in child classes
   */
  protected clear() {
    if (this.deleteSubject$.observed) {
      const oldIdMap = this.idMap;
      this.idMap = new Map();
      oldIdMap.forEach(value => this.deleteSubject$.next(value));
    } else {
      this.idMap.clear();
    }
    return this;
  }

  // ----------------------------------------------------------------------------------------
  // expose javascript 'Set' methods and properties from this.idMap that are readonly
  // ----------------------------------------------------------------------------------------

  get size() {
    return this.idMap.size;
  }

  values() {
    return this.idMap.values();
  }

  forEach(fn: (value: IdValue, key?: Id, map?: Map<Id, IdValue>) => void, thisArg?: this) {
    this.idMap.forEach(fn, thisArg);
  }

  get(key: Id) {
    return this.idMap.get(key);
  }

  has(key: Id) {
    return this.idMap.has(key);
  }

  keys() {
    return this.idMap.keys();
  }

  entries() {
    return this.idMap.entries();
  }

  [Symbol.iterator]() {
    return this.idMap.values();
  }
}
