'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, LogOut, Trash2, Power, Loader2 } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/data';

interface AccountSettingsTabProps {
  userProfile: UserProfile;
  onDeactivate: () => void;
  onDeleteData: () => Promise<void>;
}

export default function AccountSettingsTab({ userProfile, onDeactivate, onDeleteData }: AccountSettingsTabProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteData();
      toast({ title: 'Account Wiped', description: 'All data has been permanently deleted.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Power className="h-5 w-5" />
            Temporary Deactivation
          </CardTitle>
          <CardDescription>
            Pause your operations. You will be logged out, but all your data will be preserved and automatically restored when you log back in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-amber-200 hover:bg-amber-100 text-amber-700">
                Deactivate My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Temporarily Deactivate Hub?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be logged out immediately. All site data, schedules, and histories for "{userProfile.name}" will remain exactly as they are. Simply log back in whenever you are ready to resume operations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDeactivate} className="bg-amber-600 hover:bg-amber-700">
                  Yes, Deactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Permanent Data Removal
          </CardTitle>
          <CardDescription>
            Permanently erase all sites, cleaners, audits, and operational history from the database. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                Permanently Delete All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-destructive">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">CRITICAL ACTION: Permanent Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  This will recursively delete every single record associated with **{userProfile.name}**. 
                  <br /><br />
                  - All Sites and Consumables will be wiped.
                  - All Cleaner profiles and holiday records will be removed.
                  - All Audit history and Schedules will be gone forever.
                  <br /><br />
                  <strong>Are you absolutely sure? This action is irreversible.</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Everything Forever
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
