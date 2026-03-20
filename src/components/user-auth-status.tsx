'use client';

import { useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Lock, Unlock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function UserAuthStatus() {
  const { auth, user } = useFirebase();

  const handleSignOut = () => {
    if (auth) {
      signOut(auth);
    }
  };

  if (!user) {
    return null; // Don't render if user is not loaded yet
  }

  const isGuest = user.isAnonymous;
  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {isGuest ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
          <span className="sr-only">User Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isGuest ? (
          <>
            <DropdownMenuLabel>Guest Access</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign In with Password</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3">
                 <Avatar className="h-8 w-8">
                    <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Signed in as</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                    </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
