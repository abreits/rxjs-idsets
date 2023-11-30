import { DeltaProcessor, DeltaValue, IdObject } from '../types';
import { oneOrMoreForEach } from './one-or-more';

/**
 * Process the create, update and/or delete values of the delta
 */
export function processDelta<IdValue extends IdObject<Id>, Id = string>(
  delta: DeltaValue<IdValue>,
  processFunction: DeltaProcessor<IdValue, Id>
): void {
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
