import type { GroupId } from './types';

const KEY_DEFAULT_N = 'vocab.defaultN';
const KEY_SELECTED_CATEGORIES = 'vocab.selectedCategories';
const KEY_FIXED_FIELD_BY_CAT = 'vocab.fixedFieldByCategory';
const KEY_GROUPS_BY_CAT = 'vocab.selectedGroupsByCategory';

const FALLBACK_DEFAULT_N = 10;

export function getDefaultN(): number {
  const raw = readLocalStorage(KEY_DEFAULT_N);
  if (raw === null) return FALLBACK_DEFAULT_N;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : FALLBACK_DEFAULT_N;
}

export function setDefaultN(n: number): void {
  writeLocalStorage(KEY_DEFAULT_N, String(n));
}

export function getSelectedCategories(): string[] {
  const raw = readLocalStorage(KEY_SELECTED_CATEGORIES);
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function setSelectedCategories(names: string[]): void {
  writeLocalStorage(KEY_SELECTED_CATEGORIES, JSON.stringify(names));
}

export function getFixedField(categoryName: string): string {
  const map = readJsonRecord(KEY_FIXED_FIELD_BY_CAT);
  const v = map[categoryName];
  return typeof v === 'string' ? v : '';
}

export function setFixedField(categoryName: string, field: string): void {
  const map = readJsonRecord(KEY_FIXED_FIELD_BY_CAT);
  if (field) {
    map[categoryName] = field;
  } else {
    delete map[categoryName];
  }
  writeLocalStorage(KEY_FIXED_FIELD_BY_CAT, JSON.stringify(map));
}

// `null` means "all groups" — the default — and is stored as an absent entry.
export function getSelectedGroupIds(categoryName: string): GroupId[] | null {
  const map = readJsonRecord(KEY_GROUPS_BY_CAT);
  const v = map[categoryName];
  if (!Array.isArray(v)) return null;
  return v.filter((x): x is GroupId => typeof x === 'string' || typeof x === 'number');
}

export function setSelectedGroupIds(
  categoryName: string,
  ids: GroupId[] | null,
): void {
  const map = readJsonRecord(KEY_GROUPS_BY_CAT);
  if (ids === null) {
    delete map[categoryName];
  } else {
    map[categoryName] = ids;
  }
  writeLocalStorage(KEY_GROUPS_BY_CAT, JSON.stringify(map));
}

function readJsonRecord(key: string): Record<string, unknown> {
  const raw = readLocalStorage(key);
  if (raw === null) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

// localStorage can throw in private-browsing modes or when disabled. Persistence
// is a nice-to-have, so swallow failures silently.
function readLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
