import { from, Subject, concat, merge, Observable } from 'rxjs';
import { IdObject } from '../types';

/**
 * Parent class for all IdSet classes containig all basic functionality
 */
export class ReadonlyIdSet<IdValue extends IdObject<Id>, Id = string> {
  protected idMap = new Map<Id, IdValue>();
  protected createSubject$ = new Subject<IdValue>();
  protected updateSubject$ = new Subject<IdValue>();
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
    return this.createSubject$;
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

  constructor(values?: Iterable<IdValue>) {
    if (values) {
      for (const value of values) {
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

  // ----------------------------------------------------------------------------------------
  // expose javascript 'Set' methods and properties from this.idMap that are readonly
  // ----------------------------------------------------------------------------------------

  get size() {
    return this.idMap.size;
  }

  values() {
    return this.idMap.values();
  }

  forEach(fn: (value: IdValue, key?: Id, map?: Map<Id, IdValue>) => void, thisArg?: any) {
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
