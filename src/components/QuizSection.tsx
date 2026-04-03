import React, { useState } from "react";
import { Brain, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuizQuestion } from "@/lib/types";

interface QuizSectionProps {
  questions: QuizQuestion[];
  variant?: "default" | "junior";
}

const QuizSection: React.FC<QuizSectionProps> = ({ questions, variant = "default" }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) return null;

  const score = submitted
    ? questions.filter((q) => {
        const selected = answers[q.id];
        return q.options.find((o) => o.label === selected)?.isCorrect;
      }).length
    : 0;

  const isJunior = variant === "junior";

  return (
    <div className="space-y-5">
      <h3 className={`font-display text-lg font-bold text-foreground flex items-center gap-2 ${isJunior ? "" : ""}`}>
        <Brain className={`h-5 w-5 ${isJunior ? "text-secondary" : "text-primary"}`} />
        {isJunior ? "Quiz Time! 🧠" : "Quiz"}
      </h3>

      {questions.map((q, qi) => {
        const selectedAnswer = answers[q.id];
        const correctOption = q.options.find((o) => o.isCorrect);

        return (
          <div
            key={q.id}
            className={`p-4 rounded-xl border space-y-3 ${
              submitted
                ? selectedAnswer && correctOption?.label === selectedAnswer
                  ? "border-green-500/40 bg-green-500/5"
                  : "border-red-500/40 bg-red-500/5"
                : "border-border bg-card"
            }`}
          >
            <p className="text-sm font-medium text-foreground">
              {qi + 1}. {q.question}
            </p>
            <RadioGroup
              value={selectedAnswer || ""}
              onValueChange={(val) => {
                if (!submitted) setAnswers((prev) => ({ ...prev, [q.id]: val }));
              }}
              className="space-y-2"
            >
              {q.options.map((opt, oi) => {
                const isSelected = selectedAnswer === opt.label;
                const showCorrect = submitted && opt.isCorrect;
                const showWrong = submitted && isSelected && !opt.isCorrect;

                return (
                  <div key={oi} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={opt.label}
                      id={`${q.id}-${oi}`}
                      disabled={submitted}
                    />
                    <Label
                      htmlFor={`${q.id}-${oi}`}
                      className={`text-sm cursor-pointer flex items-center gap-1.5 ${
                        showCorrect ? "text-green-600 font-medium" : showWrong ? "text-red-500 line-through" : "text-foreground"
                      }`}
                    >
                      {opt.label}
                      {showCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                      {showWrong && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        );
      })}

      {!submitted ? (
        <Button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < questions.length}
          size="sm"
          className={isJunior ? "bg-secondary hover:bg-secondary/90" : ""}
        >
          Check Answers
        </Button>
      ) : (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          score === questions.length
            ? "bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400"
            : "bg-primary/5 border border-primary/20 text-foreground"
        }`}>
          {isJunior
            ? `${score === questions.length ? "🎉 Perfect score!" : "👏 Good try!"} You got ${score}/${questions.length} correct!`
            : `You scored ${score}/${questions.length} correct.`}
        </div>
      )}
    </div>
  );
};

export default QuizSection;
