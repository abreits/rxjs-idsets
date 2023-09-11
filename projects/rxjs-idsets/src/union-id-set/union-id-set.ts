import { Observable, Subscription, merge } from 'rxjs';

import { ReadonlyIdSet } from '../public-api';
import { IdObject } from '../types';

export class UnionIdSet<IdValue extends IdObject<Id>, Id = string> extends ReadonlyIdSet<IdValue, Id> {
  private addSubscriber: Subscription;
  private deleteSubscriber: Subscription;

  constructor(
    public readonly sourceSets: Iterable<ReadonlyIdSet<IdValue, Id>>
  ) {
    super();

    const additions: Observable<IdValue>[] = [];
    const deletions: Observable<IdValue>[] = [];

    for (const unionSet of this.sourceSets) {
      additions.push(unionSet.allAdd$);
      deletions.push(unionSet.delete$);
    }

    this.addSubscriber = merge(...additions).subscribe(value => this.processAdd(value));
    this.deleteSubscriber = merge(...deletions).subscribe({
      next: value => this.processDelete(value),
      complete: () => this.complete()
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
}
