import { QuizQuestion, QuizDifficulty } from '../types/quiz';
import championsPokemonData from '../../data/champions/pokemon.json';

const POKEMON_LIST = championsPokemonData.data;

// Utility to get random elements from an array
function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate a random basics question
function generateBasicsQuestion(id: string): QuizQuestion {
  const [p1, p2] = getRandomElements(POKEMON_LIST, 2);
  const hp1 = p1.status[0];
  const hp2 = p2.status[0];
  const isP1 = hp1 >= hp2;
  const correct = isP1 ? p1.identifier : p2.identifier;
  const incorrect = isP1 ? p2.identifier : p1.identifier;
  
  return {
    id,
    difficulty: 'basics',
    format: 'choices',
    questionTextKey: 'quiz.questions.higher_hp',
    questionParams: { p1: p1.identifier, p2: p2.identifier },
    options: [p1.identifier, p2.identifier].sort(() => 0.5 - Math.random()),
    correctAnswer: correct,
    explanationTextKey: 'quiz.explanations.higher_hp',
    explanationParams: {
      correct: correct,
      incorrect: incorrect,
      correctVal: isP1 ? hp1 : hp2,
      incorrectVal: isP1 ? hp2 : hp1
    }
  };
}

// Generate advanced question (Speed comparison)
function generateAdvancedQuestion(id: string): QuizQuestion {
  const [p1, p2] = getRandomElements(POKEMON_LIST, 2);
  const spe1 = p1.status[5];
  const spe2 = p2.status[5];
  const isP1 = spe1 >= spe2;
  const correct = isP1 ? p1.identifier : p2.identifier;
  const incorrect = isP1 ? p2.identifier : p1.identifier;

  return {
    id,
    difficulty: 'advanced',
    format: 'choices',
    questionTextKey: 'quiz.questions.higher_spe',
    questionParams: { p1: p1.identifier, p2: p2.identifier },
    options: [p1.identifier, p2.identifier].sort(() => 0.5 - Math.random()),
    correctAnswer: correct,
    explanationTextKey: 'quiz.explanations.higher_spe',
    explanationParams: {
      correct: correct,
      incorrect: incorrect,
      correctVal: isP1 ? spe1 : spe2,
      incorrectVal: isP1 ? spe2 : spe1
    }
  };
}

// Generate expert question (Total stats comparison)
function generateExpertQuestion(id: string): QuizQuestion {
  const [p1, p2, p3, p4] = getRandomElements(POKEMON_LIST, 4);
  const getBst = (p: any) => p.status.reduce((a: number, b: number) => a + b, 0);
  const pool = [p1, p2, p3, p4];
  pool.sort((a, b) => getBst(b) - getBst(a));
  
  const correct = pool[0];
  
  return {
    id,
    difficulty: 'expert',
    format: 'choices',
    questionTextKey: 'quiz.questions.highest_bst',
    questionParams: {},
    options: pool.map(p => p.identifier).sort(() => 0.5 - Math.random()),
    correctAnswer: correct.identifier,
    explanationTextKey: 'quiz.explanations.highest_bst',
    explanationParams: {
      correct: correct.identifier,
      correctVal: getBst(correct)
    }
  };
}

// Generate master question (Placeholder for now, same as Expert but input based or more complex)
function generateMasterQuestion(id: string): QuizQuestion {
  const [p1, p2, p3, p4] = getRandomElements(POKEMON_LIST, 4);
  const getBst = (p: any) => p.status.reduce((a: number, b: number) => a + b, 0);
  const pool = [p1, p2, p3, p4];
  pool.sort((a, b) => getBst(b) - getBst(a));
  
  const correct = pool[0];
  
  return {
    id,
    difficulty: 'master',
    format: 'choices',
    questionTextKey: 'quiz.questions.highest_bst',
    questionParams: {},
    options: pool.map(p => p.identifier).sort(() => 0.5 - Math.random()),
    correctAnswer: correct.identifier,
    explanationTextKey: 'quiz.explanations.highest_bst',
    explanationParams: {
      correct: correct.identifier,
      correctVal: getBst(correct)
    }
  };
}

export function generateQuiz(difficulty: QuizDifficulty, count: number = 10): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const id = `q_${Date.now()}_${i}`;
    if (difficulty === 'basics') {
      questions.push(generateBasicsQuestion(id));
    } else if (difficulty === 'advanced') {
      questions.push(generateAdvancedQuestion(id));
    } else if (difficulty === 'expert') {
      questions.push(generateExpertQuestion(id));
    } else {
      questions.push(generateMasterQuestion(id));
    }
  }
  return questions;
}
