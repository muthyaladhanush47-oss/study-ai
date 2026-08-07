"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ListChecks,
  RotateCcw,
  Type,
  XCircle,
} from "lucide-react";
import type { QuizQuestion } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function typeBadge(q: QuizQuestion): string {
  switch (q.type) {
    case "truefalse":
      return "True / False";
    case "fillblank":
      return "Fill in the blank";
    case "short":
      return "Short answer";
    default:
      return "Multiple choice";
  }
}

export function QuizView({ documentId }: { documentId: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setFinished(false);
    setScore(0);
    setIndex(0);
    setSelected(null);
    setTextAnswer("");
    setAnswered(false);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, count: 10 }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Failed to generate quiz.");
      setQuestions(body.questions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function pick(optionIndex: number) {
    if (answered) return;
    setSelected(optionIndex);
    setAnswered(true);
    const q = questions[index];
    const isCorrect = optionIndex === q.correctIndex;
    setCorrect(isCorrect);
    if (isCorrect) setScore((s) => s + 1);
  }

  function submitText() {
    if (answered) return;
    setAnswered(true);
    const q = questions[index];
    if (!q.correctAnswer) return;
    const userAnswer = textAnswer.trim().toLowerCase();
    const modelAnswer = q.correctAnswer.trim().toLowerCase();
    const isCorrect =
      userAnswer !== "" &&
      modelAnswer
        .split(/\s+and\s+|\s*,\s*|\s*;\s*/)
        .some((part) => userAnswer.includes(part));
    setCorrect(isCorrect);
    if (isCorrect) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      fetch("/api/quiz/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          score,
          total: questions.length,
        }),
      }).catch(() => {});
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setTextAnswer("");
      setAnswered(false);
    }
  }

  if (finished) {
    const percent = Math.round((score / Math.max(questions.length, 1)) * 100);
    return (
      <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center shadow-sm">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full text-white",
            percent >= 70
              ? "bg-emerald-500"
              : percent >= 40
                ? "bg-amber-500"
                : "bg-red-500",
          )}
        >
          <span className="text-xl font-bold">{percent}%</span>
        </div>
        <h2 className="text-xl font-bold">
          You scored {score} / {questions.length}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {percent >= 70
            ? "Great work! Review the explanations you missed and try again to lock it in."
            : percent >= 40
              ? "Not bad — go back over the summaries and take the quiz again."
              : "Keep studying. Regenerate the quiz after reviewing your notes."}
        </p>
        <Button onClick={generate} loading={loading}>
          <RotateCcw className="h-4 w-4" />
          Retake quiz
        </Button>
      </Card>
    );
  }

  if (questions.length > 0) {
    const q = questions[index];
    const isChoice = q.type === "mcq" || q.type === "truefalse";
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Question {index + 1} of {questions.length}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all"
                style={{ width: `${((index + 1) / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {Math.round(((index + 1) / questions.length) * 100)}%
            </span>
          </div>
        </div>

        <Card className="shadow-sm">
          <div className="p-6">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Type className="h-3 w-3" />
              {typeBadge(q)}
            </span>
            <h2 className="mt-3 text-lg font-semibold leading-relaxed">
              {q.question}
            </h2>

            {isChoice && (
              <div className="mt-5 space-y-2.5">
                {(q.options ?? []).map((option, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isSelected = i === selected;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={answered}
                      onClick={() => pick(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                        !answered &&
                          "border-border hover:border-primary/60 hover:bg-primary/5",
                        answered &&
                          isCorrect &&
                          "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
                        answered &&
                          isSelected &&
                          !isCorrect &&
                          "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300",
                        answered &&
                          !isCorrect &&
                          !isSelected &&
                          "border-border opacity-60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs",
                          answered && isCorrect
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : answered && isSelected && !isCorrect
                              ? "border-red-500 bg-red-500 text-white"
                              : "border-border",
                        )}
                      >
                        {answered && isCorrect ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : answered && isSelected && !isCorrect ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {!isChoice && (
              <div className="mt-5 space-y-3">
                <textarea
                  rows={q.type === "short" ? 3 : 1}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={answered}
                  placeholder={
                    q.type === "fillblank"
                      ? "Type the missing word(s)…"
                      : "Type your answer…"
                  }
                  className="nice-scroll w-full resize-none rounded-xl border border-input bg-transparent px-4 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
                />
                {!answered && (
                  <div className="flex justify-end">
                    <Button onClick={submitText} disabled={!textAnswer.trim()}>
                      Check answer
                    </Button>
                  </div>
                )}
                {answered && (
                  <div
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm",
                      correct
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
                    )}
                  >
                    <span className="font-semibold">Model answer: </span>
                    {q.correctAnswer}
                  </div>
                )}
              </div>
            )}

            {answered && q.explanation && (
              <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground/90">
                <span className="font-semibold text-primary">
                  Explanation:{" "}
                </span>
                {q.explanation}
              </div>
            )}

            {answered && (
              <div className="mt-5 flex justify-end">
                <Button onClick={next}>
                  {index + 1 >= questions.length ? "See results" : "Next question"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-fuchsia-600 text-white shadow-lg">
        <ListChecks className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Generate a practice quiz</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Test yourself with 10 questions — multiple choice, true/false,
          fill-in-the-blank and short answer — created from your notes with
          instant feedback and explanations.
        </p>
      </div>
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button onClick={generate} loading={loading}>
        {loading ? "Generating…" : "Generate quiz"}
      </Button>
    </Card>
  );
}
