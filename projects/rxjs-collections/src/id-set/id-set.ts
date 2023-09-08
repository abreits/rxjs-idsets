import { IdObject } from '../types';
import { ReadonlyIdSet } from '../readonly-id-set/readonly-id-set';
import { OneOrMore, oneOrMoreForEach } from '../utility/one-or-more';

export interface IdMapSettings {
  id: string;
}

/**
 * A Set containing IdObjects that publishes changes through Observables.
 */
export class IdSet<IdValue extends IdObject<Id>, Id = string> extends ReadonlyIdSet<IdValue, Id> {

  /**
   * Adds or modifies one or more values and returns the resulting set.
   */
  add(values: OneOrMore<IdValue>) {
    oneOrMoreForEach(values, value => {
      const id = value.id;
      const currentValue = this.idMap.get(id);
      if (currentValue !== value) {
        if (currentValue) {
          this.idMap.set(id, value);
          if (this.updateSubject$.observed) {
            this.updateSubject$.next(value);
          }
        } else {
          this.idMap.set(id, value);
          if (this.createSubject$.observed) {
            this.createSubject$.next(value);
          }
        }
      }
    });
    return this;
  }

  /**
   * Deletes values and returns true if one or more values are deleted.
   */
  delete(ids: OneOrMore<Id>): boolean {
    let deleted = false;
    oneOrMoreForEach(ids, id => {
      const deletedItem = this.idMap.get(id);
      if (deletedItem) {
        this.idMap.delete(id);
        this.deleteSubject$.next(deletedItem);
        deleted = true;
      }
    });
    return deleted;
  }

  /**
   * Replaces all existing values and returns the resulting set.
   * 
   * Existing subscriptions remain active.
   */
  replace(values: OneOrMore<IdValue>) {
    const newEntriesSet = new Set<Id>();

    // update additions and modifications
    oneOrMoreForEach(values, value => {
      newEntriesSet.add(value.id);
      this.add(value);
    });
    // update deletions
    for (const oldId of this.idMap.keys()) {
      if (!newEntriesSet.has(oldId)) {
        this.delete(oldId);
      }
    }
    return this;
  }

  /**
   * Removes all values and returns the resulting empty set.
   * 
   * Existing subscriptions remain active.
   */
  clear() {
    if (this.deleteSubject$.observed) {
      const oldIdMap = this.idMap;
      this.idMap = new Map();
      oldIdMap.forEach(value => this.deleteSubject$.next(value));
    } else {
      this.idMap.clear();
    }
    return this;
  }
}
