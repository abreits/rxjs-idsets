import { Observable, Subscription, merge } from 'rxjs';

import { BaseIdSet, DifferenceIdSet, IntersectionIdSet } from '../public-api';
import { IdObject } from '../types';
import { OneOrMore, oneOrMoreForEach } from '../utility/one-or-more';

export class UnionIdSet<
  IdValue extends IdObject<Id>,
  Id = string
> extends BaseIdSet<IdValue, Id> {
  private addSubscriber!: Subscription;
  private deleteSubscriber!: Subscription;
  private unionSets: Set<BaseIdSet<IdValue, Id>>;

  public get sourceSets() {
    return this.unionSets;
  }

  constructor(sourceIdSets: Iterable<BaseIdSet<IdValue, Id>>) {
    super();

    this.unionSets = new Set(sourceIdSets);

    const additions: Observable<IdValue>[] = [];
    const deletions: Observable<IdValue>[] = [];

    for (const unionSet of this.unionSets) {
      additions.push(unionSet.allAdd$);
      deletions.push(unionSet.delete$);
    }

    this.setUnionSubscriptions(additions, deletions);
  }

  override complete() {
    this.addSubscriber.unsubscribe();
    this.deleteSubscriber.unsubscribe();
    super.complete();
  }

  protected processAdd(value: IdValue) {
    this.addValue(value);
  }

  protected processDelete(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue) {
      let noLongerPresent = true;
      for (const unionSet of this.unionSets) {
        if (unionSet.has(id)) {
          noLongerPresent = false;
          break;
        }
      }
      if (noLongerPresent) {
        this.deleteId(id);
      }
    }
  }

  /***
   * Add IdSets to the UnionIdSet and update the result
   */
  public add(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    const additions: Observable<IdValue>[] = [];
    const deletions: Observable<IdValue>[] = [];
    // add existing union set observables
    for (const unionSet of this.unionSets) {
      additions.push(unionSet.add$);
      deletions.push(unionSet.delete$);
    }
    // add extra union set observables
    const extraSets = idSets instanceof BaseIdSet ? [idSets] : idSets; // fix iterator on next line
    oneOrMoreForEach(extraSets, (extraSet) => {
      if (!this.unionSets.has(extraSet)) {
        additions.push(extraSet.allAdd$);
        deletions.push(extraSet.delete$);
        this.unionSets.add(extraSet);
      }
    });

    this.setUnionSubscriptions(additions, deletions);
  }

  /***
   * Remove IdSets from the UnionIdSet and update the result
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
    // add remaining union set observables
    for (const unionSet of this.unionSets) {
      if (tryRemoveSets.has(unionSet)) {
        removedSets.push(unionSet);
      } else {
        additions.push(unionSet.add$);
        deletions.push(unionSet.delete$);
        remainingSets.add(unionSet);
      }
    }
    this.unionSets = remainingSets;
    this.setUnionSubscriptions(additions, deletions);
    // proces items of removed subtract sets
    removedSets.forEach((removedSet) => {
      removedSet.forEach((idValue) => this.processDelete(idValue));
    });
    this.resume();
  }

  private setUnionSubscriptions(
    additions: Observable<IdValue>[],
    deletions: Observable<IdValue>[]
  ) {
    this.addSubscriber?.unsubscribe();
    this.deleteSubscriber?.unsubscribe();
    this.pause();
    this.addSubscriber = merge(...additions).subscribe((value) =>
      this.processAdd(value)
    );
    this.deleteSubscriber = merge(...deletions).subscribe({
      next: (value) => this.processDelete(value),
      complete: () => this.complete(),
    });
    this.resume();
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
