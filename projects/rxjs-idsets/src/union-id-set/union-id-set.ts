import { Observable, Subscription, merge } from 'rxjs';

import { BaseIdSet, DifferenceIdSet, IntersectionIdSet } from '../public-api';
import { IdObject } from '../types';
import { OneOrMore } from '../utility/one-or-more';

export class UnionIdSet<
  IdValue extends IdObject<Id>,
  Id = string
> extends BaseIdSet<IdValue, Id> {
  private addSubscriber: Subscription;
  private deleteSubscriber: Subscription;

  constructor(public readonly sourceSets: Iterable<BaseIdSet<IdValue, Id>>) {
    super();

    const additions: Observable<IdValue>[] = [];
    const deletions: Observable<IdValue>[] = [];

    for (const unionSet of this.sourceSets) {
      additions.push(unionSet.allAdd$);
      deletions.push(unionSet.delete$);
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
    if (currentValue) {
      if (currentValue !== value) {
        this.idMap.set(id, value);
        this.updateSubject$.next(value);
      }
    } else {
      this.idMap.set(id, value);
      this.createSubject$.next(value);
    }
  }

  protected processDelete(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue) {
      let noLongerPresent = true;
      for (const unionSet of this.sourceSets) {
        if (unionSet.has(id)) {
          noLongerPresent = false;
          break;
        }
      }
      if (noLongerPresent) {
        this.idMap.delete(id);
        this.deleteSubject$.next(currentValue);
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
