import { Observable, Subscription, merge } from 'rxjs';

import {
  BaseIdSet,
  IntersectionIdSet,
  processDelta,
  UnionIdSet,
} from '../public-api';
import { DeltaValue, IdObject, IdSetConfig } from '../types';
import { OneOrMore } from '../utility/one-or-more';

/**
 * IdSet that contains all values of the difference between the source set and the other IdSets passed in the constructor
 */
export class DifferenceIdSet<
  IdValue extends IdObject<Id>,
  Id = string
> extends BaseIdSet<IdValue, Id> {
  private sourceSet: BaseIdSet<IdValue, Id>;
  private subtractedSets = new Set<BaseIdSet<IdValue, Id>>();

  private sourceDeltaSubscriber!: Subscription;
  private subtractDeltaSubscriber!: Subscription;

  private sourceCompleted = false;
  private subtractionsCompleted = false;

  public get sourceIdSet(): Readonly<BaseIdSet<IdValue, Id>> {
    return this.sourceIdSet;
  }
  public get subtractedIdSets(): Readonly<Set<BaseIdSet<IdValue, Id>>> {
    return this.subtractedSets;
  }

  constructor(
    sourceIdSet: BaseIdSet<IdValue, Id>,
    subtractedIdSets: OneOrMore<BaseIdSet<IdValue, Id>>,
    config?: IdSetConfig<IdValue>
  ) {
    super([], config);
    this.sourceSet = sourceIdSet;
    this.setSubtractedSets(subtractedIdSets);
    this.sourceSet.forEach((value) => this.addedFromSource(value));
    this.processSource();
    this.processSubtractions();
  }

  private setSubtractedSets(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    const subtractedSets = idSets instanceof BaseIdSet ? [idSets] : idSets;
    this.subtractedSets = new Set(subtractedSets);
  }

  private processSource() {
    this.sourceDeltaSubscriber?.unsubscribe();
    this.sourceDeltaSubscriber = this.sourceSet.delta$.subscribe({
      next: (delta) => {
        processDelta<IdValue, Id>(delta, {
          create: (idValue) => this.addedFromSource(idValue),
          update: (idValue) => this.addedFromSource(idValue),
          delete: (idValue) => this.deletedFromSource(idValue),
        });
      },
      complete: () => {
        this.sourceCompleted = true;
        if (this.subtractionsCompleted) {
          this.complete();
        }
      },
    });
  }

  private processSubtractions() {
    const deltas: Observable<Readonly<DeltaValue<IdValue>>>[] = [];
    this.subtractedSets.forEach((unionSet) => {
      deltas.push(unionSet.delta$);
    });
    this.subtractDeltaSubscriber?.unsubscribe();
    this.subtractDeltaSubscriber = merge(...deltas).subscribe({
      next: (delta) => {
        processDelta<IdValue, Id>(delta, {
          create: (idValue) => this.addedFromSubtractSet(idValue),
          delete: (idValue) => this.deletedFromSubtractSet(idValue),
        });
      },
      complete: () => {
        this.subtractionsCompleted = true;
        if (this.sourceCompleted) {
          this.complete();
        }
      },
    });
  }

  /***
   * Add IdSets to subtract from the source IdSet and update the result
   */
  public add(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    this.pause();
    const extraSubtractSets = idSets instanceof BaseIdSet ? [idSets] : idSets;
    for (const extraSet of extraSubtractSets) {
      if (!this.subtractedSets.has(extraSet)) {
        this.subtractedSets.add(extraSet);
        extraSet.forEach((value) => this.addedFromSubtractSet(value));
      }
    }
    this.processSubtractions();
    this.resume();
  }

  /***
   * Remove IdSets from collection of sets to subtract from the source IdSet and update the result
   */
  public delete(idSets: OneOrMore<BaseIdSet<IdValue, Id>>) {
    this.pause();
    const removedSubtractSets = idSets instanceof BaseIdSet ? [idSets] : idSets;
    for (const removedSet of removedSubtractSets) {
      this.subtractedSets.delete(removedSet);
    }
    this.sourceSet.forEach((value) => this.addedFromSource(value));
    this.resume();
  }

  /**
   * Replaces the source set and publishes the resulting difference changes.
   */
  public replace(sourceIdSet: BaseIdSet<IdValue, Id>) {
    this.pause();
    this.clear();
    this.sourceSet = sourceIdSet;
    this.sourceSet.forEach((value) => this.addedFromSource(value));
    this.resume();
  }

  override complete() {
    this.sourceDeltaSubscriber?.unsubscribe();
    this.subtractDeltaSubscriber?.unsubscribe();
    super.complete();
  }

  protected addedFromSource(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue) {
      // updating existing value
      this.addValue(value);
    } else {
      // possibly adding new value
      let notSubtracted = true;
      for (const subtractionSet of this.subtractedSets) {
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

  protected deletedFromSource(value: IdValue) {
    this.deleteId(value.id);
  }

  protected addedFromSubtractSet(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue) {
      this.deleteId(currentValue.id);
    }
  }

  protected deletedFromSubtractSet(value: IdValue) {
    const id = value.id;
    const sourceValue = this.sourceSet.get(id);
    if (sourceValue) {
      // add the no longer subtracted value?
      let notSubtracted = true;
      for (const subtractionSet of this.subtractedSets) {
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
