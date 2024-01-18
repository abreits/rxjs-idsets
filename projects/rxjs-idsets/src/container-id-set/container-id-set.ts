import { IdObject } from '../types';
import { OneOrMore, oneOrMoreForEach, oneOrMoreToArray, oneOrMoreToIterable } from '../utility/one-or-more';
import { IdSet, IntersectionIdSet, DifferenceIdSet, UnionIdSet } from '../public-api';
import { InnerIdSet } from './inner-id-set';

/**
 * A Set containing IdObjects that publishes changes through Observables.
 */
export class ContainerIdSet<IdValue extends IdObject<Id>, Id = string, SetId = string> extends IdSet<IdValue, Id> {
  private innerSets = new Map<SetId, InnerIdSet<IdValue, Id, SetId>>();
  private idInSet = new Map<Id, Set<SetId>>();

  /**
   * A Map containing all SetIds with their corresponding IdSet.
   */
  get sets(): ReadonlyMap<SetId, IdSet<Readonly<IdValue>, Id>> {
    return this.innerSets;
  }

  /**
   * You can use the `export()` method to create values for the constructor to duplicate an existing 
   * `ContainerIdSet`.
   * 
   * It will deep clone the values if `cloneValues` is true.
   */
  constructor(values?: OneOrMore<IdValue | [IdValue, Iterable<SetId>]>, cloneValues = false) {
    super();
    if (values) {
      this.replace(values, cloneValues);
    }
  }

  /**
   * Add one or more values to the specified sets.
   */
  override add(values: OneOrMore<IdValue>, setIds?: OneOrMore<SetId>) {
    if (setIds) {
      oneOrMoreForEach(values, value => {
        oneOrMoreForEach(setIds, category => {
          const categoriesBelongedTo = this.getSetsBelongedTo(value.id).add(category);
          super.add(value);
          for (category of categoriesBelongedTo) {
            const categorySet = this.getInnerIdSet(category);
            categorySet.superAdd(value);
          }
        });
      });
    }
    return this;
  }

  /**
   * Delete values, specified by their Id from the specified sets.
   * If no sets are specified, they are removed from all sets in the `ContainerIdSet`.
   * 
   * If a value no longer belongs to any set in the `ContainerIdSet`,
   * it will also be removed from the `ContainerIdSet`.
   */
  override delete(ids: OneOrMore<Id>, setIds?: OneOrMore<SetId>) {
    let deleted = false;
    oneOrMoreForEach(ids, id => {
      const setsBelongedTo = this.idInSet.get(id);
      if (setsBelongedTo) {
        const removeFromSets = setIds ?? this.idInSet.get(id);
        if (removeFromSets !== undefined) {
          oneOrMoreForEach(removeFromSets, category => {
            this.deleteIdFromSet(id, category);
            setsBelongedTo.delete(category);
            deleted = true;
          });
        }
        if (setsBelongedTo.size === 0) {
          this.idInSet.delete(id);
          super.delete(id);
        }
      }
    });
    return deleted;
  }

  /**
   * Remove the id from the set.
   */
  protected deleteIdFromSet(id: Id, setId: SetId) {
    const innerSet = this.innerSets.get(setId);
    if (innerSet) {
      innerSet.superDelete(id);
    }
  }

  /**
   * Replace the contents of the `ContainerIdSet` with the specified _values_.
   * 
   * The values need to be of the type `[IdValue, Iterable<SetId>]`, if they are `IdValue`, they are ignored.
   * 
   * If no values are specified the `ContainerIdSet` and all its existing sets will be cleared.
   */
  override replace(values: OneOrMore<IdValue | [IdValue, Iterable<SetId>]>, cloneValues = false) {
    const newIds = new Set<Id>();
    // add new values
    for (const value of oneOrMoreToIterable(values)) {
      if (Array.isArray(value)) {
        const newValue = cloneValues ? structuredClone(value[0]) : value[0];
        const categories = value[1];
        this.addExclusive(newValue, categories);
        newIds.add(newValue.id);
      }
    }
    // remove no longer existing values
    for (const id of this.idMap.keys()) {
      if (!newIds.has(id)) {
        this.delete(id);
      }
    }
    return this;
  }

  /**
   * Export the contents of the `ContainerIdSet` in a format that the `constructor` and `replace`
   * method understand.
   */
  *export(): IterableIterator<[Readonly<IdValue>, Iterable<SetId>]> {
    for (const [id, value] of this.idMap) {
      const categories = this.idInSet.get(id) as Iterable<SetId>;
      yield [value, categories];
    }
  }

  /**
   * Add the values only to the specified sets, remove from all other sets.
   */
  addExclusive(values: OneOrMore<IdValue>, setIds?: OneOrMore<SetId>) {
    if (setIds) {
      this.add(values, setIds);
      const newCategoriesBelongedTo = new Set(oneOrMoreToIterable(setIds));
      oneOrMoreForEach(values, value => {
        const categoriesBelongedTo = this.getSetsBelongedTo(value.id);
        for (const currentCategory of categoriesBelongedTo) {
          if (!newCategoriesBelongedTo.has(currentCategory)) {
            this.deleteIdFromSet(value.id, currentCategory);
            categoriesBelongedTo.delete(currentCategory);
          }
        }
      });
    } else {
      oneOrMoreForEach(values, value => this.delete(value.id));
    }
    return this;
  }

  /**
   * Completes all subscriptions of this `ContainerIdSet` and all contained IdSets.
   */
  override complete() {
    this.innerSets.forEach(innerSet => innerSet.complete());
    super.complete();
  }

  /**
   * Return a `Set` containing the SetIds for the IdSets the value with this id is member of
   * or undefined if it is not member of any contained set.
   */
  setsBelongedTo(id: Id): ReadonlySet<SetId> | undefined {
    return this.idMap.has(id) ? this.getSetsBelongedTo(id) : undefined;
  }

  protected getSetsBelongedTo(id: Id) {
    let result = this.idInSet.get(id);
    if (result === undefined) {
      result = new Set();
      this.idInSet.set(id, result);
    }
    return result;
  }

  /**
   * Returns the internal InnerIdSet belonging to the specified set.
   * Creates it if it does not exist.
   * 
   * The internal InnerIdSet has extra methods and properties that may only be used
   * from within this class.
   */
  private getInnerIdSet(category: SetId) {
    let categorySet = this.innerSets.get(category);
    if (categorySet === undefined) {
      categorySet = new InnerIdSet(category, this);
      this.innerSets.set(category, categorySet);
    }
    return categorySet;
  }

  /**
   * Returns the internal InnerIdSet sets belonging to the specified sets.
   * Creates them if they do not exist.
   * 
   * The internal InnerIdSet has extra methods and properties that may only be used
   * from within this class.
   */
  private getInnerIdSets(categories: Iterable<SetId>) {
    const categorySets = [];
    for (const category of categories) {
      categorySets.push(this.getInnerIdSet(category));
    }
    return categorySets;
  }

  /**
   * Clear specified sets, if no set is specified all contained sets are cleared.
   * 
   * If a value no longer exists in any set it will also be removed from the `ContainerIdSet`.
   */
  override clear(setIds?: OneOrMore<SetId>) {
    setIds = setIds ?? this.sets.keys();
    const setsToClear = oneOrMoreToIterable(setIds);
    for (const setToClear of setsToClear) {
      const innerSet = this.getInnerIdSet(setToClear);
      innerSet.delete(innerSet.keys());
    }
    return this;
  }

  /**
   * Remove a contained set from the collection of sets.
   * 
   * Remove all values that are not present in another contained set from the `ContainerIdSet`
   */
  detachSet(setIds: OneOrMore<SetId>) {
    oneOrMoreForEach(setIds, setId => {
      const detachedSet = this.innerSets.get(setId);
      if (detachedSet) {
        detachedSet.detach();
        this.innerSets.delete(setId);
        detachedSet.forEach(value => {
          this.delete(value.id, setId);
        });
      }
    });
  }

  /**
   * Uses the existing IdSet for the SetId if the set exists.
   * 
   * Creates a new empty IdSet for the SetId if the set does not exist.
   * 
   * Returns the IdSet of the specified SetId.
   */
  getSet(setId: SetId): IdSet<IdValue, Id> {
    return this.getInnerIdSet(setId);
  }

  /**
   * Return a UnionIdSet that is the union of the specified SetId sets.
   */
  union(setIds: Iterable<SetId>) {
    return new UnionIdSet(this.getInnerIdSets(setIds));
  }

  /**
   * Return an IntersectionIdSet that is the intersection of the specified SetId sets.
   */
  intersection(setIds: Iterable<SetId>) {
    return new IntersectionIdSet(this.getInnerIdSets(setIds));
  }

  /**
   * Return a DifferenceIdSet that subtracts the other categories from the specified SetId sets.
   */
  difference(setId: SetId, subtractedSetIds: OneOrMore<SetId>) {
    const subtractSets = this.getInnerIdSets(oneOrMoreToArray(subtractedSetIds));
    return new DifferenceIdSet(this.getInnerIdSet(setId), subtractSets);
  }

  /**
   * Return a DifferenceIdSet that returns a set containing the CategorizedSet minus the
   * subtracted SetId sets.
   */
  complement(subtractedSetIds: OneOrMore<SetId>) {
    const subtractSets = this.getInnerIdSets(oneOrMoreToArray(subtractedSetIds));
    return new DifferenceIdSet(this, subtractSets);
  }
}
