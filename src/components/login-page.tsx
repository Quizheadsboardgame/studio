'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp, initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const { auth } = useFirebase();
  const { toast } = useToast();
  
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter email and password.' });
      return;
    }
    initiateEmailSignIn(auth, signInEmail, signInPassword);
  };
  
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter email and password.' });
      return;
    }
    initiateEmailSignUp(auth, signUpEmail, signUpPassword);
    toast({ title: 'Account creation initiated', description: 'Please wait a moment. You will be signed in automatically.' });
  };


  const handleGuestAccess = () => {
    initiateAnonymousSignIn(auth);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <Brain className="h-12 w-12 mx-auto text-primary" />
          <CardTitle className="mt-4 text-2xl">CleanFlow</CardTitle>
          <CardDescription>Lot 4. Addenbrooke’s</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                    <div className="space-y-2">
                    <Label htmlFor="email-signin">Email</Label>
                    <Input id="email-signin" type="email" placeholder="m@example.com" required value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="password-signin">Password</Label>
                    <Input id="password-signin" type="password" required value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full">
                    Sign In
                    </Button>
                </form>
            </TabsContent>
            <TabsContent value="signup">
                 <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                    <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input id="email-signup" type="email" placeholder="m@example.com" required value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="password-signup">Password</Label>
                    <Input id="password-signup" type="password" required value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full">
                    Create Account
                    </Button>
                </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button variant="outline" className="w-full" onClick={handleGuestAccess}>
            Continue with Read-Only Guest Access
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
