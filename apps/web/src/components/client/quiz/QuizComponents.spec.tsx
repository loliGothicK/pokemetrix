import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuizStartScreen } from './QuizStartScreen';
import { QuizQuestionCard } from './QuizQuestionCard';
import { QuizResultScreen } from './QuizResultScreen';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Jotai
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jotai')>();
  return {
    ...actual,
    useAtom: vi.fn(),
    useSetAtom: vi.fn(),
    useAtomValue: vi.fn(),
  };
});

import { useAtom, useSetAtom } from 'jotai';
import { initialQuizState } from '../../../store/quiz';

describe('Quiz Components Snapshot Tests (Desktop Baseline)', () => {
  it('QuizStartScreen matches snapshot', () => {
    vi.mocked(useSetAtom).mockReturnValue(vi.fn());
    const { container } = render(<QuizStartScreen />);
    expect(container).toMatchSnapshot();
  });

  it('QuizQuestionCard matches snapshot', () => {
    vi.mocked(useSetAtom).mockReturnValue(vi.fn());
    
    // QuizQuestionCard calls useAtom(currentQuestionAtom) then useAtom(quizProgressAtom)
    vi.mocked(useAtom)
      .mockReturnValueOnce([{
        id: '1',
        difficulty: 'basics',
        format: 'choices',
        questionTextKey: 'test.question',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanationTextKey: 'test.explanation',
      }, vi.fn()])
      .mockReturnValueOnce([{ current: 1, total: 10 }, vi.fn()]);
    
    const { container } = render(<QuizQuestionCard />);
    expect(container).toMatchSnapshot();
  });

  it('QuizResultScreen matches snapshot', () => {
    vi.mocked(useSetAtom).mockReturnValue(vi.fn());
    
    // We can mock useAtom to return different values sequentially or based on order.
    // QuizResultScreen calls useAtom(quizScoreAtom) then useAtom(quizStateAtom)
    vi.mocked(useAtom)
      .mockReturnValueOnce([10, vi.fn()]) // score
      .mockReturnValueOnce([{ ...initialQuizState, difficulty: 'basics', questions: Array(10).fill({}) }, vi.fn()]); // state
    
    const { container } = render(<QuizResultScreen />);
    expect(container).toMatchSnapshot();
  });
});
