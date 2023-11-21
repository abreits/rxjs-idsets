import { Observable, OperatorFunction, map, mergeMap } from 'rxjs';
import { DeltaValue, IdObject } from '../types';

type DeltaFunction<IdValue extends IdObject<Id>, Id = string> = (idValue: IdValue) => void;

export function processDelta<IdValue extends IdObject<Id>, Id = string>(delta: DeltaValue<IdValue, Id>, processFunction: {
  create?: DeltaFunction<IdValue, Id>,
  update?: DeltaFunction<IdValue, Id>,
  delete?: DeltaFunction<IdValue, Id>,
}) {
  if (delta.create) {
    return processFunction.create?.(delta.create);
  } else if (delta.update) {
    return processFunction.update?.(delta.update);
  } else {
    // the delete property exists, only typescript is not that smart
    return processFunction.update?.(delta.delete as IdValue);
  }
}

type MapDeltaFunction<ResultType, IdValue extends IdObject<Id>, Id = string> = (idValue: IdValue) => ResultType;

export function mapDelta<ResultType, IdValue extends IdObject<Id>, Id = string>(processFunction: {
  create: MapDeltaFunction<ResultType, IdValue, Id>,
  update: MapDeltaFunction<ResultType, IdValue, Id>,
  delete: MapDeltaFunction<ResultType, IdValue, Id>,
}): OperatorFunction<DeltaValue<IdValue, Id>, ResultType> {
  return map((delta: DeltaValue<IdValue, Id>) => {
    if (delta.create) {
      return processFunction.create(delta.create);
    } else if (delta.update) {
      return processFunction.update(delta.update);
    } else {
      // the delete property exists, only typescript is not that smart
      return processFunction.update(delta.delete as IdValue);
    }
  });
}

type MergeMapDeltaFunction<ResultType, IdValue extends IdObject<Id>, Id = string> = (idValue: IdValue) => Observable<ResultType>;

export function mergeMapDelta<ResultType, IdValue extends IdObject<Id>, Id = string>(processFunction: {
  create: MergeMapDeltaFunction<ResultType, IdValue, Id>,
  update: MergeMapDeltaFunction<ResultType, IdValue, Id>,
  delete: MergeMapDeltaFunction<ResultType, IdValue, Id>,
}): OperatorFunction<DeltaValue<IdValue, Id>, ResultType> {
  return mergeMap((delta: DeltaValue<IdValue, Id>) => {
    if (delta.create) {
      return processFunction.create(delta.create);
    } else if (delta.update) {
      return processFunction.update(delta.update);
    } else {
      // the delete property exists, only typescript is not that smart
      return processFunction.update(delta.delete as IdValue);
    }
  });
}
