import { Metadata } from "next";
import { allQuizzes } from "content-collections";
import { QuizStudio } from "@/components/client/quiz/QuizStudioList";

export const metadata: Metadata = {
  title: "Quiz Studio | Pokemetrix",
  description: "Content studio for quizzes",
};

export default function QuizStudioPage() {
  return <QuizStudio allQuizzes={allQuizzes} />;
}
