# rxjs-idsets <!-- omit in toc -->

If you like to work with [Typescript](), [RxJS](https://rxjs.dev/) and whished you could observe changes to `Set` or `Map` like objects or classes, this library might be for you because that is exactly what it does.

## Set operations
It also provides 'live' union, intersection and difference set operations. I.e. if a source set of a set operation changes, the result of that set operation is updated automatically.

## Opinionated?
It requires values that implement an `IdObject` interface (which is simply an object with an `id` property, see the [introduction](#introduction) for more details).

It encourages the use of immutable objects as it only detects updates of existing values if the new value is a different object (the `id` is the same, but for the IdObject `newIdValue !== existingIdValue` is true).

Otherwise it provides all the functionality (and more) from Typescript Sets and adds several RxJS Observables to keep you informed of changes.

## Dependencies
Apart from Typescripts `tslib` there are no external dependencies.

# Table of contents <!-- omit in toc -->

- [Introduction](#introduction)
- [Examples](#examples)
  - [Example 1, IdSet](#example-1-idset)
  - [Example 2, UnionIdSet](#example-2-unionidset)
  - [Example 3, IntersectionIdSet](#example-3-intersectionidset)
  - [Example 4, DifferenceIdSet](#example-4-differenceidset)
  - [Example 5, ContainerIdSet](#example-5-containeridset)
- [Reference](#reference)
  - [BaseIdSet](#baseidset)
  - [IdSet](#idset)
  - [UnionIdSet](#unionidset)
  - [IntersectionIdSet](#intersectionidset)
  - [DifferenceIdSet](#differenceidset)
  - [ContainerIdSet](#containeridset)


# Introduction

This library provides a number of `IdSet` classes, which are _observable_ extensions of the javascript `Set` _object_.

The _values_ in an `IdSet` are objects that _implement_ the `IdObject` _interface_:

``` typescript
interface IdObject<Id = string> {
  id: Id
}
```

The uniqueness of a value in an IdSet is defined by the value of its id. It functions as a javascript `Map` where the _key_ is the `id` property of the _value_ (under water it actually is).

If you add an element to an IdSet with an id that already exists in the set, the existing value will be updated to the new value and the change to the IdSet will be published through the appropriate Observables.

This library provides the following `IdSet` classes:
- **`IdSet`** is the basic _observable_ `Set`
- **`UnionIdSet`** is a computed `IdSet` that perfoms the union set operation.
  It computes and automatically updates the union of multiple _source_ `IdSet`'s.
- **`IntersectionIdSet`** is a computed `IdSet` that performs the intersection set operation.
  It computes and automatically updates the intersection of multiple _source_ `IdSet`'s.
- **`SubtractionIdSet`** is a computed `IdSet` that performs the subtract set operation.
  It computes and automatically updates the subtraction of multiple _subtract_ `IdSet`'s from the _source_ `IdSet`.
- **`ContainerIdSet`** is an `IdSet` where you add _values_ to one or more _containers_. 
  You can add, remove and update _containers_ and _values_ independant of one another and be notified of changes.
  It is a powerful concept, see the [`ContainerIdSet` section](#containeridset) for more details. 
- **`ReadOnlyIdSet`** is a readonly version of the `IdSet`. It can be used as base class to create your own computed `IdSet`'s.

Changes to the above classes can be _observed_ with the following [RxJS](https://rxjs.dev/) Observable properties:
- **`all$`** returns all _values_ that are currently in the set.
- **`create$`** returns only the _**new** values_, values with an **id** that **does not already exist** in the set.
- **`update$`** returns only the _**changed** values_, values with an id that does exist in the set and is not a reference to to the existing value (needs to be `newvalue !== existingvalue`).
- **`delete$`** returns the _values_ that will be deleted from the set.

For convenience the following Observable properties are also provided:
- **`add$`** returns all _values_ that will be added (both _created_ and _updated_) to the set.
- **`allAdd$`** returns all _values_ currently in the set and then switches to `add$`.
- **`delta$`** returns a structure that can contain one or more _create_'d, _update_'d and/or _delete_'d _value_'s.

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

// subscribe to an observable that emits all values added to the set
exampleSet.add$.subscribe(value => console.log('created or updated', value));

// add a new value to the set
// where exampleSet already contains [value1, value2, value3]
exampleSet.add(value4);
// exampleset now contains [value1, value2, value3, value4]
// the exampleset.create$, .add$ and .allAdd$ observables publish value4
// the exampleset.delta$ and allDelta$ publish { create: value4 }

// update an existing value
exampleSet.add(value1update); 
// exampleset now contains [value1update, value2, value3, value4]
// the exampleset.update$, .add$ and .allAdd$ observables publish value1update
// the exampleset.delta$ and allDelta$ publish { update: value1update }

// delete a value from the set
exampleSet.delete(value1.id); 
// exampleset now contains [value2, value3, value4]
// the exampleset.delete$ observable publishes value1
// the exampleset.delta$ and .allDelta$ publish { delete: value1 }

// replace the contents of the set
exampleSet.replace([value1, value2update, value3]); 
// exampleset now contains [value1, value2update, value3]
// the exampleset.create$ observable publishes value1
// the exampleset.update$ observable publishes value2update
// the exampleset.add$ and .allAdd$ observables publish value1 and value2update
// the exampleset.delete$ observable publishes value4

// delete all content from the set
exampleSet.clear(); 
// exampleset now contains []
// the exampleset.delete$ observable publishes value1, value2update and value3

// close all subscritions to the set
exampleSet.complete();
// completes all existing and new subscriptions ('unsubscribes' them)
// all existing and new subscriptions will no longer receive added, updated or deleted values
exampleSet.pause();
// pauses all observable updates, 
// useful when batch processing multiple add, update and/ore delete actions
// automatically removes overlapping/multiple add remove and update actions on the same value
exampleset.resume();
// resumes publishing of observables, immediately publishes all paused updates
```
A more complete example for the IdSet can be found in [example1.ts](./examples/example1.ts)

## Example 2, UnionIdSet

The `UnionIdSet` is a computed IdSet that is the live representation of the mathematical union of two
or more IdSets. 
Updates in one of the source sets are immediately processed in the union set. The UnionIdSet observables publish the changes.

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
unionSet.add(set3);
unionSet.add([set3, set4]);
// adds extra sets to the unionSet
unionSet.delete(set1);
// removes sets from the unionSet
```

## Example 3, IntersectionIdSet

The `IntersectionIdSet` is a computed IdSet that is the live representation of the mathematical intersection of two or more IdSets. 
Updates in one of the source sets are immediately processed in the intersection set. The IntersectionIdSet observables publish the changes.
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
intersectionSet.add(set3);
intersectionSet.add([set3, set4]);
// adds extra sets to the intersectionSet
intersectionSet.delete(set1);
// removes sets from the intersectionSet
```

## Example 4, DifferenceIdSet

The `DifferenceIdSet` is a computed IdSet that is the live representation of the a source IdSet from which the elements contained in one or more other IdSets are subtracted. 
Updates in one of the sets are immediately processed in the difference set. The DifferenceIdSet observables publish the changes.
``` typescript
const sourceSet = new IdSet([value1, value2, value3])
const subtractSet1 = new IdSet([value1]);
const subtractSet2 = new IdSet([value2]);
const differenceSet = new DifferenceIdSet(sourceSet, [set1, set2]);
// differenceResultSet: [value3]
differenceSet.add(set3);
differenceSet.add([set3, set4]);
// adds extra subtract sets to the differenceSet
differenceSet.delete(set1);
// removes subtract sets from the differenceSet
differenceSet.replace(newSource);
// replaces the source set of the differenceSet with the newSource set

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

The `ContainerIdSet` is an IdSet that consists of named subsets

``` typescript
const container = new ContainerIdSet();

// add value1 to the IdSet 'set1', create the IdSet if it does not altready exist
container.add(value1, 'set1');

// create a new empty IdSet inside the container if a set with that name does not exist
const set2 = container.getSet('set2');
// if the set already contains values get the existing IdSet
const set1 = container.getSet('set1');

// you can add multiple values to multiple IdSets at once if you want to
container.add([value2, value3], ['set1', 'set2', 'set3']);
// container now contains [value1, value2 value3]
// set1 now contains [value1, value2, value3]
// set2 now contains [value2, value3]
// there is also a 'set3' in the container containing [value2, value3]

// add or replace value3 only in the specified IdSets
// remove from all other sets if it already exists there
container.addExclusive(value3, ['set2', 'set3']);
// container still contains [value1, value2 value3]
// set1 now contains [value1, value2]
// set2 now contains [value2, value3]
// there is now also a 'set3' in the container with [value3]

container.delete(value2.id, 'set2');
// set2 now contains [value3]

container.delete(value1.id);
// container now contains [value2 value3]
// set2 now contains []

container.setsBelongedTo(value3.id);
// should return a Set containing ['set1', 'set3']

// there are methods to create union, intersection and subtraction sets from sets
const unionIdSet = container.union(['set1', 'set2', 'set3']);
const intersectionIdSet = container.intersection(['set1', 'set2', 'set3']);
const differenceIdSet = container.difference('set1', ['set2', 'set3']);
const complementIdSet = container.complement(['set2', 'set3']);
// complement returns a differenceIdSet of the specified sets with the container
```


# Reference

The all important 'if all else fails, read the manual' command reference.

I have tried to make the `IdSets` as self explaining as possible from within an IDE
(VS Code in my case), but this reference might help.

This reference is a 'minimal' reference as in only Class specific properties and methods and overridden methods with changed or extended functionality will be described here, unchanged parent methods and properties will be described in the parent class only. 


## BaseIdSet

The `BaseIdSet` is not very useful in itself, but it contains all the basic functionality needed for the `IdSet` and other subclasses to function, it can be used as a base for your own custom IdSets.

It is an IdSet that is readonly. This means that it provides no way to change its contents by itself. when you create a subclass, you can use the `addValue` and `deleteId` protected methods to add and delete values and automatically publish relevant updates through the obserbvables. 

### Class specific public properties and methods

The methods and properties that define the basic functionality of the `IdSet` classes are described below.

#### `constructor(values?: Iterable<IdValue>, config?: IdSetConfig)`
``` typescript
type IdSetConfig<SourceIdValue, ResultIdValue=SourceIdValue> = {
  cloneValues?: boolean;
  filter?: (value: SourceIdValue, idSet: BaseIdSet) => boolean;
  transform?: (value: SourceIdValue, idSet: BaseIdSet) => ResultIdValue;
}
```

- Creates a new Set based the values given. If no values are supplied an empty Set is created
- config properties:
  - `cloneValues` when defined clones the values passed in `values` with `structuredClone()`
  - `filter` when defined filters out all IdValues that the filter function returns `false` to,
    the `idSet` parameter contains a reference to this idSet
  - `transform` when defined transforms the source IdValues and adds the transformed result to 
     the `IdSet`, it maintains the original id as identifier (even though it can be changed in the transformation), the `idSet` parameter contains a reference to this idSet
* It will deep clone the values using `structuredClone()` if `cloneValues` is true

#### `all$: Observable<IdValue>` 
- Observable that returns all values currently in the set one by one and then completes

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

#### `delta$(): Observable<Readonly<DeltaValue<IdValue>>>`
- observable that returns a `DeltaValue` structure. A `DeltaValue` structure combines one or more `create`, `update` and `delete` values.

#### `allDelta$(): Observable<Readonly<DeltaValue<IdValue>>>`
- observable that returns a `DeltaValue` structure. A `DeltaValue` structure combines one or more `create`, `update` and `delete` values. The first result contains all current values of the set in the `create` property of the `DeltaValue`.

#### `observed`
- `true` when the BaseIdSet is observed (subscribed to), `false` otherwise.

#### `pause()`
- Pauses all Observables in the set, modifications to the set when paused will be published
 after calling the `resume()` method.

#### `resume()`
- Resumes all Observables in the set, alle modifications to the set after calling `pause()`
 will be published after calling the `resume()` method. Later updates will be published immediately.

#### `complete()`
- Completes all Observables in the set, modifications to the set will no longer be propageted through these observables. Only the `all$` Observable will still function.

### Standard `Set` properties and methods
The methods and properties that are more or less identical to the default javascript `Set` class.
See below, no description apart from the type annotation is given.

#### `size: number`

#### `values(): IterableIterator<IdValue>` 

#### `forEach(fn: (...) => void)`

#### `get(key: Id): IdValue`

#### `has(key: Id): boolean`

#### `keys(): IterableIterator<Id>`

#### `entries(): IterableIterator<[Id, IdValue]>`

#### `[Symbol.iterator](): IterableIterator<IdValue>`

### protected methods

There are a few protected methods that can be used when creating your own IdSet subclass.

#### `protected addValue(value: IdValue)`
- Adds a single value to the set, updating observables when needed.

#### `protected deleteId(id: Id)`
- Deletes a single value from the set, updating observables when needed.

### `protected clear()`
- Clears all values from the set, updating observables when needed.

## IdSet
This is the basic 'bread and butter' class of the `IdSet` classes (that is why it is called `IdSet`).
It extends the [`BaseIdSet`](#baseidset).

See the [example1.ts](./examples/example1.ts) file for a complete example of the `IdSet`.

### Additional properties and methods
The `IdSet` class extends the `BaseIdClass` with the methods described below.

#### `add(values: OneOrMore<IdValue>)`
- Add one or more values to the set. 

#### `delete(ids: OneOrMore<Id>): boolean`
- Deletes one or more values from the set.

#### `replace(values: OneOrMore<IdValue>, cloneValues = false)`
- Replaces the existing set with the defined values.
- It will deep clone the values using `structuredClone()` if `cloneValues` is true.

#### `clear()`
- Removes all existing values from the set.
- Alle existing values are deleted on by one and each deleted value is published
to the corresponding Observables.

### `pause()`
- Pauses updating observables, but keeps track of all changes since paused.

### `resume()`
- Publishes the changes since paused to the observables and resumes updating observables.

## UnionIdSet
The `UnionIdSet` is a live union of the source IdSets defined in the constructor.
It extends the [`BaseIdSet`](#baseidset).

The `UnionIdSet` is a 'live' representation of that union. I.e. if the content of a source IdSet changes it automatically updates the content of the `UnionIdSet`, see the example below:
``` typescript
source1 = new IdSet([value1, value2]);
source2 = new IdSet([value2, value3]);
source3 = new IdSet([value3, value5]);
unionIdSet = new UnionIdSet([source1, source2]); //contains [value1, value2, value3]
source2.add(value4);
// unionIdSet now contains [value1, value2, value3, value4]
unionIdSet.add(source3);
// unionIdSet now contains [value1, value2, value3, value4, value5]
unionIdSet.delete(source1);
// unionIdSet now contains [value2, value3, value4, value5]
```

### Additional properties and methods

#### `constructor(sourceSets: Iterable<BaseIdSet>, config?: IdSetConfig)`
- Define the source `IdSets` the `UnionIdSet` operates upon at construction.

#### `add(idSets: OneOrMore<BaseIdSet<IdValue, Id>>)`
- Add IdSets to the union and update the result

#### `delete(idSets: OneOrMore<BaseIdSet<IdValue, Id>>)`
- Remove IdSets from the union and update the result

#### `readonly sourceSets: Iterable<BaseIdSet>`
- The sourceSets the `UnionIdSet` operates upon

#### `add(idSets: OneOrMore<BaseIdSet<IdValue, Id>>)`
- Add IdSets to the collection of sets tha define the `UnionIdSet`

#### `delete(idSets: OneOrMore<BaseIdSet<IdValue, Id>>)`
- Remove IdSets from collection of sets tha define the `UnionIdSet`


## IntersectionIdSet
The `IntersectionIdSet` is a live intersection of the source IdSets defined in the constructor.
It extends the [`BaseIdSet`](#baseidset).

The `IntersectionIdSet` is a 'live' representation of that intersection. I.e. if the content of a source IdSet changes it automatically updates the content of the `IntersectionIdSet`, see the example below:
``` typescript
source1 = new IdSet([value1, value2]);
source2 = new IdSet([value2, value3]);
intersectionIdSet = new IntersectionIdSet([source1, source2]); //contains [value2]
source2.add(value1);
// intersectionIdSet now contains [value1, value2]
```

### Additional properties and methods
#### `constructor(sourceSets: Iterable<BaseIdSet>, config?: IdSetConfig)`
- Define the source `IdSets` the `IntersectionIdSet` operates upon at construction.

#### `add(idSets: OneOrMore<BaseIdSet<IdValue, Id>>)`
- Add IdSets to the intersection and update the result

#### `delete(idSets: OneOrMore<BaseIdSet<IdValue, Id>>)`
- Remove IdSets from the intersection and update the result

#### `readonly sourceSets: Iterable<BaseIdSet>`
- The sourceSets the `IntersectionIdSet` operates upon

#### `add(idSets: OneOrMore<BaseIdSet<IdValue, Id>>)`
- Add IdSets to the collection of sets tha define the `IntersectionIdSet`

#### `delete(idSets: OneOrMore<BaseIdSet<IdValue, Id>>)`
- Remove IdSets from collection of sets tha define the `IntersectionIdSet`


## DifferenceIdSet
The `DifferenceIdSet` is the live difference between the source IdSet and other sets defined in the constructor.
It extends the [`BaseIdSet`](#baseidset).

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
#### `constructor(sourceSet: IdSet, otherSets: Iterable<BaseIdSet>, config?: IdSetConfig)`
- Define the source and other `IdSets` the `DifferenceIdSet` operates upon at construction.

#### `add(idSets: OneOrMore<BaseIdSet<IdValue, Id>>)`
- Add IdSets to subtract from the source IdSet and update the result

#### `delete(idSets: OneOrMore<BaseIdSet<IdValue, Id>>)`
- Remove IdSets from collection of sets to subtract from the source IdSet and update the result

#### `replace(sourceSet: IdSet)`
- Replace the source the `DifferenceIdSet` operates upon.

#### `readonly sourceSet: BaseIdSet`
- The sourceSet the `DifferenceIdSet` operates upon

#### `readonly othersets: Iterable<BaseIdSet>`
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
* It will deep clone the values using `structuredClone()` if `cloneValues` is true.

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

#### `createUnion(sets: Iterable<SetId>)`
- Return a UnionIdSet that is the union of the specified sets

#### `createIntersection(sets: Iterable<SetId>)`
- Return an IntersectionIdSet that is the intersection of the specified sets

#### `createDifference(category: SetId, subtractedCategories: OneOrMore<SetId>)`
- Return a DifferenceIdSet that subtracts the other sets from the specified category

#### `createComplement(subtractedCategories: OneOrMore<SetId>)`
- Return a ComplementIdSet that returns a set containing the CategorizedSet minus the
subtracted sets
