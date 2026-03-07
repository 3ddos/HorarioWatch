"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Calendar, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // First check if the user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "An account with this email already exists.",
      });
      return;
    }

    const { error } = await supabase
      .from('users')
      .insert([{ name, email, password }]); // Storing as plain text assumed from earlier discussion

    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Could not create user account.",
      });
    } else {
      toast({
        title: "Registration Successful",
        description: "Your account has been created. You can now sign in.",
      });
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="bg-primary p-3 rounded-2xl shadow-lg mb-4">
          <Calendar className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">HorarioWatch</h1>
        <p className="text-muted-foreground mt-2">Create an account to start automating your schedules.</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <form onSubmit={handleRegister}>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Enter your name, email and a password to create an account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="m@example.com"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
