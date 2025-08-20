import { useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/AuthCard";
import { SessionControls } from "@/components/SessionControls";
import { QuestionPanel } from "@/components/QuestionPanel";
import { ReviewPanel } from "@/components/ReviewPanel";

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

interface Session {
  id: string;
  user_id: string;
  mode: string;
  question_order: number[];
  current_index: number;
  total: number;
  score: number;
  started_at: string;
  finished_at?: string;
}

interface Attempt {
  question_id: number;
  choice_index: number;
  correct: boolean;
  session_id: string;
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [questionsCache, setQuestionsCache] = useState<Map<number, Question>>(new Map());
  const [attemptsByQ, setAttemptsByQ] = useState<Map<number, Attempt>>(new Map());
  const [incorrectQuestions, setIncorrectQuestions] = useState<Question[]>([]);
  const { toast } = useToast();

  const convertToQuestion = (dbQuestion: any): Question => ({
    ...dbQuestion,
    choices: Array.isArray(dbQuestion.choices) ? dbQuestion.choices.filter((c: any) => typeof c === 'string') : [],
    topic: dbQuestion.topic || undefined,
    difficulty: dbQuestion.difficulty || undefined,
    explanation: dbQuestion.explanation || undefined,
  });

  const fetchActiveQuestions = async (topic?: string): Promise<Question[]> => {
    let query = supabase.from('questions').select('*').eq('is_active', true);
    if (topic) query = query.eq('topic', topic);
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(convertToQuestion);
  };

  const fetchQuestionById = async (id: number): Promise<Question> => {
    if (questionsCache.has(id)) {
      return questionsCache.get(id)!;
    }
    
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    const question = convertToQuestion(data);
    setQuestionsCache(prev => new Map(prev).set(id, question));
    return question;
  };

  const loadAttemptsForSession = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('session_id', sessionId);
    
    if (error) throw error;
    
    const attemptsMap = new Map<number, Attempt>();
    for (const attempt of data || []) {
      attemptsMap.set(attempt.question_id, attempt);
    }
    setAttemptsByQ(attemptsMap);
  };

  const createNewSession = async (topic: string | null, mode: string) => {
    if (!user) return;

    try {
      const questions = await fetchActiveQuestions(topic || undefined);
      if (!questions.length) {
        toast({
          title: "No questions found",
          description: "No active questions found for the selected topic.",
          variant: "destructive",
        });
        return;
      }

      const questionIds = shuffle(questions.map(q => q.id));
      
      // Cache questions
      const newCache = new Map(questionsCache);
      questions.forEach(q => newCache.set(q.id, q));
      setQuestionsCache(newCache);

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          mode,
          total: questionIds.length,
          question_order: questionIds,
          current_index: 0,
          score: 0,
        })
        .select('*')
        .single();

      if (error) throw error;

      setSession(data);
      setAttemptsByQ(new Map());
      setIncorrectQuestions([]);
      
      toast({
        title: "New session created",
        description: `Started ${mode} with ${questionIds.length} questions.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resumeLastSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('finished_at', null)
        .order('started_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (!data?.length) {
        toast({
          title: "No session found",
          description: "No unfinished session found. Create a new one.",
        });
        return;
      }

      const sessionData = data[0];
      
      // Load questions for this session
      if (sessionData.question_order?.length) {
        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .in('id', sessionData.question_order);
        
        if (questions) {
          const newCache = new Map(questionsCache);
          questions.forEach(q => {
            const question = convertToQuestion(q);
            newCache.set(q.id, question);
          });
          setQuestionsCache(newCache);
        }
      }

      await loadAttemptsForSession(sessionData.id);
      setSession(sessionData);
      
      toast({
        title: "Session resumed",
        description: `Resumed ${sessionData.mode} session.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const submitAnswer = async (choiceIndex: number) => {
    if (!session || !user) return;

    const questionId = session.question_order[session.current_index];
    const question = questionsCache.get(questionId);
    
    if (!question) return;

    // Prevent re-answer in exam mode
    if (session.mode === 'exam' && attemptsByQ.has(questionId)) return;

    const correct = choiceIndex === question.correct_index;

    try {
      const { data: attemptData, error: attemptError } = await supabase
        .from('attempts')
        .insert({
          session_id: session.id,
          user_id: user.id,
          question_id: questionId,
          choice_index: choiceIndex,
          correct,
        })
        .select('*')
        .single();

      if (attemptError) throw attemptError;

      // Update local attempts
      const newAttempts = new Map(attemptsByQ);
      newAttempts.set(questionId, attemptData);
      setAttemptsByQ(newAttempts);

      // Update session score
      const isCurrent = session.question_order[session.current_index] === questionId;
      const nextIndex = isCurrent 
        ? Math.min(session.current_index + 1, session.total - 1)
        : session.current_index;

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .update({
          score: session.score + (correct ? 1 : 0),
          current_index: nextIndex,
        })
        .eq('id', session.id)
        .select('*')
        .single();

      if (sessionError) throw sessionError;

      setSession(sessionData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const navigateQuestion = (delta: number) => {
    if (!session) return;
    
    const nextIndex = Math.max(0, Math.min(session.total - 1, session.current_index + delta));
    if (nextIndex === session.current_index) return;
    
    setSession(prev => prev ? { ...prev, current_index: nextIndex } : null);
  };

  const finishSession = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({ finished_at: new Date().toISOString() })
        .eq('id', session.id)
        .select('*')
        .single();

      if (error) throw error;

      setSession(data);

      // Load incorrect questions for review
      const { data: attempts } = await supabase
        .from('attempts')
        .select('question_id, correct')
        .eq('session_id', session.id);

      const wrongIds = attempts?.filter(a => !a.correct).map(a => a.question_id) || [];
      
      if (wrongIds.length) {
        const wrongQuestions = wrongIds
          .map(id => questionsCache.get(id))
          .filter((q): q is Question => q !== undefined);
        setIncorrectQuestions(wrongQuestions);
      }

      toast({
        title: "Session completed",
        description: `Final score: ${data.score}/${data.total}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const currentQuestion = session?.question_order?.[session.current_index] 
    ? questionsCache.get(session.question_order[session.current_index])
    : null;

  const currentAttempt = currentQuestion 
    ? attemptsByQ.get(currentQuestion.id) 
    : null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <AuthCard user={user} onUserChange={setUser} />
          </div>
          {user && (
            <Button variant="outline" onClick={() => window.location.href = "/testing"}>
              Testing Dashboard
            </Button>
          )}
        </div>
        
        {user && (
          <>
            <SessionControls
              session={session}
              onCreateSession={createNewSession}
              onResumeSession={resumeLastSession}
              onFinishSession={finishSession}
            />
            
            {session && currentQuestion && (
              <QuestionPanel
                question={currentQuestion}
                session={session}
                attempt={currentAttempt || null}
                onAnswer={submitAnswer}
                onPrevious={() => navigateQuestion(-1)}
                onNext={() => navigateQuestion(1)}
              />
            )}
            
            {session?.finished_at && (
              <ReviewPanel incorrectQuestions={incorrectQuestions} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
