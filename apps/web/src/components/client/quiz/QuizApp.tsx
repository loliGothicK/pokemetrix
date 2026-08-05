"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Grid,
  Paper,
  LinearProgress,
  IconButton,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { MDXContent } from "@content-collections/mdx/react";
import TwitterIcon from "@mui/icons-material/Twitter";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalculateIcon from "@mui/icons-material/Calculate";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SpeedIcon from "@mui/icons-material/Speed";
import type { QuizQuestion, TsumePokemon } from "@/types/quiz";
import { ChoicesFormat } from "./formats/ChoicesFormat";
import { MultiSelectFormat } from "./formats/MultiSelectFormat";
import { OrderingFormat } from "./formats/OrderingFormat";
import { GroupingFormat } from "./formats/GroupingFormat";

interface QuizAppProps {
  initialQuestions: QuizQuestion[];
}

type QuizMode = "menu" | "playing" | "results";
type UICategory = "academic" | "practical" | "speed_compare";
type Difficulty = "basics" | "advanced" | "expert" | "master";

type MenuStep = "category" | "difficulty";

export function QuizApp({ initialQuestions }: QuizAppProps) {
  const { t, i18n } = useTranslation();

  const [mode, setMode] = useState<QuizMode>("menu");
  const [menuStep, setMenuStep] = useState<MenuStep>("difficulty");
  const [selectedCategory, setSelectedCategory] = useState<UICategory | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // States for different quiz formats
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [orderedOptions, setOrderedOptions] = useState<string[]>([]);
  const [groupedItems, setGroupedItems] = useState<Record<string, string[]>>({});

  // Filter questions by current language
  const currentLang = i18n.language.startsWith("en") ? "en" : "ja";

  const localizedQuestions = useMemo(() => {
    return initialQuestions.filter((q) => q.locale === currentLang);
  }, [initialQuestions, currentLang]);

  // Restart if language changes during play
  useEffect(() => {
    setMode("menu");
    setMenuStep("difficulty");
  }, [currentLang]);

  const categories: { id: UICategory; icon: React.ReactNode; color: string }[] = [
    { id: "academic", icon: <MenuBookIcon sx={{ fontSize: 60 }} />, color: "#4facfe" },
    { id: "practical", icon: <CalculateIcon sx={{ fontSize: 60 }} />, color: "#f093fb" },
    { id: "speed_compare", icon: <SpeedIcon sx={{ fontSize: 60 }} />, color: "#ff9a9e" },
  ];

  const difficulties: { id: Difficulty; color: string }[] = [
    { id: "basics", color: "#ff5252" }, // Poke Ball (Red)
    { id: "advanced", color: "#448aff" }, // Great Ball (Blue)
    { id: "expert", color: "#ffc107" }, // Ultra Ball (Yellow/Gold)
    { id: "master", color: "#aa00ff" }, // Master Ball (Purple)
  ];

  const handleSelectDifficulty = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    setMenuStep("category");
  };

  const handleStartQuiz = async (cat: UICategory) => {
    setSelectedCategory(cat);
    let questionsForDiff: QuizQuestion[] = [];

    if (cat === "speed_compare") {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/quizzes/speed_compare?locale=${currentLang}&difficulty=${selectedDifficulty}`,
        );
        const apiQuizzes = await res.json();
        questionsForDiff = apiQuizzes;
      } catch (e) {
        console.error("Failed to load speed compare quizzes", e);
      } finally {
        setIsLoading(false);
      }
    } else {
      questionsForDiff = localizedQuestions.filter((q) => {
        if (q.difficulty !== selectedDifficulty) return false;
        if (cat === "academic") return q.category === "academic";
        if (cat === "practical") {
          if (selectedDifficulty === "basics" || selectedDifficulty === "advanced") {
            return q.category === "damage_calc";
          } else {
            return q.category === "damage_calc" || q.category === "tsume";
          }
        }
        return false;
      });
    }

    // Shuffle and pick up to 10
    const shuffled = [...questionsForDiff].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    if (selected.length === 0) {
      alert(t("quiz.noQuestions"));
      return;
    }

    setSelectedCategory(cat);
    setSessionQuestions(selected);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setSelectedOptions([]);
    setOrderedOptions([]);
    setGroupedItems({});
    setShowExplanation(false);
    setMode("playing");
  };

  const activeQuestion = sessionQuestions[currentIndex];

  useEffect(() => {
    if (activeQuestion) {
      if (activeQuestion.format === "ordering" && activeQuestion.options) {
        setOrderedOptions([...activeQuestion.options]);
      } else if (
        activeQuestion.format === "grouping" &&
        activeQuestion.options &&
        activeQuestion.correctGroups
      ) {
        const groups = Object.keys(activeQuestion.correctGroups);
        const initialGroups: Record<string, string[]> = { unassigned: [...activeQuestion.options] };
        groups.forEach((g) => {
          initialGroups[g] = [];
        });
        setGroupedItems(initialGroups);
      }
    }
  }, [activeQuestion]);

  const isSubmitDisabled = () => {
    if (!activeQuestion) return true;
    if (activeQuestion.format === "choices" || activeQuestion.format === "one_way")
      return !selectedOption;
    if (activeQuestion.format === "multi_select") return selectedOptions.length === 0;
    if (activeQuestion.format === "ordering") return orderedOptions.length === 0;
    if (activeQuestion.format === "grouping") return (groupedItems["unassigned"]?.length || 0) > 0;
    return true;
  };

  const handleSubmit = () => {
    if (!activeQuestion) return;

    let isCorrect = false;

    if (activeQuestion.format === "choices" || activeQuestion.format === "one_way") {
      isCorrect = selectedOption === activeQuestion.correctAnswer;
    } else if (activeQuestion.format === "multi_select") {
      const correct = activeQuestion.correctAnswers || [];
      isCorrect =
        correct.length === selectedOptions.length &&
        correct.every((ans) => selectedOptions.includes(ans));
    } else if (activeQuestion.format === "ordering") {
      const correct = activeQuestion.correctOrder || [];
      isCorrect =
        correct.length === orderedOptions.length &&
        correct.every((ans, i) => orderedOptions[i] === ans);
    } else if (activeQuestion.format === "grouping") {
      const correct = activeQuestion.correctGroups || {};
      isCorrect = true;
      for (const group of Object.keys(correct)) {
        const expected = correct[group] || [];
        const actual = groupedItems[group] || [];
        if (expected.length !== actual.length || !expected.every((ans) => actual.includes(ans))) {
          isCorrect = false;
          break;
        }
      }
      if ((groupedItems["unassigned"]?.length || 0) > 0) {
        isCorrect = false;
      }
    }

    if (isCorrect) {
      setScore((s) => s + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setSelectedOptions([]);
      setOrderedOptions([]);
      setGroupedItems({});
      setShowExplanation(false);
    } else {
      setMode("results");
    }
  };

  const handleBackToMenu = () => {
    setMode("menu");
    setMenuStep("category");
  };

  const getRankKey = (s: number, total: number) => {
    const ratio = total > 0 ? s / total : 0;
    if (ratio === 1) return "champion";
    if (ratio >= 0.7) return "veteran";
    if (ratio >= 0.4) return "aceTrainer";
    return "youngster";
  };

  const getPokemonName = (speciesId: string) => {
    if (!speciesId) return "";
    const id = speciesId.toLowerCase();
    const nameKey = `pokemon.${id}.name`;
    const formKey = `pokemon.${id}.formName`;
    if (!i18n.exists(nameKey)) {
      return speciesId;
    }
    const name = t(nameKey);
    if (i18n.exists(formKey)) {
      const formName = t(formKey);

      const megaSuffixMatch = formName.match(/^(Mega|メガ)\s?([XY])$/i);
      if (megaSuffixMatch) {
        const prefix = megaSuffixMatch[1];
        const suffix = megaSuffixMatch[2].toUpperCase();
        return currentLang === "ja" ? `${prefix}${name}${suffix}` : `${prefix} ${name} ${suffix}`;
      }

      return currentLang === "ja" ? `${formName}${name}` : `${formName} ${name}`;
    }
    return name;
  };

  const handleShareTwitter = () => {
    const difficultyName = t(`quiz.difficulty.${selectedDifficulty}`);
    const categoryName = t(`quiz.category.${selectedCategory}`);
    const rankKey = getRankKey(score, sessionQuestions.length);
    const rankName = t(`quiz.rank.${rankKey}`);

    const text =
      currentLang === "ja"
        ? `ポケモンバトル検定（${categoryName} - ${difficultyName}）で ${score}/${sessionQuestions.length} 点を獲得し、「${rankName}」に認定されました！\n#Pokemetrix\n`
        : `I scored ${score}/${sessionQuestions.length} in the Pokémon Battle Proficiency Test (${categoryName} - ${difficultyName}) and achieved the rank of "${rankName}"!\n#Pokemetrix\n`;

    const url =
      typeof window !== "undefined" ? window.location.href : "https://pokemetrix.mitama.io/quiz";

    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank");
  };

  if (mode === "playing" && activeQuestion) {
    let isCorrect = false;
    if (activeQuestion.format === "choices" || activeQuestion.format === "one_way") {
      isCorrect = selectedOption === activeQuestion.correctAnswer;
    } else if (activeQuestion.format === "multi_select") {
      const correct = activeQuestion.correctAnswers || [];
      isCorrect =
        correct.length === selectedOptions.length &&
        correct.every((ans) => selectedOptions.includes(ans));
    } else if (activeQuestion.format === "ordering") {
      const correct = activeQuestion.correctOrder || [];
      isCorrect =
        correct.length === orderedOptions.length &&
        correct.every((ans, i) => orderedOptions[i] === ans);
    } else if (activeQuestion.format === "grouping") {
      const correct = activeQuestion.correctGroups || {};
      isCorrect = true;
      for (const group of Object.keys(correct)) {
        const expected = correct[group] || [];
        const actual = groupedItems[group] || [];
        if (expected.length !== actual.length || !expected.every((ans) => actual.includes(ans))) {
          isCorrect = false;
          break;
        }
      }
      if ((groupedItems["unassigned"]?.length || 0) > 0) isCorrect = false;
    }

    const progress = (currentIndex / sessionQuestions.length) * 100;

    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}
          >
            <Button onClick={handleBackToMenu} color="inherit" startIcon={<ArrowBackIcon />}>
              {t("common.back")}
            </Button>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }} color="text.secondary">
              {currentIndex + 1} / {sessionQuestions.length}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Card
          variant="outlined"
          sx={{ mb: 3, borderRadius: 3, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "none" }}
        >
          <CardContent sx={{ p: 4 }}>
            {activeQuestion.practicalData && (
              <Box
                sx={{
                  mb: 4,
                  p: 3,
                  bgcolor: "background.default",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="primary"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  {t("quiz.scenarioData")}
                </Typography>
                <Stack spacing={1.5}>
                  <Typography variant="body2">
                    <strong>{t("quiz.attacker")}:</strong>{" "}
                    {getPokemonName(activeQuestion.practicalData.attacker.species)} (
                    {activeQuestion.practicalData.attacker.evs},{" "}
                    {activeQuestion.practicalData.attacker.item},{" "}
                    {activeQuestion.practicalData.attacker.nature})
                  </Typography>
                  {activeQuestion.practicalData.ally && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t("quiz.ally")}:</strong>{" "}
                      {getPokemonName(activeQuestion.practicalData.ally.species)}{" "}
                      {activeQuestion.practicalData.ally.item &&
                        `(${activeQuestion.practicalData.ally.item})`}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>{t("quiz.defender")}:</strong>{" "}
                    {getPokemonName(activeQuestion.practicalData.defender.species)} (
                    {activeQuestion.practicalData.defender.evs},{" "}
                    {activeQuestion.practicalData.defender.item},{" "}
                    {activeQuestion.practicalData.defender.nature})
                  </Typography>
                  {activeQuestion.practicalData.opponentAlly && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t("quiz.opponentAlly")}:</strong>{" "}
                      {getPokemonName(activeQuestion.practicalData.opponentAlly.species)}{" "}
                      {activeQuestion.practicalData.opponentAlly.item &&
                        `(${activeQuestion.practicalData.opponentAlly.item})`}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>{t("quiz.move")}:</strong> {activeQuestion.practicalData.move}
                  </Typography>
                </Stack>
              </Box>
            )}

            {activeQuestion.tsumeData && (
              <Box
                sx={{
                  mb: 4,
                  p: 3,
                  bgcolor: "background.default",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="primary"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  {t("quiz.boardState")}
                </Typography>
                <Stack
                  spacing={3}
                  direction={{ xs: "column", sm: "row" }}
                  sx={{ justifyContent: "space-between" }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: "bold", mb: 1 }}>
                      {t("quiz.yourActive")}
                    </Typography>
                    {activeQuestion.tsumeData.playerSide.map((poke: TsumePokemon, i: number) => (
                      <Box
                        key={i}
                        sx={{
                          mb: 2,
                          p: 1.5,
                          bgcolor: "background.paper",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                          {getPokemonName(poke.species)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", color: "text.secondary" }}
                        >
                          HP: {poke.hpCurrent} / {poke.hpMax}
                        </Typography>
                        {poke.item && (
                          <Typography
                            variant="caption"
                            sx={{ display: "block", color: "text.secondary" }}
                          >
                            {t("quiz.item")}: {poke.item}
                          </Typography>
                        )}
                        {poke.status && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: "block", fontWeight: "bold" }}
                          >
                            {poke.status.toUpperCase()}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="error" sx={{ fontWeight: "bold", mb: 1 }}>
                      {t("quiz.opponentActive")}
                    </Typography>
                    {activeQuestion.tsumeData.opponentSide.map((poke: TsumePokemon, i: number) => (
                      <Box
                        key={i}
                        sx={{
                          mb: 2,
                          p: 1.5,
                          bgcolor: "background.paper",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                          {getPokemonName(poke.species)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", color: "text.secondary" }}
                        >
                          HP: {poke.hpCurrent} / {poke.hpMax}
                        </Typography>
                        {poke.item && (
                          <Typography
                            variant="caption"
                            sx={{ display: "block", color: "text.secondary" }}
                          >
                            {t("quiz.item")}: {poke.item}
                          </Typography>
                        )}
                        {poke.status && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: "block", fontWeight: "bold" }}
                          >
                            {poke.status.toUpperCase()}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Stack>
                {activeQuestion.tsumeData.field && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: "1px dashed", borderColor: "divider" }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>{t("quiz.field")}:</strong>{" "}
                      {activeQuestion.tsumeData.field.terrain || "None"} /{" "}
                      {activeQuestion.tsumeData.field.weather || "None"}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", lineHeight: 1.4 }}>
              {activeQuestion.question}
            </Typography>
            {(activeQuestion.format === "choices" || activeQuestion.format === "one_way") && (
              <ChoicesFormat
                options={activeQuestion.options || []}
                selectedOption={selectedOption}
                onOptionSelect={setSelectedOption}
                showExplanation={showExplanation}
                correctAnswer={activeQuestion.correctAnswer}
              />
            )}

            {activeQuestion.format === "multi_select" && (
              <MultiSelectFormat
                options={activeQuestion.options || []}
                selectedOptions={selectedOptions}
                onOptionToggle={(opt) =>
                  setSelectedOptions((prev) =>
                    prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt],
                  )
                }
                showExplanation={showExplanation}
                correctAnswers={activeQuestion.correctAnswers}
              />
            )}

            {activeQuestion.format === "ordering" && (
              <OrderingFormat
                orderedOptions={orderedOptions}
                onOrderChange={setOrderedOptions}
                showExplanation={showExplanation}
                correctOrder={activeQuestion.correctOrder}
              />
            )}

            {activeQuestion.format === "grouping" && (
              <GroupingFormat
                groups={Object.keys(activeQuestion.correctGroups || {})}
                groupedItems={groupedItems}
                onGroupChange={setGroupedItems}
                showExplanation={showExplanation}
                correctGroups={activeQuestion.correctGroups}
              />
            )}

            {!showExplanation && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSubmitDisabled()}
                sx={{
                  mt: 4,
                  width: "100%",
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                {t("common.submit")}
              </Button>
            )}
          </CardContent>
        </Card>

        {showExplanation && (
          <Card
            variant="outlined"
            sx={{
              borderColor: isCorrect ? "success.main" : "error.main",
              borderRadius: 3,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h5"
                color={isCorrect ? "success.main" : "error.main"}
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                {isCorrect ? t("quiz.correct") : t("quiz.incorrect")}
              </Typography>
              <Box sx={{ mt: 2, "& p": { lineHeight: 1.7 } }}>
                {activeQuestion.mdx && <MDXContent code={activeQuestion.mdx} />}
              </Box>
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{
                  mt: 4,
                  width: "100%",
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                {currentIndex < sessionQuestions.length - 1
                  ? t("common.next")
                  : t("quiz.viewResults")}
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  if (mode === "results") {
    const rankKey = getRankKey(score, sessionQuestions.length);

    return (
      <Box sx={{ maxWidth: 600, mx: "auto", p: 4, textAlign: "center" }}>
        <Paper
          elevation={6}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
            color: "#fff",
          }}
        >
          <Typography
            variant="h3"
            gutterBottom
            sx={{ fontWeight: "900", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          >
            {t("quiz.results")}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.8 }} gutterBottom>
            {t(`quiz.category.${selectedCategory}`)} - {t(`quiz.difficulty.${selectedDifficulty}`)}
          </Typography>

          <Box sx={{ my: 4, position: "relative" }}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: "900",
                color: "#4facfe",
                textShadow: "0 0 20px rgba(79, 172, 254, 0.4)",
              }}
            >
              {score}{" "}
              <Typography component="span" variant="h3" sx={{ color: "#fff", opacity: 0.5 }}>
                / {sessionQuestions.length}
              </Typography>
            </Typography>
          </Box>

          <Box sx={{ mb: 6 }}>
            <Typography
              variant="subtitle1"
              sx={{ color: "#aaa", textTransform: "uppercase", letterSpacing: 2 }}
            >
              {t("quiz.rankLabel")}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                color: "#f093fb",
                textShadow: "0 0 10px rgba(240, 147, 251, 0.5)",
              }}
            >
              {t(`quiz.rank.${rankKey}`)}
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<TwitterIcon />}
            onClick={handleShareTwitter}
            sx={{
              bgcolor: "#1DA1F2",
              "&:hover": { bgcolor: "#1a91da", transform: "scale(1.02)" },
              mb: 3,
              px: 4,
              py: 2,
              borderRadius: 50,
              textTransform: "none",
              fontWeight: "bold",
              fontSize: "1.1rem",
              boxShadow: "0 4px 14px 0 rgba(29, 161, 242, 0.39)",
              transition: "all 0.2s ease-in-out",
            }}
          >
            {t("quiz.shareOnTwitter")}
          </Button>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              onClick={handleBackToMenu}
              sx={{ color: "#fff", opacity: 0.7, "&:hover": { opacity: 1 } }}
            >
              {t("common.backToMenu")}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Menu Mode
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          fontWeight: "900",
          textAlign: "center",
          mb: 6,
          background: "linear-gradient(to right, #4facfe 0%, #00f2fe 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {t("quiz.title")}
      </Typography>

      {menuStep === "difficulty" && (
        <Box>
          <Typography
            variant="h5"
            sx={{ textAlign: "center", mb: 4, fontWeight: "bold", color: "text.secondary" }}
          >
            Select Difficulty
          </Typography>
          <Grid container spacing={3} sx={{ justifyContent: "center" }}>
            {difficulties.map((diff) => (
              <Grid size={{ xs: 12, sm: 6 }} key={diff.id}>
                <Card
                  sx={{
                    cursor: "pointer",
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${diff.color}22 0%, ${diff.color}11 100%)`,
                    border: "1px solid",
                    borderColor: `${diff.color}44`,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 8px 16px ${diff.color}33`,
                      borderColor: diff.color,
                    },
                  }}
                  onClick={() => handleSelectDifficulty(diff.id)}
                >
                  <CardContent sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: "bold", color: diff.color }}>
                      {t(`quiz.difficulty.${diff.id}`)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {menuStep === "category" && (
        <Box sx={{ animation: "fadeIn 0.5s ease-out" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
            <IconButton onClick={() => setMenuStep("difficulty")} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "text.secondary" }}>
              {selectedDifficulty ? t(`quiz.difficulty.${selectedDifficulty}`) : ""} - Select
              Category
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ justifyContent: "center" }}>
            {categories.map((cat) => (
              <Grid size={{ xs: 12, md: 4 }} key={cat.id}>
                <Card
                  sx={{
                    cursor: isLoading ? "wait" : "pointer",
                    borderRadius: 4,
                    height: "100%",
                    background: `linear-gradient(135deg, ${cat.color}22 0%, ${cat.color}11 100%)`,
                    border: "1px solid",
                    borderColor: `${cat.color}44`,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    opacity: isLoading ? 0.5 : 1,
                    pointerEvents: isLoading ? "none" : "auto",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: `0 12px 24px ${cat.color}33`,
                      borderColor: cat.color,
                    },
                  }}
                  onClick={() => handleStartQuiz(cat.id)}
                >
                  <CardContent
                    sx={{
                      textAlign: "center",
                      py: 6,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ color: cat.color, mb: 2 }}>{cat.icon}</Box>
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      {t(`quiz.category.${cat.id}`)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
