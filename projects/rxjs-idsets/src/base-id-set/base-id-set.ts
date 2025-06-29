import { from, Subject, concat, merge, Observable, of } from 'rxjs';
import { DeltaValue, IdObject, IdSetConfig } from '../types';

/**
 * Parent class for all IdSet classes containing all basic functionality
 */
export class BaseIdSet<
  SourceIdValue extends IdObject<Id>,
  Id = string,
  IdValue extends IdObject<Id> = SourceIdValue
> {
  // do not manipulate these properties directly unless you know what you are doing!
  /** WARNING: Do not use! Use addValue(), deleteId() or clear() */
  protected idMap = new Map<Id, IdValue>();
  /** WARNING: Do not use! Use addValue(), deleteId() or clear() */
  protected createSubject$ = new Subject<IdValue>();
  /** WARNING: Do not use! Use addValue(), deleteId() or clear() */
  protected updateSubject$ = new Subject<IdValue>();
  /** WARNING: Do not use! Use addValue(), deleteId() or clear() */
  protected deleteSubject$ = new Subject<IdValue>();
  /** WARNING: Do not use! Use addValue(), deleteId() or clear() */
  protected deltaSubject$ = new Subject<DeltaValue<IdValue>>();

  private filterFn?: (
    value: SourceIdValue,
    idSet: BaseIdSet<SourceIdValue, Id, IdValue>
  ) => boolean;
  private transformFn?: (
    value: SourceIdValue,
    idSet: BaseIdSet<SourceIdValue, Id, IdValue>
  ) => IdValue;

  /**
   * Is this IdSet being observed
   */
  get observed() {
    return (
      this.createSubject$.observed ||
      this.updateSubject$.observed ||
      this.deleteSubject$.observed ||
      this.deltaSubject$.observed
    );
  }

  /**
   * Observable returning all values currently present
   */
  get all$(): Observable<Readonly<IdValue>> {
    return from(this.idMap.values()) as Observable<IdValue>;
  }

  /**
   * Observable returning values deleted later
   */
  get delete$(): Observable<Readonly<IdValue>> {
    return this.deleteSubject$.asObservable();
  }

  /**
   * Observable returning values created later
   */
  get create$(): Observable<Readonly<IdValue>> {
    return this.createSubject$.asObservable();
  }

  /**
   * Observable returning values updated later
   */
  get update$(): Observable<Readonly<IdValue>> {
    return this.updateSubject$.asObservable();
  }

  /**
   * Observable returning values added later (both created and updated)
   */
  get add$(): Observable<Readonly<IdValue>> {
    return merge(this.createSubject$, this.updateSubject$);
  }

  /**
   * Observable returning all values currently present and values added later
   */
  get allAdd$(): Observable<Readonly<IdValue>> {
    return concat(this.all$, this.add$) as Observable<IdValue>;
  }

  /**
   * Return future changes in a single Observable (created, updated and deleted)
   */
  get delta$(): Observable<Readonly<DeltaValue<IdValue>>> {
    return this.deltaSubject$.asObservable();
  }

  /**
   * Return all values current present and future changes in a single Observable (created, updated and deleted)
   */
  get allDelta$(): Observable<Readonly<DeltaValue<IdValue>>> {
    return concat(of({ create: this.idMap.values() }), this.delta$);
  }

  /**
   * It will deep clone the values if `cloneValues` is true.
   */
  constructor(
    sourceValues?: Iterable<SourceIdValue>,
    config?: IdSetConfig<IdValue, SourceIdValue>
  ) {
    const cloneValues = config?.cloneValues;
    this.filterFn = config?.filter;
    this.transformFn = config?.transform;

    if (sourceValues) {
      for (let sourceValue of sourceValues) {
        if (this.filterFn && this.filterFn(sourceValue, this) == false) continue;
        sourceValue = cloneValues ? structuredClone(sourceValue) : sourceValue;
        const value = this.transformFn
          ? this.transformFn(sourceValue, this)
          : (sourceValue as any as IdValue);
        this.idMap.set(sourceValue.id, value);
      }
    }
  }

  /**
   * Completes all observables, updates are no longer published
   */
  complete() {
    this.createSubject$.complete();
    this.updateSubject$.complete();
    this.deleteSubject$.complete();
    this.deltaSubject$.complete();
  }

  private pauseCount = 0;
  private createDelta = new Map<Id, IdValue>();
  private updateDelta = new Map<Id, IdValue>();
  private deleteDelta = new Map<Id, IdValue>();

  /**
   * Pauses sending each update individually.
   *
   * When performing lots of overlapping add and/or delete actions on the set
   * and you only want to publish the results of these actions, you can use this to method to do so.
   *
   * Use `resume()` to resume sending updates.
   */
  public pause() {
    this.pauseCount++;
  }

  /**
   * Sends updates to reflect changes made to the set since `pause()` was called.
   *
   * Resumes sending each update individually after that.
   */
  public resume() {
    this.pauseCount--;
    if (this.pauseCount === 0) {
      // publish intermittent updates
      this.deleteDelta.forEach((value) => this.deleteSubject$.next(value));
      this.updateDelta.forEach((value) => this.updateSubject$.next(value));
      this.createDelta.forEach((value) => this.createSubject$.next(value));
      if (
        this.createDelta.size > 0 ||
        this.updateDelta.size > 0 ||
        this.deleteDelta.size > 0
      ) {
        this.deltaSubject$.next({
          create: [...this.createDelta.values()],
          update: [...this.updateDelta.values()],
          delete: [...this.deleteDelta.values()],
        });
      }
      // initialize delta's so they are ready for a new pause()
      this.createDelta.clear();
      this.updateDelta.clear();
      this.deleteDelta.clear();
    } else if (this.pauseCount < 0) {
      throw new Error('IdSet error: resume() called with no pause() pending');
    }
  }

  /**
   * Protected method to add a value to the set, publishes changes to relevant observables
   *
   * For use in child classes
   */
  protected addValue(sourceValue: SourceIdValue) {
    if (this.filterFn && this.filterFn(sourceValue, this) == false) return;
    const value = this.transformFn
      ? this.transformFn(sourceValue, this)
      : (sourceValue as any as IdValue);
    const id = sourceValue.id;
    const currentValue = this.idMap.get(id);
    if (currentValue !== value) {
      if (currentValue) {
        // update an existing value
        this.idMap.set(id, value);
        if (this.updateSubject$.observed || this.deltaSubject$.observed) {
          if (this.pauseCount > 0) {
            if (this.createDelta.has(id)) {
              // value was created after pause started, so it actually is a create
              this.createDelta.set(id, value);
            } else {
              this.updateDelta.set(id, value);
            }
          } else {
            this.updateSubject$.next(value);
            this.deltaSubject$.next({ update: value });
          }
        }
      } else {
        // create a new value
        this.idMap.set(id, value);
        if (this.createSubject$.observed || this.deltaSubject$.observed) {
          if (this.pauseCount > 0) {
            if (this.deleteDelta.has(id)) {
              // value was deleted after the pause started, so it actually is an update
              this.deleteDelta.delete(id);
              this.updateDelta.set(id, value);
            } else {
              // value is created after the pause started
              this.createDelta.set(id, value);
            }
          } else {
            this.createSubject$.next(value);
            this.deltaSubject$.next({ create: value });
          }
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
    const deletedValue = this.idMap.get(id);
    if (deletedValue) {
      this.idMap.delete(id);
      if (this.deleteSubject$.observed || this.deltaSubject$.observed) {
        if (this.pauseCount > 0) {
          if (this.createDelta.has(id)) {
            // value was created after the pause started, so remove it from the createDelta instead
            this.createDelta.delete(id);
          } else {
            // value existed before the pause started
            this.updateDelta.delete(id);
            this.deleteDelta.set(id, deletedValue);
          }
        } else {
          this.deleteSubject$.next(deletedValue);
          this.deltaSubject$.next({ delete: deletedValue });
        }
      }
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
    this.idMap.forEach((_, key) => this.deleteId(key));
    return this;
  }

  // ----------------------------------------------------------------------------------------
  // expose javascript 'Set' methods and properties from this.idMap that are readonly
  // ----------------------------------------------------------------------------------------

  get size() {
    return this.idMap.size;
  }

  values(): IterableIterator<Readonly<IdValue>> {
    return this.idMap.values();
  }

  forEach(
    fn: (value: IdValue, key?: Id, map?: Map<Id, IdValue>) => void,
    thisArg?: this
  ) {
    this.idMap.forEach(fn, thisArg);
  }

  get(key: Id): Readonly<IdValue> | undefined {
    return this.idMap.get(key);
  }

  has(key: Id) {
    return this.idMap.has(key);
  }

  keys() {
    return this.idMap.keys();
  }

  entries(): IterableIterator<[Id, Readonly<IdValue>]> {
    return this.idMap.entries();
  }

  [Symbol.iterator](): IterableIterator<Readonly<IdValue>> {
    return this.idMap.values();
  }
}
