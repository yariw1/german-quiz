import { useEffect, useMemo, useState } from 'react';
import type { Category, GroupId, Question } from '../types';
import { buildPool, pickQuestions, questionableFieldNames } from '../quiz';
import {
  getDefaultN,
  getFixedField,
  getSelectedGroupIds,
  setDefaultN as saveDefaultN,
  setFixedField as saveFixedField,
  setSelectedCategories as saveSelectedCategories,
  setSelectedGroupIds as saveSelectedGroupIds,
} from '../storage';

function restoreFixedField(category: Category): string {
  const saved = getFixedField(category.name);
  if (!saved) return '';
  return questionableFieldNames(category).includes(saved) ? saved : '';
}

function restoreGroupIds(category: Category): Set<GroupId> | null {
  const saved = getSelectedGroupIds(category.name);
  if (saved === null) return null;
  const validIds = new Set<GroupId>(category.groups.map((g) => g.id));
  const filtered = saved.filter((id) => validIds.has(id));
  if (filtered.length === 0 || filtered.length === validIds.size) return null;
  return new Set(filtered);
}

type Props = {
  vocabulary: Category[];
  initialSelected: string[];
  onStart: (questions: Question[], categoryNames: string[]) => void;
};

export function Settings({ vocabulary, initialSelected, onStart }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));
  const [n, setN] = useState<number>(() => getDefaultN());
  const [defaultN, setStateDefaultN] = useState<number>(() => getDefaultN());
  const onlyOneCategory = selected.size === 1;
  const singleCategory = useMemo<Category | null>(() => {
    if (!onlyOneCategory) return null;
    const name = [...selected][0];
    return vocabulary.find((c) => c.name === name) ?? null;
  }, [selected, vocabulary, onlyOneCategory]);

  // '' means random; restore from storage when a single category is active on mount.
  const [fixedField, setFixedField] = useState<string>(() =>
    singleCategory ? restoreFixedField(singleCategory) : '',
  );
  // null means "all groups"; otherwise an explicit subset.
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<GroupId> | null>(() =>
    singleCategory ? restoreGroupIds(singleCategory) : null,
  );

  // Restore (or reset) per-category controls when the single-category context changes.
  useEffect(() => {
    if (!singleCategory) {
      setFixedField('');
      setSelectedGroupIds(null);
      return;
    }
    setFixedField(restoreFixedField(singleCategory));
    setSelectedGroupIds(restoreGroupIds(singleCategory));
    // Only the single-category identity matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleCategory?.name]);

  const pool = useMemo(
    () => buildPool(vocabulary, selected, singleCategory ? selectedGroupIds : null),
    [vocabulary, selected, singleCategory, selectedGroupIds],
  );

  const poolSize = pool.length;
  const tooMany = n > poolSize;

  useEffect(() => {
    if (poolSize > 0) setN((prev) => (prev > poolSize ? poolSize : prev));
  }, [poolSize]);
  const startDisabled = selected.size === 0 || n < 1 || poolSize === 0 || tooMany;

  const toggleCategory = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(vocabulary.map((c) => c.name)));
  const clearAll = () => setSelected(new Set());

  const toggleGroup = (id: GroupId) => {
    if (!singleCategory) return;
    const allIds = singleCategory.groups.map((g) => g.id);
    const current =
      selectedGroupIds === null ? new Set<GroupId>(allIds) : new Set<GroupId>(selectedGroupIds);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    setSelectedGroupIds(current.size === allIds.length ? null : current);
  };

  const handleSetDefault = () => {
    if (n < 1) return;
    saveDefaultN(n);
    setStateDefaultN(n);
  };

  const handleStart = () => {
    if (startDisabled) return;
    const questions = pickQuestions(pool, n, fixedField || null);
    if (questions.length < n) return; // defensive — pool guarantees enough
    const categoryNames = [...selected];
    saveSelectedCategories(categoryNames);
    if (singleCategory) {
      saveFixedField(singleCategory.name, fixedField);
      saveSelectedGroupIds(
        singleCategory.name,
        selectedGroupIds === null ? null : [...selectedGroupIds],
      );
    }
    onStart(questions, categoryNames);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Enter') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (startDisabled) return;
      e.preventDefault();
      handleStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startDisabled, handleStart]);

  return (
    <div className="screen settings">
      <h1>Vocabulary Drill</h1>

      <section>
        <div className="section-header">
          <h2>Categories</h2>
          <div className="shortcuts">
            <button type="button" onClick={selectAll}>
              Select all
            </button>
            <button type="button" onClick={clearAll}>
              Clear all
            </button>
          </div>
        </div>
        <ul className="category-list">
          {vocabulary.map((cat) => {
            const totalItems = cat.groups.reduce((sum, g) => sum + g.items.length, 0);
            return (
              <li key={cat.name}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.has(cat.name)}
                    onChange={() => toggleCategory(cat.name)}
                  />
                  <span>{cat.name}</span>
                  <span className="muted"> ({totalItems} items)</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {singleCategory && questionableFieldNames(singleCategory).length > 1 && (
        <section>
          <h2>Question field</h2>
          <select value={fixedField} onChange={(e) => setFixedField(e.target.value)}>
            <option value="">(random)</option>
            {questionableFieldNames(singleCategory).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </section>
      )}

      {singleCategory && singleCategory.groups.length > 1 && (
        <section>
          <h2>Groups</h2>
          <ul className="group-list">
            {singleCategory.groups.map((g) => {
              const checked = selectedGroupIds === null || selectedGroupIds.has(g.id);
              return (
                <li key={String(g.id)}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleGroup(g.id)}
                    />
                    <span>{String(g.id)}</span>
                    <span className="muted"> ({g.items.length} items)</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="run-controls">
        <label className="n-control">
          <span>Number of questions:</span>
          <input
            type="number"
            min={1}
            value={n}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setN(Number.isFinite(v) ? v : 0);
            }}
          />
        </label>
        <button
          type="button"
          onClick={handleSetDefault}
          disabled={n < 1 || n === defaultN}
          title={n === defaultN ? 'Already the default' : 'Save as default'}
        >
          Set as default
        </button>
        <button
          type="button"
          onClick={() => setN(poolSize)}
          disabled={poolSize === 0 || n === poolSize}
          title="Use the full current pool"
        >
          Max ({poolSize})
        </button>
        <span className="muted">Pool: {poolSize} item{poolSize === 1 ? '' : 's'}</span>
      </section>

      {tooMany && (
        <p className="error">
          Only {poolSize} item{poolSize === 1 ? '' : 's'} available —
          {poolSize === 0 ? ' ' : ' reduce the question count or '}
          select more categories/groups.
        </p>
      )}
      {selected.size > 0 && poolSize === 0 && !tooMany && (
        <p className="error">No items in the current selection.</p>
      )}

      <button
        type="button"
        className="primary"
        onClick={handleStart}
        disabled={startDisabled}
      >
        Start Test
      </button>
    </div>
  );
}
