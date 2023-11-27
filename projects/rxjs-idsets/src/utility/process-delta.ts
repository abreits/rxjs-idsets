import { EMPTY, Observable, map, merge, mergeMap } from 'rxjs';
import { DeltaValue, IdObject } from '../types';
import { oneOrMoreForEach, oneOrMoreMap } from './one-or-more';


type DeltaFunction<IdValue extends IdObject<Id>, Id = string> = (idValue: IdValue) => void;
/**
 * Process the create, update and/or delete values of the delta
 */
export function processDelta<IdValue extends IdObject<Id>, Id = string>(delta: DeltaValue<IdValue>, processFunction: {
  create?: DeltaFunction<IdValue, Id>,
  update?: DeltaFunction<IdValue, Id>,
  delete?: DeltaFunction<IdValue, Id>,
}): void {
  if (delta.create && processFunction.create) {
    oneOrMoreForEach(delta.create, processFunction.create);
  }
  if (delta.update && processFunction.update) {
    oneOrMoreForEach(delta.update, processFunction.update);
  }
  if (delta.delete && processFunction.delete) {
    oneOrMoreForEach(delta.delete, processFunction.delete);
  }
}

type MapDeltaFunction<ResultType, IdValue extends IdObject<Id>, Id = string> = (idValue: IdValue) => ResultType;
/**
 * RxJS operator that processes all create, update and delete values of the delta with the same function and passes the resulting delta on
 */
export function mapDelta<ResultType, IdValue extends IdObject<Id>, Id = string>(processFunction: MapDeltaFunction<ResultType, IdValue, Id>) {
  return map((delta: DeltaValue<IdValue>) => {
    const result: DeltaValue<ResultType> = {};
    if (delta.create) {
      result.create = oneOrMoreMap(delta.create, processFunction);
    }
    if (delta.update) {
      result.update = oneOrMoreMap(delta.update, processFunction);
    }
    if (delta.delete) {
      result.delete = oneOrMoreMap(delta.delete, processFunction);
    }
    return result;
  });
}


type MergeMapDeltaFunction<ResultType, IdValue extends IdObject<Id>, Id = string> = (idValue: IdValue) => Observable<ResultType>;
/**
 * RxJS operator that processes the create, update and/or delete values of the delta and passes the result(s) on as individual observable values
 */
export function mergeMapDelta<ResultType, IdValue extends IdObject<Id>, Id = string>(processFunction: {
  create?: MergeMapDeltaFunction<ResultType, IdValue, Id>,
  update?: MergeMapDeltaFunction<ResultType, IdValue, Id>,
  delete?: MergeMapDeltaFunction<ResultType, IdValue, Id>,
}) {
  return mergeMap((delta: DeltaValue<IdValue>) => {
    let results: Observable<ResultType>[] = [];
    if (delta.create && processFunction.create) {
      results = results.concat(oneOrMoreMap(delta.create, processFunction.create));
    }
    if (delta.update && processFunction.update) {
      results = results.concat(oneOrMoreMap(delta.update, processFunction.update));
    }
    if (delta.delete && processFunction.delete) {
      results = results.concat(oneOrMoreMap(delta.delete, processFunction.delete));
    }
    if (results.length === 0) {
      return EMPTY;
    } else {
      return merge(...results);
    }
  });
}
