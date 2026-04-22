import type { Category, GroupId, Item, Question } from './types';

export type PoolEntry = { item: Item; category: Category };

export function questionableFieldNames(category: Category): string[] {
  return category.header.filter((f) => f.questionable).map((f) => f.name);
}

export function buildPool(
  categories: Category[],
  selectedCategoryNames: Set<string>,
  // When exactly one category is selected, callers may pass a set of group ids
  // to restrict the pool. `null` means "all groups".
  selectedGroupIds: Set<GroupId> | null,
): PoolEntry[] {
  const pool: PoolEntry[] = [];
  const restrictGroups = selectedCategoryNames.size === 1 && selectedGroupIds !== null;
  for (const cat of categories) {
    if (!selectedCategoryNames.has(cat.name)) continue;
    if (questionableFieldNames(cat).length === 0) continue;
    for (const group of cat.groups) {
      if (restrictGroups && !selectedGroupIds!.has(group.id)) continue;
      for (const item of group.items) {
        pool.push({ item, category: cat });
      }
    }
  }
  return pool;
}

export function pickQuestions(
  pool: PoolEntry[],
  n: number,
  fixedField: string | null,
): Question[] {
  const order = shuffledIndices(pool.length);
  const out: Question[] = [];
  for (const idx of order) {
    if (out.length >= n) break;
    const { item, category } = pool[idx];
    const fields = questionableFieldNames(category);
    if (fields.length === 0) continue; // defensive — pool excludes these
    let promptField: string;
    if (fixedField !== null) {
      if (!fields.includes(fixedField)) continue;
      promptField = fixedField;
    } else {
      promptField = fields[Math.floor(Math.random() * fields.length)];
    }
    out.push({ item, category, promptField });
  }
  return out;
}

function shuffledIndices(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
