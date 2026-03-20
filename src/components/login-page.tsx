'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { initiateEmailSignIn, initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Brain } from 'lucide-react';

export default function LoginPage() {
  const { auth } = useFirebase();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter email and password.' });
      return;
    }
    initiateEmailSignIn(auth, email, password);
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
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
