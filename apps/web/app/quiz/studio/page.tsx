import fs from "fs";
import path from "path";
import { Metadata } from "next";
import { allQuizzes } from "content-collections";
import { QuizStudio } from "@/components/client/quiz/QuizStudioList";

export const metadata: Metadata = {
  title: "Quiz Studio | Pokemetrix",
  description: "Content studio for quizzes",
};

export default function QuizStudioPage() {
  const existingQuizzes = allQuizzes.filter((q) => {
    // Resolve relative to the monorepo root (2 levels up from apps/web)
    const filePath = path.resolve(process.cwd(), "../..", `apps/web/content/quiz/${q.locale}/${q.difficulty}/${q.category}/${q.id}.mdx`);
    return fs.existsSync(filePath);
  });

  return <QuizStudio allQuizzes={existingQuizzes} />;
}
