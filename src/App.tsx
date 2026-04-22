import { useState } from 'react';
import vocabularyData from './data/vocabulary.json';
import type { Category, Question } from './types';
import { Settings } from './components/Settings';
import { QuestionScreen } from './components/Question';
import { Summary } from './components/Summary';
import { getSelectedCategories } from './storage';

const vocabulary = vocabularyData as Category[];

type Screen =
  | { kind: 'settings' }
  | { kind: 'question'; questions: Question[]; index: number; categoryNames: string[] }
  | { kind: 'summary'; questionCount: number; categoryNames: string[] };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'settings' });
  const [lastSelected, setLastSelected] = useState<string[]>(() => {
    const valid = new Set(vocabulary.map((c) => c.name));
    return getSelectedCategories().filter((n) => valid.has(n));
  });

  if (screen.kind === 'settings') {
    return (
      <Settings
        vocabulary={vocabulary}
        initialSelected={lastSelected}
        onStart={(questions, categoryNames) => {
          setLastSelected(categoryNames);
          setScreen({ kind: 'question', questions, index: 0, categoryNames });
        }}
      />
    );
  }

  if (screen.kind === 'question') {
    const { questions, index, categoryNames } = screen;
    const isLast = index === questions.length - 1;
    return (
      <QuestionScreen
        // Remount on advance so the reveal state resets without an effect.
        key={index}
        question={questions[index]}
        index={index}
        total={questions.length}
        isLast={isLast}
        onNext={() => {
          if (isLast) {
            setScreen({
              kind: 'summary',
              questionCount: questions.length,
              categoryNames,
            });
          } else {
            setScreen({ kind: 'question', questions, index: index + 1, categoryNames });
          }
        }}
        onFinish={() => {
          setScreen({
            kind: 'summary',
            questionCount: index + 1,
            categoryNames,
          });
        }}
      />
    );
  }

  return (
    <Summary
      questionCount={screen.questionCount}
      categoryNames={screen.categoryNames}
      onRestart={() => setScreen({ kind: 'settings' })}
    />
  );
}
