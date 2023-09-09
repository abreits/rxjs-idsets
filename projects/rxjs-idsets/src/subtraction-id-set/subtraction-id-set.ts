import { Observable, Subscription, merge } from 'rxjs';

import { ReadonlyIdSet } from '../public-api';
import { IdObject } from '../types';
import { OneOrMore, oneOrMoreForEach, oneOrMoreToIterable } from '../utility/one-or-more';

/**
 * IdSet that contains all values of the intersection of the IdSets passed in the constructor
 */
export class SubtractionIdSet<IdValue extends IdObject<Id>, Id = string> extends ReadonlyIdSet<IdValue, Id> {
  public readonly subtractionSets: Iterable<ReadonlyIdSet<IdValue, Id>>;

  private addSubscriber: Subscription;
  private deleteSubscriber: Subscription;
  private subtractionAddSubscriber: Subscription;
  private subtractionDeleteSubscriber: Subscription;
  private sourceCompleted = false;
  private subtractionsCompleted = false;

  constructor(
    public readonly sourceSet: ReadonlyIdSet<IdValue, Id>,
    subtractionSets: OneOrMore<ReadonlyIdSet<IdValue, Id>>
  ) {
    super();

    this.subtractionSets = oneOrMoreToIterable(subtractionSets);
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
    oneOrMoreForEach(subtractionSets, subtractionSet => {
      additions.push(subtractionSet.allAdd$);
      deletions.push(subtractionSet.delete$);
    });
    this.subtractionAddSubscriber = merge(...additions).subscribe(value => this.processSubtractionAdd(value));
    this.subtractionDeleteSubscriber = merge(...deletions).subscribe({
      next: value => this.processSubtractionDelete(value),
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
      for (const subtractionSet of this.subtractionSets) {
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

  protected processSubtractionAdd(value: IdValue) {
    const id = value.id;
    const currentValue = this.idMap.get(id);
    if (currentValue) {
      this.idMap.delete(id);
      this.deleteSubject$.next(currentValue);
    }
  }

  protected processSubtractionDelete(value: IdValue) {
    const id = value.id;
    const sourceValue = this.sourceSet.get(id);
    if (sourceValue) {
      // add the no longer subtracted value?
      let notSubtracted = true;
      for (const subtractionSet of this.subtractionSets) {
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
