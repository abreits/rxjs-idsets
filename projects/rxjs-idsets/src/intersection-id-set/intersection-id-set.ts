import { Observable, Subscription, merge } from 'rxjs';

import {
  BaseIdSet,
  DifferenceIdSet,
  processDelta,
  UnionIdSet,
} from '../public-api';
import { DeltaValue, IdObject } from '../types';
import { OneOrMore } from '../utility/one-or-more';

/**
 * IdSet that contains all values of the intersection of the IdSets passed in the constructor
 */
export class IntersectionIdSet<
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
    this.buildIntersectionSet();
    this.processSourceSetDeltas();
  }

  private buildIntersectionSet() {
    const firstSourceSet = [...this.sourceSets][0];
    firstSourceSet.forEach((value) => this.addedFromSourceSet(value));
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
    const currentValue = this.idMap.get(value.id);
    if (currentValue !== value) {
      this.processIntersection(value);
    }
  }

  private processIntersection(value: IdValue) {
    const id = value.id;
    let presentInAll = true;
    for (const sourceSet of this.sourceSets) {
      if (!sourceSet.has(id)) {
        presentInAll = false;
        break;
      }
    }
    if (presentInAll) {
      this.addValue(value);
    } else {
      this.deleteId(value.id);
    }
  }

  protected deletedFromSourceSet(value: IdValue) {
    this.deleteId(value.id);
  }

  /***
   * Add IdSets to the IntersectionIdSet and update the result
   */
  public add(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    this.pause();
    const extraSets = idSets instanceof BaseIdSet ? [idSets] : idSets;
    for (const extraSet of extraSets) {
      this.sourceSets.add(extraSet);
    }
    this.idMap.forEach((value) => this.processIntersection(value));
    this.processSourceSetDeltas();
    this.resume();
  }

  /***
   * Remove IdSets from the IntersectionIdSet and update the result
   */
  public delete(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    this.pause();
    const removedSets = idSets instanceof BaseIdSet ? [idSets] : idSets;
    for (const removeSet of removedSets) {
      this.sourceSets.delete(removeSet);
    }
    this.buildIntersectionSet();
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
