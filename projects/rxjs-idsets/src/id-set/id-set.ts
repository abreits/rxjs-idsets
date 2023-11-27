import { IdObject } from '../types';
import { ReadonlyIdSet } from '../readonly-id-set/readonly-id-set';
import { OneOrMore, oneOrMoreForEach } from '../utility/one-or-more';


/**
 * A Set containing IdObjects that publishes changes through Observables.
 */
export class IdSet<IdValue extends IdObject<Id>, Id = string> extends ReadonlyIdSet<IdValue, Id> {

  /**
   * Adds or modifies one or more values and returns the resulting set.
   */
  add(values: OneOrMore<IdValue>) {
    oneOrMoreForEach(values, value => {
      super.addValue(value);
    });
    return this;
  }

  /**
   * Deletes values and returns true if one or more values are deleted.
   */
  delete(ids: OneOrMore<Id>): boolean {
    let deleted = false;
    oneOrMoreForEach(ids, id => {
      if (this.deleteId(id)) {
        deleted = true;
      }
    });
    return deleted;
  }

  /**
   * Replaces all existing values and returns the resulting set.
   * Create deep clones of the values if cloneValues is true
   * 
   * Existing subscriptions remain active.
   */
  replace(values: OneOrMore<IdValue>, cloneValues = false) {
    const newEntriesSet = new Set<Id>();

    // update additions and modifications
    oneOrMoreForEach(values, value => {
      value = cloneValues ? structuredClone(value) : value;
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
  override clear() {
    return super.clear();
  }
}
