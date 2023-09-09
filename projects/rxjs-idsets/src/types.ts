export interface IdObject<Id = string> {
  id: Id
}

export interface CategoryIds<Category = string, Id = string> {
  category: Category;
  ids: Iterable<Id>;
}
