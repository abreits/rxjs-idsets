import { map } from 'rxjs';
import { IdObject, DeltaValue, MapDeltaFunction } from '../types';
import { oneOrMoreMap } from '../utility/one-or-more';

/**
 * RxJS operator that processes all create, update and delete values of the delta 
 * with the same function and passes the resulting delta on.
 */
export function mapDelta<ResultType, IdValue extends IdObject<Id>, Id = string>(
  processFunction: MapDeltaFunction<ResultType, IdValue, Id>
) {
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