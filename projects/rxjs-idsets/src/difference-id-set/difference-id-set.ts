import { Observable, Subscription, merge } from 'rxjs';

import { BaseIdSet } from '../public-api';
import { IdObject } from '../types';
import { OneOrMore, oneOrMoreForEach, oneOrMoreToIterable } from '../utility/one-or-more';

/**
 * IdSet that contains all values of the difference between the source set and the other IdSets passed in the constructor
 */
export class DifferenceIdSet<IdValue extends IdObject<Id>, Id = string> extends BaseIdSet<IdValue, Id> {
  public readonly otherSets: Iterable<BaseIdSet<IdValue, Id>>;

  private addSubscriber: Subscription;
  private deleteSubscriber: Subscription;
  private subtractionAddSubscriber: Subscription;
  private subtractionDeleteSubscriber: Subscription;
  private sourceCompleted = false;
  private subtractionsCompleted = false;

  constructor(
    public readonly sourceSet: BaseIdSet<IdValue, Id>,
    otherSets: OneOrMore<BaseIdSet<IdValue, Id>>
  ) {
    super();

    this.otherSets = oneOrMoreToIterable(otherSets);
    this.addSubscriber = this.sourceSet.allAdd$.subscribe(value => this.processAdd(value));
    this.deleteSubscriber = this.sourceSet.delete$.subscribe({
      next: value => this.processDelete(value),
      complete: () => {
        this.sourceCompleted = true;
        if (this.subtractionsCompleted) {
          this.complete();
        }
      }
    });

    const additions: Observable<IdValue>[] = [];
    const deletions: Observable<IdValue>[] = [];
    oneOrMoreForEach(otherSets, subtractionSet => {
      additions.push(subtractionSet.allAdd$);
      deletions.push(subtractionSet.delete$);
    });
    this.subtractionAddSubscriber = merge(...additions).subscribe(value => this.processOtherAdd(value));
    this.subtractionDeleteSubscriber = merge(...deletions).subscribe({
      next: value => this.processOtherDelete(value),
      complete: () => {
        this.subtractionsCompleted = true;
        if (this.sourceCompleted) {
          this.complete();
        }
      }
    });
  }

  override complete() {
    this.addSubscriber.unsubscribe();
    this.deleteSubscriber.unsubscribe();
    this.subtractionAddSubscriber.unsubscribe();
    this.subtractionDeleteSubscriber.unsubscribe();
    super.complete();
  }

  protected processAdd(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue) {
      // updating existing value
      if (currentValue !== value) {
        this.idMap.set(id, value);
        this.updateSubject$.next(value);
      }
    } else {
      // possibly adding new value
      let notSubtracted = true;
      for (const subtractionSet of this.otherSets) {
        if (subtractionSet.has(id)) {
          notSubtracted = false;
          break;
        }
      }
      if (notSubtracted) {
        this.idMap.set(id, value);
        this.createSubject$.next(value);
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
      this.idMap.delete(id);
      this.deleteSubject$.next(currentValue);
    }
  }

  protected processOtherDelete(value: IdValue) {
    const id = value.id;
    const sourceValue = this.sourceSet.get(id);
    if (sourceValue) {
      // add the no longer subtracted value?
      let notSubtracted = true;
      for (const subtractionSet of this.otherSets) {
        if (subtractionSet.has(id)) {
          notSubtracted = false;
          break;
        }
      }
      if (notSubtracted) {
        this.idMap.set(id, value);
        this.createSubject$.next(value);
      }
    }
  }
}
