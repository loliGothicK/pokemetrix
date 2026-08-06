import { Metadata } from "next";
import { allQuizzes } from "content-collections";
import { QuizDebugList } from "@/components/client/quiz/QuizDebugList";

export const metadata: Metadata = {
  title: "Quiz Debug | Pokemetrix",
  description: "Internal debug page for quizzes",
};

export default function QuizDebugPage() {
  return (
    <QuizDebugList allQuizzes={allQuizzes} />
  );
}
