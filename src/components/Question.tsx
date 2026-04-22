import { useEffect, useState } from 'react';
import type { Question } from '../types';

type Props = {
  question: Question;
  index: number;
  total: number;
  isLast: boolean;
  onNext: () => void;
  onFinish: () => void;
};

export function QuestionScreen({ question, index, total, isLast, onNext, onFinish }: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ' && e.key !== 'Enter') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      e.preventDefault();
      if (revealed) onNext();
      else setRevealed(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, onNext]);

  const promptValue = question.item[question.promptField] ?? '';
  const otherFields = question.category.header.filter(
    (f) => f.name !== question.promptField,
  );
  const progressPct = ((index + 1) / total) * 100;

  return (
    <>
      <div className="screen question">
        <div className="question-body">
          <div className="progress">
            <span>
              Question {index + 1} / {total}
            </span>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div className="prompt">
            <span className="field-name">{question.promptField}</span>
            <span className="field-value">{promptValue}</span>
          </div>
          <ul className="answer">
            {otherFields.map((f) => (
              <li key={f.name}>
                <span className="field-name">{f.name}:</span>{' '}
                {revealed && (
                  <span className="field-value">{question.item[f.name] ?? ''}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="question-footer">
        <div className="question-footer-inner">
          {!isLast && (
            <button type="button" className="finish" onClick={onFinish}>
              Finish
            </button>
          )}
          {!revealed ? (
            <button type="button" className="primary" onClick={() => setRevealed(true)}>
              Show Answer
            </button>
          ) : (
            <button type="button" className="primary" onClick={onNext}>
              {isLast ? 'Finish' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
