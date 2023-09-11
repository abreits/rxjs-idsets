import { Subject } from 'rxjs';
import { IdObject } from '../types';
import { OneOrMore, oneOrMoreForEach, oneOrMoreToArray, oneOrMoreToIterable } from '../utility/one-or-more';
import { IdSet, IntersectionIdSet, DifferenceIdSet, UnionIdSet } from '../public-api';

/**
 * A Set containing IdObjects that publishes changes through Observables.
 */
export class CategorizedIdSet<IdValue extends IdObject<Id>, Id = string, Category = string> extends IdSet<IdValue, Id> {
  private categorySets = new Map<Category, IdSetCategory<IdValue, Id, Category>>();
  private idInCategorySet = new Map<Id, Set<Category>>();

  /**
   * A map containing the active categories and their values.
   * 
   * An active category is a category with values and/or observed subscriptions
   */
  get categories(): ReadonlyMap<Category, IdSet<IdValue, Id>> {
    return this.categorySets;
  }

  /**
   * You can use the `export()` method to create values for the constructor to duplicate an existing set.
   */
  constructor(values?: OneOrMore<IdValue | [IdValue, Iterable<Category>]>, cloneValues = false) {
    super();
    if (values) {
      this.replace(values, cloneValues);
    }
  }

  /**
   * Add value or values (also) to the specified categories.
   */
  override add(values: OneOrMore<IdValue>, categories?: OneOrMore<Category>) {
    if (categories) {
      oneOrMoreForEach(values, value => {
        oneOrMoreForEach(categories, category => {
          const categoriesBelongedTo = this.getCategoriesBelongedTo(value.id).add(category);
          super.add(value);
          for (category of categoriesBelongedTo) {
            const categorySet = this.getInternalIdSet(category);
            categorySet.superAdd(value);
          }
        });
      });
    }
    return this;
  }

  /**
   * Delete value with this id from specified categories.
   * If the value does not exist in any category it will be removed from the CategorizedIdSet
   */
  override delete(ids: OneOrMore<Id>, categories?: OneOrMore<Category>) {
    let deleted = false;
    oneOrMoreForEach(ids, id => {
      const categoriesBelongedTo = this.idInCategorySet.get(id);
      if (categoriesBelongedTo) {
        const removeFromCategories = categories ?? this.idInCategorySet.get(id);
        if (removeFromCategories !== undefined) {
          oneOrMoreForEach(removeFromCategories, category => {
            this.deleteIdFromCategory(id, category);
            categoriesBelongedTo.delete(category);
            deleted = true;
          });
        }
        if (categoriesBelongedTo.size === 0) {
          this.idInCategorySet.delete(id);
          super.delete(id);
        }
      }
    });
    return deleted;
  }

  /**
   * Remove the id from the category.
   * If the category is empty and not observed, delete it to prevent garbage.
   */
  protected deleteIdFromCategory(id: Id, category: Category) {
    const categorySet = this.categorySets.get(category);
    if (categorySet) {
      categorySet.superDelete(id);
      // this cleanup can create all kinds of problems with non ReadonlyIdSet categories
      // so we comment it out for now, 
      //
      // TODO: create a ReadonlyIdSet version so we can provide cleanup for unused empty categories

      // if (categorySet.size === 0 && !categorySet.observed) {
      //   this.categorySets.delete(category);
      // }
    }
  }

  /**
   * Replace the contents of the _CategorizedIdSet_ with the specified _values_ and _categoriesBelongedTo_.
   * 
   * if _categoriesBelongedTo_ does is _undefined_, the _CategorizedIdSet_ will be cleared.
   */
  override replace(values: OneOrMore<IdValue | [IdValue, Iterable<Category>]>, cloneValues = false) {
    const newIds = new Set<Id>();
    // add new values
    for (const value of oneOrMoreToIterable(values)) {
      if (Array.isArray(value)) {
        const newValue = cloneValues ? structuredClone(value[0]) : value[0];
        const categories = value[1];
        this.replaceCategories(newValue, categories);
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
   * Export the contents of the _CategorizedIdSet_ in a format that the constructor and replace
   * method understand.
   */
  *export(): IterableIterator<[IdValue, Iterable<Category>]> {
    for (const [id, value] of this.idMap) {
      const categories = this.idInCategorySet.get(id) as Iterable<Category>;
      yield [value, categories];
    }
  }

  /**
   * Replace the categories the values belong to with the specified categories.
   */
  replaceCategories(values: OneOrMore<IdValue>, categories?: OneOrMore<Category>) {
    if (categories) {
      this.add(values, categories);
      const newCategoriesBelongedTo = new Set(oneOrMoreToIterable(categories));
      oneOrMoreForEach(values, value => {
        const categoriesBelongedTo = this.getCategoriesBelongedTo(value.id);
        for (const currentCategory of categoriesBelongedTo) {
          if (!newCategoriesBelongedTo.has(currentCategory)) {
            this.deleteIdFromCategory(value.id, currentCategory);
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
   * Completes all subscriptions of this CategorizedIdSet and all category IdSets
   */
  override complete() {
    this.categorySets.forEach(categorySet => categorySet.complete());
    super.complete();
  }

  /**
   * Return a Set containing the categories the value with this id is member of
   */
  categoriesBelongedTo(id: Id): ReadonlySet<Category> | undefined {
    return this.idMap.has(id) ? this.getCategoriesBelongedTo(id) : undefined;
  }

  protected getCategoriesBelongedTo(id: Id) {
    let result = this.idInCategorySet.get(id);
    if (result === undefined) {
      result = new Set();
      this.idInCategorySet.set(id, result);
    }
    return result;
  }

  /**
   * Returns the internal IdSetCategory belonging to the specified category.
   * Creates it if it does not exist.
   * 
   * The internal IdSetCategory has extra methods and properties that may only be used
   * from within this class.
   */
  private getInternalIdSet(category: Category) {
    let categorySet = this.categorySets.get(category);
    if (categorySet === undefined) {
      categorySet = new IdSetCategory(category, this);
      this.categorySets.set(category, categorySet);
    }
    return categorySet;
  }

  /**
   * Returns the internal IdSetCategory sets belonging to the specified categories.
   * Creates them if they do not exist.
   * 
   * The internal IdSetCategory has extra methods and properties that may only be used
   * from within this class.
   */
  private getInternalIdSets(categories: Iterable<Category>) {
    const categorySets = [];
    for (const category of categories) {
      categorySets.push(this.getInternalIdSet(category));
    }
    return categorySets;
  }

  /**
   * Clear specified categories, if no category is specified all categories are cleared.
   * 
   * If a value no longer exists in any category it will also be removed from the CategorizedIdSet.
   */
  override clear(categories?: OneOrMore<Category>) {
    categories = categories ?? this.categories.keys();
    const categoriesToClear = oneOrMoreToIterable(categories);
    for (const category of categoriesToClear) {
      const categorySet = this.getInternalIdSet(category);
      categorySet.delete(categorySet.keys());
    }
    return this;
  }

  /**
   * Uses the existing IdSet for the category if the category exists.
   * 
   * Creates a new empty IdSet for the category if the category does not exist.
   * 
   * Returns the IdSet containing values belonging to this category.
   */
  getIdSet(category: Category): IdSet<IdValue, Id> {
    return this.getInternalIdSet(category);
  }

  /**
   * Return a UnionIdSet that is the union of the specified categories
   */
  union(categories: Iterable<Category>) {
    return new UnionIdSet(this.getInternalIdSets(categories));
  }

  /**
   * Return an IntersectionIdSet that is the intersection of the specified categories
   */
  intersection(categories: Iterable<Category>) {
    return new IntersectionIdSet(this.getInternalIdSets(categories));
  }

  /**
   * Return a DifferenceIdSet that subtracts the other categories from the specified category
   */
  difference(category: Category, subtractedCategories: OneOrMore<Category>) {
    const subtractSets = this.getInternalIdSets(oneOrMoreToArray(subtractedCategories));
    return new DifferenceIdSet(this.getInternalIdSet(category), subtractSets);
  }

  /**
   * Return a DifferenceIdSet that returns a set containing the CategorizedSet minus the
   * subtracted categories
   */
  complement(subtractedCategories: OneOrMore<Category>) {
    const subtractSets = this.getInternalIdSets(oneOrMoreToArray(subtractedCategories));
    return new DifferenceIdSet(this, subtractSets);
  }
}

/**
 * IdSet for internal use only in CategorizedIdSet
 */
class IdSetCategory<IdValue extends IdObject<Id>, Id = string, Category = string> extends IdSet<IdValue, Id> {
  public override idMap = new Map<Id, IdValue>();
  public override createSubject$ = new Subject<IdValue>();
  public override updateSubject$ = new Subject<IdValue>();
  public override deleteSubject$ = new Subject<IdValue>();

  constructor(
    public readonly category: Category,
    private readonly categorizedIdSet: CategorizedIdSet<IdValue, Id, Category>
  ) {
    super();
  }

  // expose needed parent methods to CategorizedIdSet

  superAdd(values: OneOrMore<IdValue>) {
    return super.add(values);
  }

  superDelete(ids: OneOrMore<Id>) {
    return super.delete(ids);
  }

  // override methods to function inside a CategorizedIdSet

  override add(values: OneOrMore<IdValue>) {
    this.categorizedIdSet.add(values, this.category);
    return this;
  }

  override delete(ids: OneOrMore<Id>) {
    return this.categorizedIdSet.delete(ids, this.category);
  }

  override replace(values: OneOrMore<IdValue>) {
    const validIds = new Set(oneOrMoreToArray(values).map(value => value.id));
    this.add(values);
    for (const id of this.idMap.keys()) {
      if (!validIds.has(id)) {
        this.delete(id);
      }
    }
    return this;
  }

  override clear() {
    this.categorizedIdSet.clear(this.category);
    return this;
  }
}
