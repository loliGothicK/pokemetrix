import { Metadata } from "next";
import { QuizApp } from "@/components/client/quiz/QuizApp";
import { Box } from "@mui/material";

export const metadata: Metadata = {
  title: "Pokémon Battle Proficiency Test | Pokemetrix",
  description: "Test your competitive Pokémon knowledge!",
  openGraph: {
    title: "Pokémon Battle Proficiency Test | Pokemetrix",
    description: "Test your competitive Pokémon knowledge!",
    url: "https://pokemetrix.com/quiz",
    siteName: "Pokemetrix",
    images: [
      {
        url: "https://pokemetrix.com/ogp/quiz.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokémon Battle Proficiency Test | Pokemetrix",
    description: "Test your competitive Pokémon knowledge!",
    images: ["https://pokemetrix.com/ogp/quiz.png"],
  },
};

import { allQuizzes } from "content-collections";

export default function QuizPage() {
  return (
    <Box style={{ minHeight: "100vh", padding: "2rem 0" }}>
      <QuizApp initialQuestions={allQuizzes} />
    </Box>
  );
}
