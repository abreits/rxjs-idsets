import { Subject } from 'rxjs';

import { IdSet } from '../public-api';
import { IdObject } from '../types';
import { OneOrMore, oneOrMoreToArray } from '../utility/one-or-more';

import { ContainerIdSet } from './container-id-set';

/**
 * IdSet for internal use only in CategorizedIdSet
 */
export class InnerIdSet<IdValue extends IdObject<Id>, Id = string, SetId = string> extends IdSet<IdValue, Id> {
  public override idMap = new Map<Id, IdValue>();
  public override createSubject$ = new Subject<IdValue>();
  public override updateSubject$ = new Subject<IdValue>();
  public override deleteSubject$ = new Subject<IdValue>();

  constructor(
    public readonly setId: SetId,
    private container?: ContainerIdSet<IdValue, Id, SetId>
  ) {
    super();
  }

  /**
   * detach the set from the ContainerIdSet
   */
  detach() {
    this.container = undefined;
  }

  // expose needed parent methods to ContainerIdSet

  superAdd(values: OneOrMore<IdValue>) {
    return super.add(values);
  }

  superDelete(ids: OneOrMore<Id>) {
    return super.delete(ids);
  }

  // override methods to function inside an ContainerIdSet

  override add(values: OneOrMore<IdValue>) {
    if (this.container) {
      this.container.add(values, this.setId);
    } else {
      super.add(values);
    }
    return this;
  }

  override delete(ids: OneOrMore<Id>) {
    if (this.container) {
      return this.container.delete(ids, this.setId);
    } else {
      return super.delete(ids);
    }
  }

  override replace(values: OneOrMore<IdValue>) {
    if (this.container) {
      const validIds = new Set(oneOrMoreToArray(values).map(value => value.id));
      this.add(values);
      for (const id of this.idMap.keys()) {
        if (!validIds.has(id)) {
          this.delete(id);
        }
      }
    } else {
      super.replace(values);
    }
    return this;
  }

  override clear() {
    if (this.container) {
      this.container.clear(this.setId);
    } else {
      super.clear();
    }
    return this;
  }
}
