import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface Question {
  id: number;
  stem: string;
  choices: string[];
  correct_index: number;
  topic?: string;
  difficulty?: string;
  explanation?: string;
  image_url?: string;
}

interface Attempt {
  question_id: number;
  choice_index: number;
  correct: boolean;
}

interface QuestionPanelProps {
  question: Question;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  attempt: Attempt | null;
  onAnswer: (choiceIndex: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function QuestionPanel({
  question,
  session,
  attempt,
  onAnswer,
  onPrevious,
  onNext,
}: QuestionPanelProps) {
  const canAnswer = !attempt || session.mode === "practice";
  const isFirstQuestion = session.current_index === 0;
  const isLastQuestion = session.current_index === session.total - 1;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <Badge variant="outline">
            Topic: {question.topic || "—"}
          </Badge>
          <Badge variant="outline">
            Difficulty: {question.difficulty || "—"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-lg font-semibold leading-relaxed">
          {question.stem}
        </div>

        {question.image_url && (
          <div className="flex justify-center">
            <img
              src={question.image_url}
              alt="Question illustration"
              className="max-h-64 w-full object-contain rounded"
            />
          </div>
        )}

        <div className="grid gap-2">
          {question.choices?.map((choice, index) => {
            let variant: "default" | "outline" | "secondary" = "outline";
            let className = "";
            
            if (attempt) {
              if (index === question.correct_index) {
                variant = "default";
                className = "border-success bg-success/10 text-success";
              } else if (index === attempt.choice_index && !attempt.correct) {
                variant = "secondary";
                className = "border-destructive bg-destructive/10 text-destructive";
              }
            }

            return (
              <Button
                key={index}
                variant={variant}
                className={`justify-start h-auto p-4 text-left whitespace-normal ${className}`}
                onClick={() => canAnswer && onAnswer(index)}
                disabled={!canAnswer}
              >
                <span className="font-medium mr-2">
                  {String.fromCharCode(65 + index)}.
                </span>
                {choice}
              </Button>
            );
          })}
        </div>

        {attempt && (
          <Alert className={attempt.correct ? "border-success" : "border-destructive"}>
            <div className="flex items-start gap-2">
              {attempt.correct ? (
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive mt-0.5" />
              )}
              <div>
                <AlertDescription>
                  {attempt.correct ? (
                    <span className="text-success font-medium">✅ Correct.</span>
                  ) : (
                    <span className="text-destructive font-medium">
                      ❌ Incorrect. Correct answer:{" "}
                      <strong>
                        {String.fromCharCode(65 + question.correct_index)}
                      </strong>
                    </span>
                  )}
                  {question.explanation && (
                    <p className="mt-2 text-muted-foreground">
                      {question.explanation}
                    </p>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstQuestion}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={onNext}
            disabled={isLastQuestion}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}