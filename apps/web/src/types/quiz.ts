export type QuizDifficulty = "basics" | "advanced" | "expert" | "master";

export type QuizCategory = "academic" | "damage_calc" | "tsume";
export type QuizQuestionFormat = "choices" | "input";

export interface QuizQuestion {
  id: string;
  difficulty: QuizDifficulty;
  category: QuizCategory;
  format: QuizQuestionFormat;
  question: string;
  options?: string[]; // Used if format === 'choices'
  correctAnswer: string;
  prerequisites?: string[]; // Array of question IDs that must be answered correctly before this question is unlocked
  mdx?: string; // MDX content from content-collections
  locale?: string;

  // For practical (damage_calc) questions
  practicalData?: {
    attacker: { species: string; evs: string; item: string; nature: string; boosts?: string };
    defender: { species: string; evs: string; item: string; nature: string; hpPercent?: number };
    move: string;
    field?: { weather?: string; terrain?: string };
  };

  // For tsume (checkmate) questions
  tsumeData?: {
    playerActive: {
      species: string;
      hpCurrent: number;
      hpMax: number;
      moves: string[];
      item: string;
      status?: string;
    };
    opponentActive: { species: string; hpCurrent: number; hpMax: number; status?: string };
    playerParty?: { species: string; hpCurrent: number; hpMax: number; status?: string }[];
    field?: { weather?: string; terrain?: string; trickRoom?: boolean };
    correctMoves: string[]; // List of valid winning moves for this turn
  };
}

export interface QuizState {
  difficulty: QuizDifficulty | null;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, string>; // Question ID to answer string
  status: "idle" | "playing" | "finished";
  unlockedQuestionIds: string[]; // IDs of questions the user is allowed to play
  answeredCorrectlyIds: string[]; // IDs of questions the user answered correctly
}
