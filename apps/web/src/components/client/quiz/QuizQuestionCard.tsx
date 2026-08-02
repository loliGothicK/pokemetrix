'use client';

import { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, Stack, Fade, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom, useSetAtom } from 'jotai';
import { currentQuestionAtom, quizProgressAtom, quizStateAtom } from '../../../store/quiz';


export function QuizQuestionCard() {
  const { t } = useTranslation();
  const [currentQuestion] = useAtom(currentQuestionAtom);
  const [progress] = useAtom(quizProgressAtom);
  const setQuizState = useSetAtom(quizStateAtom);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  if (!currentQuestion) return null;

  const handleChoiceSelect = (choice: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(choice);
  };

  const handleInputSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (selectedAnswer !== null || !inputValue.trim()) return;
    setSelectedAnswer(inputValue.trim());
  };

  const handleNext = () => {
    setQuizState((prev) => {
      const isLast = prev.currentQuestionIndex === prev.questions.length - 1;
      return {
        ...prev,
        answers: [...prev.answers, selectedAnswer || ''],
        currentQuestionIndex: isLast ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
        status: isLast ? 'finished' : 'playing',
      };
    });
    setSelectedAnswer(null);
    setInputValue('');
  };

  // Pre-translate Pokemon names in parameters if they exist
  const getTranslatedParams = (params?: Record<string, string | number>) => {
    if (!params) return {};
    const translated: Record<string, string | number> = {};
    for (const [key, val] of Object.entries(params)) {
      if (typeof val === 'string' && t(`pokemon.${val}.name`, val) !== `pokemon.${val}.name`) {
        translated[key] = t(`pokemon.${val}.name`, val);
      } else {
        translated[key] = val;
      }
    }
    return translated;
  };

  const questionParams = getTranslatedParams(currentQuestion.questionParams);
  const explanationParams = getTranslatedParams(currentQuestion.explanationParams);

  const isAnswered = selectedAnswer !== null;
  const isCorrect = isAnswered && (
    currentQuestion.format === 'input' 
      ? selectedAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
      : selectedAnswer === currentQuestion.correctAnswer
  );

  return (
    <Card elevation={3} sx={{ maxWidth: 600, mx: 'auto', mt: { xs: 0, sm: 4 }, borderRadius: 3, p: 2 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
          Question {progress.current} / {progress.total}
        </Typography>

        <Typography variant="h5" sx={{ mt: 1, mb: 4, fontWeight: 'medium' }}>
          {t(currentQuestion.questionTextKey, questionParams)}
        </Typography>

        {currentQuestion.format === 'choices' && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: currentQuestion.options?.length === 4 ? 'repeat(2, 1fr)' : '1fr', 
            gap: 2 
          }}>
            {currentQuestion.options?.map((option) => {
              const isSelected = selectedAnswer === option;
              const isThisCorrect = option === currentQuestion.correctAnswer;
              
              let bgColor = 'background.paper';
              let color = 'text.primary';
              if (isAnswered) {
                if (isThisCorrect) {
                  bgColor = 'success.light';
                  color = 'success.contrastText';
                } else if (isSelected && !isThisCorrect) {
                  bgColor = 'error.light';
                  color = 'error.contrastText';
                }
              }

              return (
                <Button
                  key={option}
                  variant={isSelected ? "contained" : "outlined"}
                  onClick={() => handleChoiceSelect(option)}
                  disabled={isAnswered}
                  sx={{
                    justifyContent: currentQuestion.options?.length === 4 ? 'center' : 'flex-start',
                    py: 1.5,
                    px: { xs: 1, sm: 3 },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    bgcolor: bgColor,
                    color: color,
                    minHeight: '60px',
                    '&.Mui-disabled': {
                      bgcolor: bgColor,
                      color: color,
                      opacity: isThisCorrect || isSelected ? 1 : 0.5,
                    }
                  }}
                >
                  {t(`pokemon.${option}.name`, option)}
                </Button>
              );
            })}
          </Box>
        )}

        {currentQuestion.format === 'input' && (
          <form onSubmit={handleInputSubmit}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <TextField 
                fullWidth
                variant="outlined"
                placeholder={t('quiz.input_placeholder', 'Enter your answer...')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isAnswered}
              />
              <Button 
                type="submit" 
                variant="contained" 
                disabled={isAnswered || !inputValue.trim()}
              >
                {t('quiz.submit', 'Submit')}
              </Button>
            </Stack>
          </form>
        )}

        {isAnswered && (
          <Fade in={isAnswered}>
            <Box sx={{ mt: 4, p: 3, borderRadius: 2, bgcolor: isCorrect ? 'success.50' : 'error.50', color: isCorrect ? 'success.900' : 'error.900' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                {isCorrect ? t('quiz.ui.correct') : t('quiz.ui.incorrect')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {t(currentQuestion.explanationTextKey, explanationParams)}
              </Typography>
              <Button variant="contained" color="primary" fullWidth size="large" onClick={handleNext}>
                {progress.current === progress.total ? t('quiz.ui.see_results') : t('quiz.ui.next')}
              </Button>
            </Box>
          </Fade>
        )}
      </CardContent>
    </Card>
  );
}
