import React, { useState, useMemo } from "react";
import { Brain, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Trophy, Target, Zap, Award, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { QuizQuestion } from "@/lib/types";

interface QuizSectionProps {
  questions: QuizQuestion[];
  variant?: "default" | "junior";
}

type AnswerValue = string | string[];

const QuizSection: React.FC<QuizSectionProps> = ({ questions, variant = "default" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  if (!questions || questions.length === 0) return null;

  const isJunior = variant === "junior";
  const q = questions[currentIndex];
  const qType = q.type || "mcq";
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const isCorrect = (question: QuizQuestion): boolean => {
    const answer = answers[question.id];
    const type = question.type || "mcq";
    if (!answer) return false;
    if (type === "fill-blank") {
      return (answer as string).trim().toLowerCase() === (question.correctAnswer || "").trim().toLowerCase();
    }
    if (type === "multi-select") {
      const selected = answer as string[];
      const correctLabels = question.options.filter(o => o.isCorrect).map(o => o.label).sort();
      return JSON.stringify([...selected].sort()) === JSON.stringify(correctLabels);
    }
    // mcq or true-false
    return question.options.find(o => o.label === answer)?.isCorrect || false;
  };

  const score = useMemo(() => {
    if (!submitted) return 0;
    return questions.filter(isCorrect).length;
  }, [submitted, answers]);

  const scorePercent = Math.round((score / questions.length) * 100);

  const allAnswered = questions.every(q => {
    const a = answers[q.id];
    if (!a) return false;
    if (Array.isArray(a)) return a.length > 0;
    return a.trim() !== "";
  });

  const handleSubmit = () => {
    setSubmitted(true);
    setShowResults(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setShowResults(false);
    setCurrentIndex(0);
  };

  // Results screen (LinkedIn-games style)
  if (showResults && submitted) {
    const emoji = scorePercent === 100 ? "🏆" : scorePercent >= 75 ? "🔥" : scorePercent >= 50 ? "👏" : "💪";
    const message = scorePercent === 100 ? "Perfect Score!" : scorePercent >= 75 ? "Excellent!" : scorePercent >= 50 ? "Good effort!" : "Keep learning!";
    const streakBars = questions.map((q, i) => isCorrect(q));

    return (
      <div className="space-y-5">
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Brain className={`h-5 w-5 ${isJunior ? "text-secondary" : "text-primary"}`} />
          {isJunior ? "Quiz Results! 🎉" : "Quiz Results"}
        </h3>

        <div className={`rounded-2xl border p-6 text-center space-y-4 ${
          scorePercent === 100
            ? "border-green-500/30 bg-green-500/5"
            : "border-border bg-card"
        }`}>
          {/* Score circle */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl">{emoji}</span>
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={scorePercent >= 75 ? "hsl(var(--primary))" : scorePercent >= 50 ? "hsl(40 100% 50%)" : "hsl(0 80% 60%)"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${scorePercent * 2.64} 264`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold text-foreground">
                {score}/{questions.length}
              </span>
            </div>
            <p className="font-display text-lg font-bold text-foreground">{message}</p>
          </div>

          {/* Streak bar (like LinkedIn games) */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Question Breakdown</p>
            <div className="flex items-center justify-center gap-1">
              {streakBars.map((correct, i) => (
                <div
                  key={i}
                  className={`h-6 rounded-sm flex items-center justify-center text-[10px] font-bold text-white transition-all ${
                    correct ? "bg-green-500" : "bg-red-400"
                  }`}
                  style={{ width: `${Math.max(100 / questions.length, 20)}%`, maxWidth: "48px" }}
                  title={`Q${i + 1}: ${correct ? "Correct" : "Wrong"}`}
                >
                  {correct ? "✓" : "✗"}
                </div>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">{score} correct</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-500">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">{questions.length - score} wrong</span>
            </div>
          </div>

          {/* Achievement badges */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {scorePercent === 100 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium border border-yellow-500/20">
                <Trophy className="h-3 w-3" /> Flawless
              </span>
            )}
            {scorePercent >= 75 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                <Target className="h-3 w-3" /> Sharp Mind
              </span>
            )}
            {allAnswered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium border border-blue-500/20">
                <Zap className="h-3 w-3" /> Completed
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={handleRetry} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </Button>
            <Button
              size="sm"
              onClick={() => setShowResults(false)}
              className={isJunior ? "bg-secondary hover:bg-secondary/90" : ""}
            >
              Review Answers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Question view (one at a time)
  const selectedAnswer = answers[q.id];
  const correctOption = q.options.find(o => o.isCorrect);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Brain className={`h-5 w-5 ${isJunior ? "text-secondary" : "text-primary"}`} />
          {isJunior ? "Quiz Time! 🧠" : "Quiz"}
        </h3>
        <span className="text-xs text-muted-foreground font-mono">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-1.5" />

      {/* Question card */}
      <div className={`p-5 rounded-xl border space-y-4 ${
        submitted
          ? isCorrect(q)
            ? "border-green-500/40 bg-green-500/5"
            : "border-red-500/40 bg-red-500/5"
          : "border-border bg-card"
      }`}>
        <div className="flex items-start gap-2">
          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold flex-shrink-0 ${
            isJunior ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
          }`}>
            {currentIndex + 1}
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{q.question}</p>
            <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              qType === "mcq" ? "bg-blue-500/10 text-blue-600" :
              qType === "true-false" ? "bg-purple-500/10 text-purple-600" :
              qType === "fill-blank" ? "bg-orange-500/10 text-orange-600" :
              "bg-teal-500/10 text-teal-600"
            }`}>
              {qType === "mcq" ? "Multiple Choice" :
               qType === "true-false" ? "True / False" :
               qType === "fill-blank" ? "Fill in the Blank" :
               "Select Multiple"}
            </span>
          </div>
        </div>

        {/* MCQ / True-False */}
        {(qType === "mcq" || qType === "true-false") && (
          <RadioGroup
            value={(selectedAnswer as string) || ""}
            onValueChange={(val) => {
              if (!submitted) setAnswers(prev => ({ ...prev, [q.id]: val }));
            }}
            className="space-y-2"
          >
            {q.options.map((opt, oi) => {
              const isSelected = selectedAnswer === opt.label;
              const showCorrect = submitted && opt.isCorrect;
              const showWrong = submitted && isSelected && !opt.isCorrect;
              return (
                <div key={oi} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  submitted ? "" : isSelected ? "bg-primary/5" : "hover:bg-accent/50"
                }`}>
                  <RadioGroupItem value={opt.label} id={`${q.id}-${oi}`} disabled={submitted} />
                  <Label htmlFor={`${q.id}-${oi}`} className={`text-sm cursor-pointer flex items-center gap-1.5 ${
                    showCorrect ? "text-green-600 font-medium" : showWrong ? "text-red-500 line-through" : "text-foreground"
                  }`}>
                    {opt.label}
                    {showCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                    {showWrong && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        )}

        {/* Multi-select */}
        {qType === "multi-select" && (
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = (selectedAnswer as string[]) || [];
              const isChecked = selected.includes(opt.label);
              const showCorrect = submitted && opt.isCorrect;
              const showWrong = submitted && isChecked && !opt.isCorrect;
              return (
                <div key={oi} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  submitted ? "" : isChecked ? "bg-primary/5" : "hover:bg-accent/50"
                }`}>
                  <Checkbox
                    id={`${q.id}-${oi}`}
                    checked={isChecked}
                    disabled={submitted}
                    onCheckedChange={(checked) => {
                      if (submitted) return;
                      setAnswers(prev => {
                        const current = (prev[q.id] as string[]) || [];
                        return {
                          ...prev,
                          [q.id]: checked
                            ? [...current, opt.label]
                            : current.filter(l => l !== opt.label)
                        };
                      });
                    }}
                  />
                  <Label htmlFor={`${q.id}-${oi}`} className={`text-sm cursor-pointer flex items-center gap-1.5 ${
                    showCorrect ? "text-green-600 font-medium" : showWrong ? "text-red-500 line-through" : "text-foreground"
                  }`}>
                    {opt.label}
                    {showCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                    {showWrong && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                  </Label>
                </div>
              );
            })}
            <p className="text-[10px] text-muted-foreground">Select all that apply</p>
          </div>
        )}

        {/* Fill in the blank */}
        {qType === "fill-blank" && (
          <div className="space-y-2">
            <Input
              placeholder="Type your answer..."
              value={(selectedAnswer as string) || ""}
              disabled={submitted}
              onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              className={submitted
                ? isCorrect(q)
                  ? "border-green-500 text-green-600"
                  : "border-red-500 text-red-500"
                : ""
              }
            />
            {submitted && !isCorrect(q) && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Correct answer: {q.correctAnswer}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex(i => i - 1)}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        {currentIndex < questions.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setCurrentIndex(i => i + 1)}
            className={`gap-1 ${isJunior ? "bg-secondary hover:bg-secondary/90" : ""}`}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!allAnswered || submitted}
            className={`gap-1 ${isJunior ? "bg-secondary hover:bg-secondary/90" : ""}`}
          >
            <Award className="h-4 w-4" /> Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizSection;
