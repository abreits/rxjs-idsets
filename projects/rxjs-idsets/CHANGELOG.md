# Change Log

## 4.0.0
- changed names of some properties to make them more uniform
- Refactor of `UnionIdSet`, `IntersectionIdSet` and `DifferenceIdSet`
- made `pause()` and `resume()` method public
- added `add()` and `resume()` method to `UnionIdSet`, `IntersectionIdSet` and `DifferenceIdSet` 
to change the sets they operate upon while active.
- added `replace()` method to `DifferenceIdSet` to change the sourceIdSet while active
- added a config structure with options to the IdSet, UnionIdSet, IntersectionIdSet and DifferenceIdSet constructor
  - `filter` when present contains a function that returs true if an `IdObject` value should be added to the result set
  - `transform` when present contains a method that returns the transformed `IdObject` value. 
- updated README
- updated @angular build environment to 19.2.14

## 3.0.0
- All IdObject values returned from the IdSet are now readonly to further promote immutability
- Fixed resume() bug for async resumes
- Updated README
- updated @angular build environment to 17.1.0

## 2.0.0
  and help to detect modifications of existing set elements
- added pause() and resume() for pausing and resuming Observable updates
- renamed ReadonlyIdSet to BaseIdSet to better reflect its purpose
- small fixes and optimizations

## 1.1.0
- added 'delta' support
  - added DeltaValue type so you can track all IdSet changes (create, update and delete) with one observable
  - added delta$ and allDelta$ DeltaValue Observables to all IdSets
  - added mapDelta and mergMapDelta DeltaValue operators
  - added processDelta DeltaValue utility function

## 1.0.3
- added cloneValues optional parameter to the IdSet replace method

## 1.0.2
- added cloneValues optional parameter to the ReadonlyIdSet constructor
- updated README.md

## 1.0.1
- Fixed example in README.md for ContainerIdSet (forgot to update after refactor)
- Fixed tsconfig.json local rxjs-idsets link (forgot to change to new name)
- Removed TODO: from 1.0.0 in this CHANGELOG.md (forgot to remove)

## 1.0.0
- Initial public version
