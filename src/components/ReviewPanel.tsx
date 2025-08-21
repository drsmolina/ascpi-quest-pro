import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface ReviewPanelProps {
  incorrectQuestions: Question[];
}

export function ReviewPanel({ incorrectQuestions }: ReviewPanelProps) {
  if (incorrectQuestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Incorrect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-lg font-medium">No incorrect answers!</p>
            <p className="text-muted-foreground">Perfect score!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Incorrect ({incorrectQuestions.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {incorrectQuestions.map((question) => (
          <Card key={question.id} className="border-destructive/20">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex gap-2 mb-2">
                  {question.topic && (
                    <Badge variant="outline">{question.topic}</Badge>
                  )}
                  {question.difficulty && (
                    <Badge variant="secondary">{question.difficulty}</Badge>
                  )}
                </div>

                <div className="font-medium">
                  {question.stem}
                </div>

                {question.image_url && (
                  <img
                    src={question.image_url}
                    alt="Question illustration"
                    className="max-h-64 w-full object-contain rounded"
                  />
                )}

                <div className="text-sm">
                  <span className="text-muted-foreground">Correct answer: </span>
                  <span className="font-medium text-success">
                    {String.fromCharCode(65 + question.correct_index)}. {question.choices[question.correct_index]}
                  </span>
                </div>
                
                {question.explanation && (
                  <div className="text-sm text-muted-foreground border-l-2 border-muted pl-4">
                    {question.explanation}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}