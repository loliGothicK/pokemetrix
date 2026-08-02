'use client';

import { Box, Button, Card, CardContent, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { quizScoreAtom, quizStateAtom, initialQuizState } from '../../../store/quiz';
import XIcon from '@mui/icons-material/X';

export function QuizResultScreen() {
  const { t } = useTranslation();
  const [score] = useAtom(quizScoreAtom);
  const [state, setQuizState] = useAtom(quizStateAtom);

  const total = state.questions.length;
  const ratio = score / total;
  
  let rankKey = 'beginner_rank';
  if (ratio === 1) {
    rankKey = 'champion';
  } else if (ratio >= 0.8) {
    rankKey = 'gym_leader';
  } else if (ratio >= 0.5) {
    rankKey = 'ace_trainer';
  }

  // Pre-translate ranks for simplicity or just use generic Japanese text for now
  const rankNames: Record<string, string> = {
    'champion': 'チャンピオン級',
    'gym_leader': 'ジムリーダー級',
    'ace_trainer': 'エリートトレーナー級',
    'beginner_rank': 'たんぱんこぞう級'
  };

  const rank = rankNames[rankKey] || 'トレーナー';
  
  // Actually, we can fetch translated text
  // const rank = t(`quiz.ranks.${rankKey}`, rankNames[rankKey]);

  const handleRestart = () => {
    setQuizState(initialQuizState);
  };

  const shareText = `ポケモンバトル検定 (${t(`quiz.difficulty.${state.difficulty}`)}) で ${score}/${total}問正解しました！\n私のランクは【${rank}】です！\n\n#ポケモンバトル検定 #Pokemetrix\n`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://pokemetrix.com/quiz';
  
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <Card elevation={3} sx={{ maxWidth: 600, mx: 'auto', mt: { xs: 0, sm: 4 }, borderRadius: 3, p: 2, textAlign: 'center' }}>
      <CardContent sx={{ py: { xs: 1, sm: 6 } }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          {t('quiz.ui.result')}
        </Typography>

        <Box sx={{ my: 4 }}>
          <Typography variant="h1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
            {score} <Typography variant="h4" component="span" sx={{ color: 'text.secondary' }}>/ {total}</Typography>
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 'medium', mb: 1 }}>
            あなたのランクは...
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
            {rank}
          </Typography>
        </Box>

        <Stack spacing={3} direction="column" sx={{ alignItems: 'center', mt: 5 }}>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#000', color: '#fff', '&:hover': { bgcolor: '#333' }, borderRadius: 2, px: 4, py: 1.5, fontSize: '1.1rem' }}
            startIcon={<XIcon />}
            href={twitterShareUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('quiz.result.share', '結果をXでシェア')}
          </Button>

          <Button variant="text" size="large" onClick={handleRestart}>
            {t('quiz.ui.play_again')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
