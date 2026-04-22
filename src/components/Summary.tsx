import { useEffect } from 'react';

type Props = {
  questionCount: number;
  categoryNames: string[];
  onRestart: () => void;
};

export function Summary({ questionCount, categoryNames, onRestart }: Props) {
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
        Questions asked: <strong>{questionCount}</strong>
      </p>
      <p>
        Categories: <strong>{categoryNames.join(', ')}</strong>
      </p>
      <button type="button" className="primary" onClick={onRestart}>
        Start Again
      </button>
    </div>
  );
}
