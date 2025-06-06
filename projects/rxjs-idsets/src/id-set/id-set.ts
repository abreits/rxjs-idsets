import { IdObject } from '../types';
import { BaseIdSet } from '../base-id-set/base-id-set';
import { OneOrMore, oneOrMoreForEach } from '../utility/one-or-more';
import { DifferenceIdSet, IntersectionIdSet, UnionIdSet } from '../public-api';

/**
 * A Set containing IdObjects that publishes changes through Observables.
 */
export class IdSet<IdValue extends IdObject<Id>, Id = string> extends BaseIdSet<
  IdValue,
  Id
> {
  /**
   * Adds or modifies one or more values and returns the resulting set.
   */
  add(values: OneOrMore<IdValue>) {
    oneOrMoreForEach(values, (value) => {
      super.addValue(value);
    });
    return this;
  }

  /**
   * Deletes values and returns true if one or more values are deleted.
   */
  delete(ids: OneOrMore<Id>): boolean {
    let deleted = false;
    oneOrMoreForEach(ids, (id) => {
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
    this.pause();
    oneOrMoreForEach(values, (value) => {
      value = cloneValues ? structuredClone(value) : value;
      newEntriesSet.add(value.id);
      this.addValue(value);
    });
    // update deletions
    for (const oldId of this.idMap.keys()) {
      if (!newEntriesSet.has(oldId)) {
        this.deleteId(oldId);
      }
    }
    this.resume();
    return this;
  }

  override pause() {
    super.pause();
  }

  override resume() {
    super.resume();
  }

  /**
   * Removes all values and returns the resulting empty set.
   *
   * Existing subscriptions remain active.
   */
  override clear() {
    return super.clear();
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
