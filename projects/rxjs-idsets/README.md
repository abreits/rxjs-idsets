# rxjs-idsets <!-- omit in toc -->

If you like to work with [Typescript](), [RxJS](https://rxjs.dev/) and whished you could observe changes to `Set` or `Map` like objects or classes, this library might be worth a look for you.

It is more or less opinionated in that you need to work with values that implement an `IdObject` interface (see the [introduction](#introduction) for more details), and only updates existing values with the same `id` if they are different objects (`newIdValue !== existingIdValue`) but otherwise provides all the functionality (and more) from Typescript Sets and RxJS Observables to keep you informed of changes.

# Table of contents <!-- omit in toc -->

- [Introduction](#introduction)
- [Examples](#examples)
  - [Example 1, IdSet](#example-1-idset)
  - [Example 2, UnionIdSet](#example-2-unionidset)
  - [Example 3, IntersectionIdSet](#example-3-intersectionidset)
  - [Example 4, SubtractionIdSet](#example-4-subtractionidset)
  - [Example 5, CategorizedIdSet](#example-5-categorizedidset)
- [Reference](#reference)
  - [IdSet](#idset)
  - [UnionIdSet](#unionidset)
  - [IntersectionIdSet](#intersectionidset)
  - [SubtractionIdSet](#subtractionidset)
  - [CategorizedIdSet](#categorizedidset)
  
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
- **`CategorizedIdSet`** places its _values_ in one or more _categories_, it can change the
  _categories_ a value is member of and if a _value_ is no longer meber of a _category_ it is
  deleted from the `CategorizedIdSet`. 

Changes to the above classes can be _observed_ with the following [RxJS](https://rxjs.dev/) Observable properties:
- **`all$`** returns all _values_ that are currently in the set.
- **`add$`** returns all _values_ that will be added (both _created_ and _updated_) to the set.
- **`create$`** returns only the _**new** values_ that will be added and are not already in the set.
- **`update$`** returns only the _**changed** values_ will be added and are already in the set.
- **`delete$`** returns the _values_ that will be deleted from the set.

(`{id: Id}`, where Id defaults to a `string`). 

This library was created as a more 'pure' Observable version of my [rxjs-supersets](https://github.com/abreits/rxjs-supersets) library.

For the latest changes and the current version see the [Change log](./CHANGELOG.md).

# Examples

Nothing explains a library better than a few well documented examples, so here they come (hope they are indeed documented enough).

## Example 1, IdSet

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

## Example 4, SubtractionIdSet

``` typescript
const sourceSet = new IdSet([value1, value2, value3])
const subtractSet1 = new IdSet([value1]);
const subtractSet2 = new IdSet([value2]);
const subtractionResultSet = new SubtractionIdSet([set1, set2]);
// subtractionResultSet: [value3]

// subscribe to create$
subtractionResultSet.create$.subscribe(value => console.log('created new', value));

subtractionResultSet.add(value4);
// subtractionResultSet: [value3, value4] because value4 is not present in one of the subtractSets
subtractSet1.add(value4);
// subtractionResultSet: [value3] because value4 is now present in one of the subtractSets
subtractSet1.delete(value1);
// subtractionResultSet: [value1, value3] because value1 is no longer present in one of the subtractSets
```

## Example 5, CategorizedIdSet

``` typescript
// TODO!
```


# Reference

The all important 'if all else fails, read the manual' command reference.

## IdSet

TODO!

## UnionIdSet

TODO!

## IntersectionIdSet

TODO!

## SubtractionIdSet

TODO!

## CategorizedIdSet

TODO!
