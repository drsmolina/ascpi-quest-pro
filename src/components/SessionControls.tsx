import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionControlsProps {
  session: any;
  onCreateSession: (topic: string | null, mode: string) => void;
  onResumeSession: () => void;
  onFinishSession: () => void;
}

export function SessionControls({
  session,
  onCreateSession,
  onResumeSession,
  onFinishSession,
}: SessionControlsProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("exam");

  const topics = [
    "Hematology",
    "Microbiology", 
    "Immunology",
    "Blood Banking",
    "Chemistry"
  ];

  const handleNewExam = () => {
    onCreateSession(selectedTopic || null, selectedMode);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All topics</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMode} onValueChange={setSelectedMode}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="practice">Practice</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleNewExam}>New Exam</Button>
          <Button variant="outline" onClick={onResumeSession}>
            Resume Last
          </Button>
          {session && (
            <Button variant="destructive" onClick={onFinishSession}>
              Finish Exam
            </Button>
          )}
        </div>

        {session && (
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            <Badge variant="outline">Mode: {session.mode}</Badge>
            <Badge variant="secondary">
              Score: {session.score}/{session.total}
            </Badge>
            <Badge variant="outline">
              Q {session.current_index + 1}/{session.total}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}