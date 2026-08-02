export type QuizDifficulty = 'basics' | 'advanced' | 'expert' | 'master';

export type QuizQuestionFormat = 'choices' | 'input';

export interface QuizQuestion {
  id: string;
  difficulty: QuizDifficulty;
  format: QuizQuestionFormat;
  questionTextKey: string;
  questionParams?: Record<string, string | number>;
  options?: string[]; // Used if format === 'choices'
  correctAnswer: string;
  explanationTextKey: string;
  explanationParams?: Record<string, string | number>;
}

export interface QuizState {
  difficulty: QuizDifficulty | null;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: string[]; // User's answers
  status: 'idle' | 'playing' | 'finished';
}
