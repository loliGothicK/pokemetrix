import { atom } from 'jotai';
import type { QuizState, QuizQuestion } from '../types/quiz';

export const initialQuizState: QuizState = {
  difficulty: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  status: 'idle',
};

export const quizStateAtom = atom<QuizState>(initialQuizState);

// Derived atoms for convenience
export const currentQuestionAtom = atom<QuizQuestion | null>((get) => {
  const state = get(quizStateAtom);
  if (state.questions.length === 0) return null;
  return state.questions[state.currentQuestionIndex] || null;
});

export const quizProgressAtom = atom((get) => {
  const state = get(quizStateAtom);
  return {
    current: state.currentQuestionIndex + 1,
    total: state.questions.length,
  };
});

export const quizScoreAtom = atom((get) => {
  const state = get(quizStateAtom);
  let score = 0;
  for (let i = 0; i < state.questions.length; i++) {
    if (state.answers[i] === state.questions[i]?.correctAnswer) {
      score++;
    }
  }
  return score;
});
