'use client';

import { Button, Stack, Typography, Card, CardContent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSetAtom } from 'jotai';
import { quizStateAtom } from '../../../store/quiz';
import { generateQuiz } from '../../../lib/quiz-generator';
import type { QuizDifficulty } from '../../../types/quiz';

export function QuizStartScreen() {
  const { t } = useTranslation();
  const setQuizState = useSetAtom(quizStateAtom);

  const startQuiz = (difficulty: QuizDifficulty) => {
    const questions = generateQuiz(difficulty, 10);
    setQuizState({
      difficulty,
      questions,
      currentQuestionIndex: 0,
      answers: [],
      status: 'playing',
    });
  };

  return (
    <Card elevation={3} sx={{ maxWidth: 600, mx: 'auto', mt: { xs: 0, sm: 4 }, borderRadius: 3 }}>
      <CardContent sx={{ textAlign: 'center', py: { xs: 1, sm: 6 } }}>
        <Typography variant="h3" gutterBottom sx={{
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #ff5252, #ff4081)',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3
        }}>
          {t('quiz.title', 'Pokémon Battle Proficiency Test')}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('quiz.ui.choose_difficulty')}
        </Typography>

        <Stack spacing={2} direction="column" sx={{ alignItems: 'center' }}>
          <Button 
            variant="contained" 
            color="success" 
            size="large" 
            onClick={() => startQuiz('basics')}
            sx={{ width: 200, borderRadius: 2 }}
          >
            {t('quiz.difficulty.basics', 'Basics')}
          </Button>
          <Button 
            variant="contained" 
            color="info" 
            size="large" 
            onClick={() => startQuiz('advanced')}
            sx={{ width: 200, borderRadius: 2 }}
          >
            {t('quiz.difficulty.advanced', 'Advanced')}
          </Button>
          <Button 
            variant="contained" 
            color="warning" 
            size="large" 
            onClick={() => startQuiz('expert')}
            sx={{ width: 200, borderRadius: 2 }}
          >
            {t('quiz.difficulty.expert', 'Expert')}
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            size="large" 
            onClick={() => startQuiz('master')}
            sx={{ width: 200, borderRadius: 2 }}
          >
            {t('quiz.difficulty.master', 'Master')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
