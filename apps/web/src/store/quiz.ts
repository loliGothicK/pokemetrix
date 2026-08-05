import { atom } from "jotai";
import type { QuizState, QuizQuestion } from "@/types/quiz";

export const initialQuizState: QuizState = {
  difficulty: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  status: "idle",
  unlockedQuestionIds: [],
  answeredCorrectlyIds: [],
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
  return state.answeredCorrectlyIds.length;
});

// Helper atom to get a list of playable/unlocked questions
export const unlockedQuestionsAtom = atom((get) => {
  const state = get(quizStateAtom);
  return state.questions.filter((q) => state.unlockedQuestionIds.includes(q.id));
});

// Action to submit an answer
export const submitAnswerAtom = atom(
  null,
  (get, set, payload: { questionId: string; answer: string }) => {
    const state = get(quizStateAtom);
    const question = state.questions.find((q) => q.id === payload.questionId);
    if (!question) return;

    const isCorrect = question.correctAnswer === payload.answer;
    const newAnswers = { ...state.answers, [payload.questionId]: payload.answer };

    let newAnsweredCorrectlyIds = [...state.answeredCorrectlyIds];
    if (isCorrect && !newAnsweredCorrectlyIds.includes(payload.questionId)) {
      newAnsweredCorrectlyIds.push(payload.questionId);
    }

    // Unlock logic: a question is unlocked if all its prerequisites are in newAnsweredCorrectlyIds
    // Initially, questions with 0 prerequisites are unlocked.
    const newUnlockedQuestionIds = state.questions
      .filter((q) => {
        if (!q.prerequisites || q.prerequisites.length === 0) return true;
        return q.prerequisites.every((prereqId) => newAnsweredCorrectlyIds.includes(prereqId));
      })
      .map((q) => q.id);

    set(quizStateAtom, {
      ...state,
      answers: newAnswers,
      answeredCorrectlyIds: newAnsweredCorrectlyIds,
      unlockedQuestionIds: newUnlockedQuestionIds,
    });
  },
);
