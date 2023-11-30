import { Observable, mergeMap, EMPTY, merge } from 'rxjs';

import { IdObject, DeltaValue, MergeMapDeltaProcessor } from '../types';
import { oneOrMoreMap } from '../utility/one-or-more';


/**
 * RxJS operator that processes the create, update and/or delete values of the delta and passes the result(s) on as individual observable values
 */
export function mergeMapDelta<ResultType, IdValue extends IdObject<Id>, Id = string>(
  processFunction: MergeMapDeltaProcessor<ResultType, IdValue, Id>
) {
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