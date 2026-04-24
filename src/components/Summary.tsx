import { useEffect } from 'react';
import type { Question } from '../types';
import { shuffleQuestions } from '../quiz';

type Props = {
  questions: Question[];
  categoryNames: string[];
  shuffle: boolean;
  onShuffleChange: (value: boolean) => void;
  onRestart: () => void;
  onRepeat: (questions: Question[]) => void;
};

export function Summary({ questions, categoryNames, shuffle, onShuffleChange, onRestart, onRepeat }: Props) {

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Enter') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      e.preventDefault();
      onRestart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRestart]);

  return (
    <div className="screen summary">
      <h1>Done</h1>
      <p>
        Questions asked: <strong>{questions.length}</strong>
      </p>
      <p>
        Categories: <strong>{categoryNames.join(', ')}</strong>
      </p>
      <label>
        <input
          type="checkbox"
          checked={shuffle}
          onChange={(e) => onShuffleChange(e.target.checked)}
        />
        {' '}Shuffle words
      </label>
      <button
        type="button"
        className="primary"
        onClick={() => onRepeat(shuffle ? shuffleQuestions(questions) : questions)}
      >
        Repeat Test
      </button>
      <button type="button" className="green" onClick={onRestart}>
        Main Menu
      </button>
    </div>
  );
}
