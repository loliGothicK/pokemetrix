import { Suspense } from "react";
import { Metadata } from "next";
import { allQuizzes } from "content-collections";
import { QuizStudio } from "@/components/client/quiz/QuizStudioList";

import { BASE_URL } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Quiz Studio | Pokétistix",
  description: "Content studio for quizzes",
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuizStudioPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#7d8590" }}>Loading studio...</div>}>
      <QuizStudio allQuizzes={allQuizzes} />
    </Suspense>
  );
}
