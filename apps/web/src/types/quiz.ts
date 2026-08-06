export type QuizDifficulty = "basics" | "advanced" | "expert" | "master";

export type QuizCategory = "academic" | "damage_calc" | "tsume" | "speed_compare";
export type QuizQuestionFormat =
  | "choices"
  | "multi_select"
  | "ordering"
  | "grouping"
  | "one_way"
  | "input"
  | "tsume_action";

export interface TsumePokemon {
  species: string;
  hpCurrent?: number;
  hpMax?: number;
  stats?: { spe?: number };
  moves?: string[];
  item?: string;
  ability?: string;
  status?: string;
  volatiles?: string[];
}

export interface TsumeSide {
  active: TsumePokemon[];
  bench?: TsumePokemon[];
}

export interface TsumeData {
  playerSide: TsumeSide;
  opponentSide: TsumeSide;
  field?: { weather?: string; terrain?: string; trickRoom?: boolean };
  correctMoves: string[]; // List of valid winning moves for this turn
}

export interface QuizQuestion {
  id: string;
  difficulty: QuizDifficulty;
  category: QuizCategory;
  format: QuizQuestionFormat;
  question: string;
  options?: string[]; // Used if format !== 'input'
  correctAnswer?: string; // for choices, one_way, input
  correctAnswers?: string[]; // for multi_select
  correctOrder?: string[]; // for ordering
  correctGroups?: Record<string, string[]>; // for grouping
  prerequisites?: string[]; // Array of question IDs that must be answered correctly before this question is unlocked
  content?: string; // Raw markdown text (for display)
  mdx?: string; // Compiled MDX bundle (for rendering)
  locale?: string;

  // For practical (damage_calc) questions
  practicalData?: {
    attacker: { species: string; evs: string; item: string; nature: string; boosts?: string };
    defender: { species: string; evs: string; item: string; nature: string; hpPercent?: number };
    ally?: { species: string; item?: string };
    opponentAlly?: { species: string; item?: string };
    move: string;
    field?: { weather?: string; terrain?: string };
  };

  // For tsume (checkmate) questions
  // For tsume (checkmate) questions
  tsumeData?: TsumeData;

  // For speed comparison questions
  speedCompareData?: {
    pokemonA: string;
    pokemonB: string;
    context: string;
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
