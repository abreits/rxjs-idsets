# Change Log

## 3.0.0
- All IdObject values returned from the IdSet are now readonly to further promote immutability
- Updated README
- Fixed resume bug for async resumes

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
