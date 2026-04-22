export type FieldDef = {
  name: string;
  questionable: boolean;
};

export type Item = Record<string, string>;

export type GroupId = string | number;

export type Group = {
  id: GroupId;
  items: Item[];
};

export type Category = {
  name: string;
  header: FieldDef[];
  groups: Group[];
};

export type Vocabulary = Category[];

export type Question = {
  item: Item;
  category: Category;
  promptField: string;
};
