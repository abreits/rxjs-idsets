# rxjs-idsets <!-- omit in toc -->

If you like to work with [Typescript](), [RxJS](https://rxjs.dev/) and whished you could observe changes to `Set` or `Map` like objects or classes, this library might be worth a look for you.

It is more or less opinionated in that you need to work with values that implement an `IdObject` interface (see the [introduction](#introduction) for more details), and only updates existing values with the same `id` if they are different objects (`newIdValue !== existingIdValue`) but otherwise provides all the functionality (and more) from Typescript Sets and RxJS Observables to keep you informed of changes.

# Table of contents <!-- omit in toc -->

- [Introduction](#introduction)
- [Examples](#examples)
  - [Example 1, IdSet](#example-1-idset)
  - [Example 2, UnionIdSet](#example-2-unionidset)
  - [Example 3, IntersectionIdSet](#example-3-intersectionidset)
  - [Example 4, DifferenceIdSet](#example-4-differenceidset)
  - [Example 5, ContainerIdSet](#example-5-containeridset)
- [Reference](#reference)
  - [ReadOnlyIdSet](#readonlyidset)
  - [IdSet](#idset)
  - [UnionIdSet](#unionidset)
  - [IntersectionIdSet](#intersectionidset)
  - [DifferenceIdSet](#differenceidset)
  - [ContainerIdSet](#containeridset)
  
# Introduction

This library provides a number of `IdSet` classes, which are _observable_ extensions of the javascript `Set` _object_.

The `Set` _values_ they work on are objects that _implement_ the `IdObject` _interface_:

``` typescript
interface IdObject<Id = string> {
  id: Id
}
```
This library provides the following `IdSet` classes:
- **`IdSet`** is the basic _observable_ `Set`
- **`ReadOnlyIdSet`** is an _observable_ `ReadonlySet` version of the `IdSet`
- **`UnionIdSet`** is an _observable_ `ReadonlySet` _subclass_ that provides the mathematical union
  of multiple _source_ `IdSet`'s and keeps it automatically up to date if the contents of the
  _sources_ change.
- **`IntersectionIdSet`** is an _observable_ `ReadonlySet` _subclass_ that provides the
  mathematical intersection of multiple _source_ `IdSet`'s and keeps it automatically up to date if the contents of the _sources_ change.
- **`SubtractionIdSet`** is an _observable_ `ReadonlySet` _subclass_ that provides the mathematical
  subtraction of multiple _subtract_ `IdSet`'s from the _source_ `IdSet` and keeps it automatically up to date if the contents of the _source_ or the _subtracts_ change.
- **`ContainerIdSet`** places its _values_ in one or more _sets_, it can change the
  _sets_ a value is member of and if a _value_ is no longer meber of a _category_ it is
  deleted from the `ContainerIdSet`. 

Changes to the above classes can be _observed_ with the following [RxJS](https://rxjs.dev/) Observable properties:
- **`all$`** returns all _values_ that are currently in the set.
- **`add$`** returns all _values_ that will be added (both _created_ and _updated_) to the set.
- **`create$`** returns only the _**new** values_, values with an **id** that **does not already exist** in the set.
- **`update$`** returns only the _**changed** values_, values with an id that does exist in the set and is not a reference to to the existing value (needs to be `newvalue !== existingvalue`).
- **`delete$`** returns the _values_ that will be deleted from the set.

This library was created as a more 'pure' Observable version of my [rxjs-supersets](https://github.com/abreits/rxjs-supersets) library.

For the latest changes and the current version see the [Change log](./CHANGELOG.md).

# Examples

Nothing explains a library better than a few well documented examples, so here they come (I hope the examples are indeed documented enough).

The included examples are basic examples on how to use the `IdSet` classes, a more elaborate 'real life' example is planned for the future.

## Example 1, IdSet

The `IdSet` is the basic class this library is built upon, it provides all normal Typescript Set operations

``` typescript
// create a new set containing 3 values, values implement IdObject interface
const exampleSet = new IdSet([value1, value2, value3]);

// subscribe to add$
exampleSet.all$.subscribe(value => console.log('created or updated', value));

// start: [value1, value2, value3]
exampleSet.add(value4);
// result: [value1, value2, value3, value4]
exampleSet.add(value1update); 
// result: [value1update, value2, value3, value4]
exampleSet.delete(value1.id); 
// result: [value2, value3, value4]
exampleSet.replace([value1, value2update, value3]); 
// result: [value1, value2update, value3]
exampleSet.clear(); 
// result: []
exampleSet.complete();
// all subscriptions are closed, no updates will be published any more
```
A more complete example for the IdSet can be found in [example1.ts](./examples/example1.ts)

## Example 2, UnionIdSet

``` typescript
const set1 = new IdSet([value1, value2]);
const set2 = new IdSet([value2, value3]);
const unionSet = new UnionIdSet([set1, set2]);
// unionSet: [value1, value2, value3]

// subscribe to allAdd$
unionSet.allAdd$.subscribe(value => console.log('already present, created or updated', value));

set1.add(value4);
// unionSet: [value1, value2, value3, value4] value4 added to the union
set1.delete(value2);
// unionSet: [value1, value2, value3, value4] because value2 is still in set2
set1.delete(value1);
// unionSet: [value2, value3, value4] because value1 is not in another union source it is deleted
```

## Example 3, IntersectionIdSet

``` typescript
const set1 = new IdSet([value1, value2]);
const set2 = new IdSet([value2, value3]);
const intersectionSet = new IntersectionIdSet([set1, set2]);
// unionSet: [value2]

// subscribe to delete$
intersectionSet.delete$.subscribe(value => console.log('deleted', value));

set1.add(value4);
// intersectionSet: [value2] value4 is not in all sources, so not added to the intersection
set1.delete(value1);
// intersectionSet: [value2] because value3 was not in the intersection
set1.add(value3);
// intersectionSet: [value2, value3] because value3 is now in all intersection sources
```

## Example 4, DifferenceIdSet

``` typescript
const sourceSet = new IdSet([value1, value2, value3])
const subtractSet1 = new IdSet([value1]);
const subtractSet2 = new IdSet([value2]);
const differenceResultSet = new DifferenceIdSet([set1, set2]);
// differenceResultSet: [value3]

// subscribe to create$
differenceResultSet.create$.subscribe(value => console.log('created new', value));

differenceResultSet.add(value4);
// differenceResultSet: [value3, value4] because value4 is not present in one of the subtractSets
subtractSet1.add(value4);
// differenceResultSet: [value3] because value4 is now present in one of the subtractSets
subtractSet1.delete(value1);
// differenceResultSet: [value1, value3] because value1 is no longer present in one of the subtractSets
```

## Example 5, ContainerIdSet

``` typescript
const categorizedSet = new ContainerIdSet();

// add value1 to the set in category1
categorizedSet.add(value1, 'category1');

// get a new empty category set
const category2Set = categorizedSet.getIdSet('category2');
// if the category already contains values get the existing category set
const category1Set = categorizedSet.getIdSet('category1');

// you can add multiple values to multiple sets at once if you want to
categorizedSet.add([value2, value3], ['category1', 'category2', 'category3']);
// categorizedSet now contains [value1, value2 value3]
// category1Set now contains [value1, value2, value3]
// category2Set now contains [value2, value3]
// there is also a 'category3' in the categorizedSet containing [value2, value3]

categorizedSet.replaceCategories(value3, ['category2', 'category3']);
// categorizedSet still contains [value1, value2 value3]
// category1Set now contains [value1, value2]
// category2Set now contains [value2, value3]
// there is also a 'category3' in the categorizedSet containing [value2, value3]

categorizedSet.delete(value2.id, 'category2');
// category2Set now contains [value3]

categorizedSet.delete(value1.id);
// categorizedSet now contains [value2 value3]
// category2Set now contains []

categorizedSet.setsBelongedTo(value3.id);
// should return a Set containing ['category1', 'category3']

// there are methods to create union, intersection and subtraction sets from sets
const unionIdSet = categorizedSet.union(['category1', 'category2', 'category3']);
const intersectionIdSet = categorizedSet.intersection(['category1', 'category2', 'category3']);
const differenceIdSet = categorizedSet.difference('category1', ['category2', 'category3']);
const complementIdSet = categorizedSet.complement(['category2', 'category3']);
// complement returns a differenceIdSet of the specified sets with the categorizedSet
```


# Reference

The all important 'if all else fails, read the manual' command reference.

I have tried to make the `IdSets` as self explaining as possible from within an IDE
(VS Code in my case), but this reference might help.

This reference is a 'minimal' reference as in only Class specific properties and methods and overridden methods with changed or extended functionality will be described here, unchanged parent methods and properties will be described in the parent class only. 


## ReadOnlyIdSet

The `ReadOnlyIdSet` is not very useful in itself, but it contains all the basic functionality needed for the `IdSet` and other subclasses to function.

It is an IdSet that, as the name implies is readonly. This means that it provides no way to change its contents by itself.

### Class specific properties and methods

The methods and properties that define the basic functionality of the `IdSet` classes are described below.

#### `constructor(values?: Iterable<IdValue>)`
- Creates a new Set based the values given. If no values are supplied an empty Set is created.

#### `all$: Observable<IdValue>` 
- Observable that returns all values currently in the set one by one and then completes.

#### `create$: Observable<IdValue>`
- If a new value is added to the Set, this Observable returns that value
(placeholder to be used by subclasses). 

#### `update$: Observable<IdValue>`
- If an existing value is updated in the set, this Observable returns that value
(placeholder to be used by subclasses). 

#### `delete$: Observable<IdValue>`
- If a value is deleted from the set, this Observable returns that value
(placeholder to be used by subclasses).

#### `add$: Observable<IdValue>`
- If a value is added to the set (created or updated), this Observable returns that value
(placeholder to be used by subclasses). 

#### `allAdd$: Observable<IdValue>`
- Observable that returns all values currently in the set one by one and hands it over to the `add$`.
- Useful observable when you need to monitor all additions from the beginnig of the Set, 
but you start when the Set is already populated with values.

#### `complete()`
- Completes all Observables in the set, modifications to the set will no longer be propageted through these observables. Only the `all$` Observable will still function.

### Basic `Set` properties and methods
The methods and properties thatare identical to the default `Set` classes are given below. No description apart from the type annotation is given.

#### `size: number`

#### `values(): IterableIterator<IdValue>` 

#### `forEach(fn: (...) => void)`

#### `get(key: Id): IdValue`

#### `has(key: Id): boolean`

#### `keys(): IterableIterator<Id>`

#### `entries(): IterableIterator<[Id, IdValue]>`

#### `[Symbol.iterator](): IterableIterator<IdValue>`


## IdSet
This is the basic 'bread and butter' class of the `IdSet` classes (that is why it is called `IdSet`).
It extends the [`ReadonlyIdSet`](#readonlyidset).

See the [example1.ts](./examples/example1.ts) file for a complete example of the `IdSet`.

### Additional properties and methods
The `IdSet` class extends the `ReadonlyIdClass` with the methods described below.

#### `add(values: OneOrMore<IdValue>)`
- Add one or more values to the set. 
- If it is a new value (value with specified `id` does not exist in the Set) the value is published to the `create$`, `add$` and `allAdd$` Observables.
- If it is an updated value (value with the specified `id` exists and does not refer to the same Object: `newValue !== existingValue`) the value is published to the `update$`, `add$` and `allAdd$` Observables.

#### `delete(ids: OneOrMore<Id>): boolean`
- Deletes one or more values from the set.
- If a value with the specified `id` exists, it is deleted from the set and the deleted value is published
to the `delete$` Observable.

#### `replace(values: OneOrMore<IdValue>)`
- Replaces the existing set with the defined values.
- If a new value does not exist, it is added and the value is published to the `create$`, `add$` and `allAdd$` Observables.
- If a value already exists, but is updated, it is replaced and the value is published to the `update$`, `add$` and `allAdd$` Observables.
- If an original value no longer exists, it is deleted and the deleted value is published
to the `delete$` Observable.

#### `clear()`
- Removes all existing values from the set.
- Alle existing values are deleted on by one and each deleted value is published
to the `delete$` Observable.


## UnionIdSet
The `UnionIdSet` is a live union of the source IdSets defined in the constructor.
It extends the [`ReadonlyIdSet`](#readonlyidset).

The `UnionIdSet` is a 'live' representation of that union. I.e. if the content of a source IdSet changes it automatically updates the content of the `UnionIdSet`, see the example below:
``` typescript
source1 = new IdSet([value1, value2]);
source2 = new IdSet([value2, value3]);
unionIdSet = new UnionIdSet([source1, source2]); //contains [value1, value2, value3]
source2.add(value4);
// unionIdSet now contains [value1, value2, value3, value4]
```

### Additional properties and methods

#### `constructor(sourceSets: Iterable<ReadonlyIdSet>)`
- Define the source `IdSets` the `UnionIdSet` operates upon at construction.

#### `readonly sourceSets: Iterable<ReadonlyIdSet>`
- The sourceSets the `UnionIdSet` operates upon


## IntersectionIdSet
The `IntersectionIdSet` is a live intersection of the source IdSets defined in the constructor.
It extends the [`ReadonlyIdSet`](#readonlyidset).

The `IntersectionIdSet` is a 'live' representation of that intersection. I.e. if the content of a source IdSet changes it automatically updates the content of the `IntersectionIdSet`, see the example below:
``` typescript
source1 = new IdSet([value1, value2]);
source2 = new IdSet([value2, value3]);
intersectionIdSet = new IntersectionIdSet([source1, source2]); //contains [value2]
source2.add(value1);
// intersectionIdSet now contains [value1, value2]
```

### Additional properties and methods
#### `constructor(sourceSets: Iterable<ReadonlyIdSet>)`
- Define the source `IdSets` the `IntersectionIdSet` operates upon at construction.

#### `readonly sourceSets: Iterable<ReadonlyIdSet>`
- The sourceSets the `IntersectionIdSet` operates upon


## DifferenceIdSet
The `DifferenceIdSet` is the live difference between the source IdSet and other sets defined in the constructor.
It extends the [`ReadonlyIdSet`](#readonlyidset).

The `DifferenceIdSet` is a 'live' representation of that difference. I.e. if the content of a source or other IdSet changes it automatically updates the content of the `DifferenceIdSet`, see the example below:
``` typescript
source = new IdSet([value1, value2, value3, value4]);
other1 = new IdSet([value3]);
other2 = new IdSet([value3, value4]);
intersectionIdSet = new DifferenceIdSet(source, [other1, other2]); //contains [value1, value2]
other1.add(value1);
// DifferenceIdSet now contains [value2]
```

### Additional properties and methods
#### `constructor(sourceSet: IdSet, otherSets: Iterable<ReadonlyIdSet>)`
- Define the source and other `IdSets` the `DifferenceIdSet` operates upon at construction.

#### `readonly sourceSet: ReadonlyIdSet`
- The sourceSet the `DifferenceIdSet` operates upon

#### `readonly othersets: Iterable<ReadonlyIdSet>`
- The otherSets the `DifferenceIdSet` operates upon


## ContainerIdSet
A `ContainerIdSet` consists of one or more `IdSets` identified by a `SetId`.
The `ContainerIdSet` itself is also an `IdSet` where the values are the union of all the sets it contains.
It extends the [`IdSet`](#idset).

It can `add`, `delete`, ` replace` values etc. and subscribe to changes with the `create$`, `delete$` etc.
Observables.
A value in a `ContainerIdSet` only exists if the value is alse present in one or more of its contained
sets.

A few lines of example code:
``` typescript
const container = new ContainerIdSet();
container.add([value1, value2], 'set1');
container.add(value3, ['set2', 'set3']);

const set1 = container.getSet('set1');
set1.delete(value2.id);

set1.allAdd$.subscribe(value => console.log(`Added to set2: ${value}`));
```

### Additional and overridden properties and methods

#### `constructor(values?: OneOrMore<[IdValue, Iterable<SetId>]>, cloneValues = false)`
* You can use the `export()` method to create values for the constructor to duplicate an existing 
`ContainerIdSet`.
* It will deep clone the values given if `cloneValues` is true.

#### `sets: ReadonlyMap<SetId, IdSet>`
- A Map containing all SetIds with their corresponding IdSet.

#### `add(values: OneOrMore<IdValue>, setIds?: OneOrMore<SetId>)`
- Add one or more values to the specified sets.

#### `delete(ids: OneOrMore<Id>, setIds?: OneOrMore<SetId>)`
* Delete values, specified by their Id from the specified sets.
* If no sets are specified, they are removed from all sets in the `ContainerIdSet`.
* If a value no longer belongs to any set in the `ContainerIdSet` 
it will also be removed from the `ContainerIdSet`.

#### `replace(values: OneOrMore<[IdValue, Iterable<SetId>]>, cloneValues = false)`
* Replace the contents of the `ContainerIdSet` with the specified _values_.
* If no values are specified the `ContainerIdSet` and all its existing sets will be cleared.

#### `export(): IterableIterator<[IdValue, Iterable<SetId>]>`
* Export the contents of the `ContainerIdSet` in a format that the `constructor` and `replace`
method understand.
  
#### `addExclusive(values: OneOrMore<IdValue>, sets?: OneOrMore<SetId>)`
* Add the values only to the specified sets, remove from all other sets.

#### `complete()`
* Completes all subscriptions of this `ContainerIdSet` and all category IdSets

#### `setsBelongedTo(id: Id): ReadonlySet<SetId> | undefined`
* Return a `Set` containing the SetIds for the IdSets the value with this id is member of
or undefined if it is not member of any contained set.

#### `clear(sets?: OneOrMore<SetId>)`
* Clear specified sets, if no set is specified all contained sets are cleared.
* If a value no longer exists in any set it will also be removed from the `ContainerIdSet`.

#### `detachSet(setIds: OneOrMore<SetId>)`
* Remove a contained set from the collection of sets.
* Remove all values that are not present in another contained set from the `ContainerIdSet`

#### `getSet(setId: SetId): IdSet`
* Uses the existing IdSet for the SetId if the set exists.
* Creates a new empty IdSet for the SetId if the set does not exist.
* Returns the IdSet of the specified SetId.

#### `union(sets: Iterable<SetId>)`
- Return a UnionIdSet that is the union of the specified sets

#### `intersection(sets: Iterable<SetId>)`
- Return an IntersectionIdSet that is the intersection of the specified sets

#### `difference(category: SetId, subtractedCategories: OneOrMore<SetId>)`
- Return a DifferenceIdSet that subtracts the other sets from the specified category

#### `complement(subtractedCategories: OneOrMore<SetId>)`
- Return a DifferenceIdSet that returns a set containing the CategorizedSet minus the
subtracted sets
