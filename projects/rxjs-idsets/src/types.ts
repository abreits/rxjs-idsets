export interface IdObject<Id = string> {
  id: Id
}

// DeltaValue must have exactly one of the create, update or delete properties, commented code does not work (yet?)
// export type DeltaValue<IdValue extends IdObject<Id>, Id = string> = {
//   create: IdValue;
// } | {
//   update: IdValue;
// } | {
//   delete: IdValue;
// }
// adding optional properties works (kind of) for now
export type DeltaValue<IdValue extends IdObject<Id>, Id = string> = {
  create: IdValue;
  update?: IdValue;
  delete?: IdValue;
} | {
  create?: IdValue;
  update: IdValue;
  delete?: IdValue;
} | {
  create?: IdValue;
  update?: IdValue;
  delete: IdValue;
}
