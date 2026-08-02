import { Metadata } from 'next';
import { QuizContainer } from '../../src/components/client/quiz/QuizContainer';

export const metadata: Metadata = {
  title: 'Pokémon Battle Proficiency Test | Pokemetrix',
  description: 'Test your competitive Pokémon knowledge! Can you reach Champion rank?',
  openGraph: {
    title: 'Pokémon Battle Proficiency Test | Pokemetrix',
    description: 'Test your competitive Pokémon knowledge! Can you reach Champion rank?',
    url: 'https://pokemetrix.com/quiz',
    siteName: 'Pokemetrix',
    images: [
      {
        url: 'https://pokemetrix.com/ogp/quiz.png', // Fallback or standard OGP
        width: 1200,
        height: 630,
      }
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pokémon Battle Proficiency Test | Pokemetrix',
    description: 'Test your competitive Pokémon knowledge! Can you reach Champion rank?',
    images: ['https://pokemetrix.com/ogp/quiz.png'],
  },
};

export default function QuizPage() {
  return (
    <main>
      <QuizContainer />
    </main>
  );
}
