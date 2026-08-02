'use client';

import { Container } from '@mui/material';
import { useAtomValue } from 'jotai';
import { quizStateAtom } from '../../../store/quiz';
import { QuizStartScreen } from './QuizStartScreen';
import { QuizQuestionCard } from './QuizQuestionCard';
import { QuizResultScreen } from './QuizResultScreen';

export function QuizContainer() {
  const { status } = useAtomValue(quizStateAtom);

  return (
    <Container maxWidth="md" sx={{ pt: { xs: 2, sm: 4, md: 8 }, pb: 8 }}>
      {status === 'idle' && <QuizStartScreen />}
      {status === 'playing' && <QuizQuestionCard />}
      {status === 'finished' && <QuizResultScreen />}
    </Container>
  );
}
