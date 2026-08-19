import { Suspense } from "react";
import { Metadata } from "next";
import { allQuizzes } from "content-collections";
import { QuizStudio } from "@/components/client/quiz/QuizStudioList";

export const metadata: Metadata = {
  title: "Quiz Studio | Pokemetrix",
  description: "Content studio for quizzes",
};

export default function QuizStudioPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#7d8590" }}>Loading studio...</div>}>
      <QuizStudio allQuizzes={allQuizzes} />
    </Suspense>
  );
}
