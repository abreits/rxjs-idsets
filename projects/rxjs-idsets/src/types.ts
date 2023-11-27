import { OneOrMore } from './utility/one-or-more';

export interface IdObject<Id = string> {
  id: Id
}

export type DeltaValue<T> = {
  create?: OneOrMore<T>;
  update?: OneOrMore<T>;
  delete?: OneOrMore<T>;
}
