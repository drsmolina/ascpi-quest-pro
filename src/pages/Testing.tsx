import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, Database, TestTube } from "lucide-react";

interface Question {
  id: number;
  stem: string;
  choices: string[];
  correct_index: number;
  topic?: string;
  difficulty?: string;
  explanation?: string;
  is_active: boolean;
}

const Testing = () => {
  const [newQuestion, setNewQuestion] = useState({
    stem: "",
    choices: ["", "", "", ""],
    correct_index: 0,
    topic: "",
    difficulty: "",
    explanation: "",
  });
  const [existingQuestions, setExistingQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const topics = ["Hematology", "Microbiology", "Immunology", "Blood Banking", "Chemistry"];
  const difficulties = ["Easy", "Medium", "Hard"];

  const handleChoiceChange = (index: number, value: string) => {
    const updatedChoices = [...newQuestion.choices];
    updatedChoices[index] = value;
    setNewQuestion({ ...newQuestion, choices: updatedChoices });
  };

  const addSampleQuestion = async () => {
    if (!newQuestion.stem.trim() || newQuestion.choices.some(c => !c.trim())) {
      toast({
        title: "Validation Error",
        description: "Please fill in the question stem and all answer choices.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('questions').insert({
        stem: newQuestion.stem,
        choices: newQuestion.choices,
        correct_index: newQuestion.correct_index,
        topic: newQuestion.topic || null,
        difficulty: newQuestion.difficulty || null,
        explanation: newQuestion.explanation || null,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question added successfully!",
      });

      // Reset form
      setNewQuestion({
        stem: "",
        choices: ["", "", "", ""],
        correct_index: 0,
        topic: "",
        difficulty: "",
        explanation: "",
      });

      // Refresh questions list
      loadExistingQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const loadExistingQuestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('id', { ascending: false })
        .limit(20);

      if (error) throw error;

      const questions = (data || []).map(q => ({
        ...q,
        choices: Array.isArray(q.choices) ? q.choices.filter((c: any) => typeof c === 'string') : [],
        topic: q.topic || undefined,
        difficulty: q.difficulty || undefined,
        explanation: q.explanation || undefined,
      }));

      setExistingQuestions(questions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const addSampleQuestions = async () => {
    const sampleQuestions = [
      {
        stem: "Which of the following is the most common cause of iron deficiency anemia?",
        choices: [
          "Chronic blood loss",
          "Inadequate dietary intake",
          "Malabsorption",
          "Increased iron requirements"
        ],
        correct_index: 0,
        topic: "Hematology",
        difficulty: "Medium",
        explanation: "Chronic blood loss is the most common cause of iron deficiency anemia in adults, often due to GI bleeding or menstrual losses."
      },
      {
        stem: "What is the primary function of neutrophils?",
        choices: [
          "Antibody production",
          "Phagocytosis of bacteria",
          "Allergic reactions",
          "Antigen presentation"
        ],
        correct_index: 1,
        topic: "Hematology",
        difficulty: "Easy",
        explanation: "Neutrophils are the primary cells responsible for phagocytosis of bacteria and are the first responders to bacterial infections."
      },
      {
        stem: "Which organism is the most common cause of community-acquired pneumonia?",
        choices: [
          "Haemophilus influenzae",
          "Streptococcus pneumoniae",
          "Staphylococcus aureus",
          "Mycoplasma pneumoniae"
        ],
        correct_index: 1,
        topic: "Microbiology",
        difficulty: "Medium",
        explanation: "Streptococcus pneumoniae (pneumococcus) is the most common bacterial cause of community-acquired pneumonia."
      }
    ];

    setIsLoading(true);
    try {
      const { error } = await supabase.from('questions').insert(
        sampleQuestions.map(q => ({ ...q, is_active: true }))
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${sampleQuestions.length} sample questions!`,
      });

      loadExistingQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('questions').select('count').limit(1);
      
      if (error) throw error;

      toast({
        title: "Database Connection",
        description: "✅ Successfully connected to Supabase!",
      });
    } catch (error: any) {
      toast({
        title: "Database Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TestTube className="h-8 w-8 text-primary" />
              Testing Dashboard
            </h1>
            <p className="text-muted-foreground">Add sample questions and test exam functionality</p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Back to Exam
          </Button>
        </div>

        <Tabs defaultValue="add-question" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add-question" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Question
            </TabsTrigger>
            <TabsTrigger value="view-questions" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Questions
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add-question" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Question</CardTitle>
                <CardDescription>Create a new exam question for testing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Question Stem</label>
                  <Textarea
                    placeholder="Enter the question text..."
                    value={newQuestion.stem}
                    onChange={(e) => setNewQuestion({ ...newQuestion, stem: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newQuestion.choices.map((choice, index) => (
                    <div key={index}>
                      <label className="text-sm font-medium">
                        Choice {String.fromCharCode(65 + index)}
                        {index === newQuestion.correct_index && (
                          <Badge variant="default" className="ml-2">Correct</Badge>
                        )}
                      </label>
                      <Input
                        placeholder={`Enter choice ${String.fromCharCode(65 + index)}...`}
                        value={choice}
                        onChange={(e) => handleChoiceChange(index, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium">Correct Answer</label>
                  <Select
                    value={newQuestion.correct_index.toString()}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, correct_index: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {newQuestion.choices.map((_, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {String.fromCharCode(65 + index)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Topic</label>
                    <Select
                      value={newQuestion.topic}
                      onValueChange={(value) => setNewQuestion({ ...newQuestion, topic: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic} value={topic}>
                            {topic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Difficulty</label>
                    <Select
                      value={newQuestion.difficulty}
                      onValueChange={(value) => setNewQuestion({ ...newQuestion, difficulty: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty}>
                            {difficulty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Explanation (Optional)</label>
                  <Textarea
                    placeholder="Enter explanation for the correct answer..."
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <Button onClick={addSampleQuestion} disabled={isLoading} className="w-full">
                  {isLoading ? "Adding..." : "Add Question"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="view-questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Existing Questions</CardTitle>
                <CardDescription>View and manage questions in the database</CardDescription>
                <Button onClick={loadExistingQuestions} disabled={isLoading}>
                  {isLoading ? "Loading..." : "Refresh Questions"}
                </Button>
              </CardHeader>
              <CardContent>
                {existingQuestions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No questions found. Add some questions to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {existingQuestions.map((question) => (
                      <Card key={question.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex gap-2 mb-2">
                              <Badge variant="outline">ID: {question.id}</Badge>
                              {question.topic && <Badge variant="secondary">{question.topic}</Badge>}
                              {question.difficulty && <Badge variant="outline">{question.difficulty}</Badge>}
                              <Badge variant={question.is_active ? "default" : "destructive"}>
                                {question.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            
                            <div className="font-medium">{question.stem}</div>
                            
                            <div className="grid gap-1">
                              {question.choices.map((choice, index) => (
                                <div
                                  key={index}
                                  className={`text-sm p-2 rounded ${
                                    index === question.correct_index
                                      ? "bg-success/10 text-success border border-success/20"
                                      : "bg-muted"
                                  }`}
                                >
                                  {String.fromCharCode(65 + index)}. {choice}
                                  {index === question.correct_index && (
                                    <Badge variant="default" className="ml-2 h-5">Correct</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {question.explanation && (
                              <div className="text-sm text-muted-foreground border-l-2 border-muted pl-4">
                                <strong>Explanation:</strong> {question.explanation}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Operations</CardTitle>
                <CardDescription>Test database connectivity and add sample data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={testDatabaseConnection} disabled={isLoading} variant="outline">
                    Test Database Connection
                  </Button>
                  <Button onClick={addSampleQuestions} disabled={isLoading}>
                    Add Sample Questions
                  </Button>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Quick Actions:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Test Connection: Verify Supabase database connectivity</li>
                    <li>• Add Samples: Insert 3 pre-made questions for testing</li>
                    <li>• View Questions: Browse existing questions in the database</li>
                    <li>• Add Question: Create custom questions for testing</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Testing;