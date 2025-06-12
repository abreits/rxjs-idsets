import { Observable, Subscription, merge } from 'rxjs';

import {
  BaseIdSet,
  DifferenceIdSet,
  IntersectionIdSet,
  processDelta,
} from '../public-api';
import { DeltaValue, IdObject } from '../types';
import { OneOrMore } from '../utility/one-or-more';

export class UnionIdSet<
  IdValue extends IdObject<Id>,
  Id = string
> extends BaseIdSet<IdValue, Id> {
  private deltaSubscriber!: Subscription;
  private sourceSets!: Set<BaseIdSet<IdValue, Id>>;

  public get sourceIdSets(): Readonly<Set<BaseIdSet<IdValue, Id>>> {
    return this.sourceSets;
  }

  constructor(sourceIdSets: Iterable<BaseIdSet<IdValue, Id>>) {
    super();
    this.sourceSets = new Set(sourceIdSets);
    this.sourceSets.forEach((unionSet) => {
      unionSet.forEach((value) => this.addValue(value));
    });
    this.processSourceSetDeltas();
  }

  private processSourceSetDeltas() {
    const deltas: Observable<Readonly<DeltaValue<IdValue>>>[] = [];
    this.sourceSets.forEach((unionSet) => {
      deltas.push(unionSet.delta$);
    });
    this.deltaSubscriber?.unsubscribe();
    this.deltaSubscriber = merge(...deltas).subscribe({
      next: (delta) => {
        processDelta<IdValue, Id>(delta, {
          create: (idValue) => this.addedFromSourceSet(idValue),
          update: (idValue) => this.addedFromSourceSet(idValue),
          delete: (idValue) => this.deletedFromSourceSet(idValue),
        });
      },
      complete: () => this.complete(),
    });
  }

  override complete() {
    this.deltaSubscriber.unsubscribe();
    super.complete();
  }

  protected addedFromSourceSet(value: IdValue) {
    this.addValue(value);
  }

  protected deletedFromSourceSet(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue) {
      let noLongerPresent = true;
      for (const sourceSet of this.sourceSets) {
        if (sourceSet.has(id)) {
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
    this.pause();
    const extraSets = idSets instanceof BaseIdSet ? [idSets] : idSets;
    for (const extraSet of extraSets) {
      if (!this.sourceSets.has(extraSet)) {
        extraSet.forEach((value) => this.addedFromSourceSet(value));
        this.sourceSets.add(extraSet);
      }
    }
    this.processSourceSetDeltas();
    this.resume();
  }

  /***
   * Remove IdSets from the UnionIdSet and update the result
   */
  public delete(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    this.pause();
    const removedSets = idSets instanceof BaseIdSet ? [idSets] : idSets;
    for (const removeSet of removedSets) {
      if (this.sourceSets.has(removeSet)) {
        this.sourceSets.delete(removeSet);
        removeSet.forEach((value) => this.deletedFromSourceSet(value));
      }
    }
    this.processSourceSetDeltas();
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
