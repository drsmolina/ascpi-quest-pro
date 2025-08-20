import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface AuthCardProps {
  user: User | null;
  onUserChange: (user: User | null) => void;
}

export function AuthCard({ user, onUserChange }: AuthCardProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      onUserChange(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        onUserChange(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [onUserChange]);

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Magic link sent",
        description: "Check your email for the login link.",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ASCPi Exam Simulator</CardTitle>
        <CardDescription>
          Shared login • Multi-device sync • Resume progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Signed in as {user.email}
            </p>
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email for magic link"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
            />
            <Button
              onClick={handleSendMagicLink}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Magic Link"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}