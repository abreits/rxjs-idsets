# Change Log

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
