import { Observable, Subscription, merge } from 'rxjs';

import {
  BaseIdSet,
  IntersectionIdSet,
  processDelta,
  UnionIdSet,
} from '../public-api';
import { IdObject } from '../types';
import { OneOrMore, oneOrMoreForEach } from '../utility/one-or-more';

/**
 * IdSet that contains all values of the difference between the source set and the other IdSets passed in the constructor
 */
export class DifferenceIdSet<
  IdValue extends IdObject<Id>,
  Id = string
> extends BaseIdSet<IdValue, Id> {
  private subtractSets = new Set<BaseIdSet<IdValue, Id>>();
  private processSourceDeltaSubscriber: Subscription;
  private processOtherAddSubscriber?: Subscription;
  private processOtherDeleteSubscriber?: Subscription;
  private sourceCompleted = false;
  private subtractionsCompleted = false;

  constructor(
    public readonly sourceSet: BaseIdSet<IdValue, Id>,
    subtractSets: OneOrMore<BaseIdSet<IdValue, Id>>
  ) {
    super();

    this.processSourceDeltaSubscriber = this.sourceSet.allDelta$.subscribe({
      next: (delta) => {
        processDelta<IdValue, Id>(delta, {
          create: (idValue) => this.processAdd(idValue),
          update: (idValue) => this.processAdd(idValue),
          delete: (idValue) => this.processDelete(idValue),
        });
      },
      complete: () => {
        this.sourceCompleted = true;
        if (this.subtractionsCompleted) {
          this.complete();
        }
      },
    });
    this.add(subtractSets);
  }

  /***
   * Add IdSets to subtract from the source IdSet and update the result
   */
  public add(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    const additions: Observable<IdValue>[] = [];
    const deletions: Observable<IdValue>[] = [];
    // add existing subtract set observables
    oneOrMoreForEach(this.subtractSets, (subtractSet) => {
      additions.push(subtractSet.add$);
      deletions.push(subtractSet.delete$);
    });
    // add extra subtract set observables
    const extraSets = idSets instanceof BaseIdSet ? [idSets] : idSets; // fix iterator on next line
    oneOrMoreForEach(extraSets, (extraSet) => {
      if (!this.subtractSets.has(extraSet)) {
        additions.push(extraSet.allAdd$);
        deletions.push(extraSet.delete$);
        this.subtractSets.add(extraSet);
      }
    });
    this.setSubtractionSubscriptions(additions, deletions);
  }

  /***
   * Remove IdSets from collection of sets to subtract from the source IdSet and update the result
   */
  public delete(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    const additions: Observable<IdValue>[] = [];
    const deletions: Observable<IdValue>[] = [];
    const tryRemoveSets = new Set(
      idSets instanceof BaseIdSet ? [idSets] : idSets
    );
    const remainingSets = new Set<BaseIdSet<IdValue, Id>>();
    const removedSets: BaseIdSet<IdValue, Id>[] = [];
    this.pause();
    // add remaining subtract set observables
    oneOrMoreForEach(this.subtractSets, (subtractSet) => {
      if (tryRemoveSets.has(subtractSet)) {
        removedSets.push(subtractSet);
      } else {
        additions.push(subtractSet.add$);
        deletions.push(subtractSet.delete$);
        remainingSets.add(subtractSet);
      }
    });
    this.subtractSets = remainingSets;
    this.setSubtractionSubscriptions(additions, deletions);
    // proces items of removed subtract sets
    removedSets.forEach((removedSet) => {
      removedSet.forEach((idValue) => this.processOtherDelete(idValue));
    });
    this.resume();
  }

  override complete() {
    this.processSourceDeltaSubscriber?.unsubscribe();
    this.processOtherAddSubscriber?.unsubscribe();
    this.processOtherDeleteSubscriber?.unsubscribe();
    super.complete();
  }

  private setSubtractionSubscriptions(
    additions: Observable<IdValue>[],
    deletions: Observable<IdValue>[]
  ) {
    this.processOtherAddSubscriber?.unsubscribe();
    this.processOtherDeleteSubscriber?.unsubscribe();
    this.pause();
    this.processOtherAddSubscriber = merge(...additions).subscribe((value) =>
      this.processOtherAdd(value)
    );
    this.processOtherDeleteSubscriber = merge(...deletions).subscribe({
      next: (value) => this.processOtherDelete(value),
      complete: () => {
        this.subtractionsCompleted = true;
        if (this.sourceCompleted) {
          this.complete();
        }
      },
    });
    this.resume();
  }

  protected processAdd(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue) {
      // updating existing value
      this.addValue(value);
    } else {
      // possibly adding new value
      let notSubtracted = true;
      for (const subtractionSet of this.subtractSets) {
        if (subtractionSet.has(id)) {
          notSubtracted = false;
          break;
        }
      }
      if (notSubtracted) {
        this.addValue(value);
      }
    }
  }

  protected processDelete(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue) {
      this.idMap.delete(id);
      this.deleteSubject$.next(currentValue);
    }
  }

  protected processOtherAdd(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue) {
      this.deleteId(currentValue.id);
    }
  }

  protected processOtherDelete(value: IdValue) {
    const id = value.id;
    const sourceValue = this.sourceSet.get(id);
    if (sourceValue) {
      // add the no longer subtracted value?
      let notSubtracted = true;
      for (const subtractionSet of this.subtractSets) {
        if (subtractionSet.has(id)) {
          notSubtracted = false;
          break;
        }
      }
      if (notSubtracted) {
        this.addValue(value);
      }
    }
  }

  //chaining methods

  /**
   * Return a new DifferenceIdSet that subtracts the specified IdSets from this IdSet.
   */
  /* istanbul ignore next ** trivial */
  subtract(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    return new DifferenceIdSet(this, idSets);
  }
  /**
   * Return a new UnionIdSet that creates a union of this IdSet with the specified IdSets.
   */
  /* istanbul ignore next ** trivial */
  union(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    return new UnionIdSet(
      idSets instanceof BaseIdSet ? [idSets, this] : [...idSets, this]
    );
  }
  /**
   * Return a new IntersectionIdSet that creates an intersection of this IdSet with the specified IdSets.
   */
  /* istanbul ignore next ** trivial */
  intersect(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    return new IntersectionIdSet(
      idSets instanceof BaseIdSet ? [idSets, this] : [...idSets, this]
    );
  }
}
