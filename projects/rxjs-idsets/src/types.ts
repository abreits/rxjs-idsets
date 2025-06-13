import { Observable } from 'rxjs';
import { OneOrMore } from './utility/one-or-more';

export interface IdObject<Id = string> {
  id: Id;
}

export type DeltaValue<T = IdObject> = {
  create?: OneOrMore<T>;
  update?: OneOrMore<T>;
  delete?: OneOrMore<T>;
};

export type DeltaProperty = keyof DeltaValue;

export type DeltaFunction<IdValue extends IdObject<Id>, Id = string> = (
  idValue: IdValue
) => void;

export type DeltaProcessor<IdValue extends IdObject<Id>, Id = string> = {
  create?: DeltaFunction<IdValue, Id>;
  update?: DeltaFunction<IdValue, Id>;
  delete?: DeltaFunction<IdValue, Id>;
};

export type MapDeltaFunction<
  ResultType,
  IdValue extends IdObject<Id>,
  Id = string
> = (idValue: IdValue) => ResultType;

export type MergeMapDeltaFunction<
  ResultType,
  IdValue extends IdObject<Id>,
  Id = string
> = (idValue: IdValue) => Observable<ResultType>;

export type MergeMapDeltaProcessor<
  ResultType,
  IdValue extends IdObject<Id>,
  Id = string
> = {
  create?: MergeMapDeltaFunction<ResultType, IdValue, Id>;
  update?: MergeMapDeltaFunction<ResultType, IdValue, Id>;
  delete?: MergeMapDeltaFunction<ResultType, IdValue, Id>;
};

export type IdSetConfig<IdValue, SourceIdValue=IdValue> = {
  cloneValues?: boolean;
  filter?: (value: SourceIdValue) => boolean;
  transform?: (value: SourceIdValue) => IdValue;
};
