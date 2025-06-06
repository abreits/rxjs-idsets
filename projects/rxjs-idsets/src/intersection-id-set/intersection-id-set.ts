import { Observable, Subscription, merge } from 'rxjs';

import { BaseIdSet, DifferenceIdSet, UnionIdSet } from '../public-api';
import { IdObject } from '../types';
import { OneOrMore } from '../utility/one-or-more';

/**
 * IdSet that contains all values of the intersection of the IdSets passed in the constructor
 */
export class IntersectionIdSet<
  IdValue extends IdObject<Id>,
  Id = string
> extends BaseIdSet<IdValue, Id> {
  private addSubscriber: Subscription;
  private deleteSubscriber: Subscription;

  constructor(
    public readonly intersectionSets: Iterable<BaseIdSet<IdValue, Id>>
  ) {
    super();

    const additions: Observable<IdValue>[] = [];
    const deletions: Observable<IdValue>[] = [];

    for (const intersectionSet of this.intersectionSets) {
      additions.push(intersectionSet.allAdd$);
      deletions.push(intersectionSet.delete$);
    }

    this.addSubscriber = merge(...additions).subscribe((value) =>
      this.processAdd(value)
    );
    this.deleteSubscriber = merge(...deletions).subscribe({
      next: (value) => this.processDelete(value),
      complete: () => this.complete(),
    });
  }

  override complete() {
    this.addSubscriber.unsubscribe();
    this.deleteSubscriber.unsubscribe();
    super.complete();
  }

  protected processAdd(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue !== value) {
      let presentInAll = true;
      for (const unionSet of this.intersectionSets) {
        if (!unionSet.has(id)) {
          presentInAll = false;
          break;
        }
      }
      if (presentInAll) {
        this.idMap.set(id, value);
        if (currentValue === undefined) {
          this.createSubject$.next(value);
        } else {
          this.updateSubject$.next(value);
        }
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
