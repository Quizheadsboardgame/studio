'use client';

import { useMemo } from 'react';
import type { Site, Cleaner, ActionPlan } from '@/lib/data';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface DailySummaryTabProps {
  sites: Site[];
  cleaners: Cleaner[];
  actionPlans: ActionPlan[];
}

export default function DailySummaryTab({ sites, cleaners, actionPlans }: DailySummaryTabProps) {
  const { toast } = useToast();

  const sitesWithNotes = useMemo(() => {
    return sites.filter(site => site.notes && site.notes.trim() !== '');
  }, [sites]);

  const cleanersWithNotes = useMemo(() => {
    return cleaners.filter(cleaner => cleaner.notes && cleaner.notes.trim() !== '');
  }, [cleaners]);
  
  const tasksDueToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return actionPlans
      .flatMap(plan => 
        plan.tasks
          .filter(task => task.dueDate === today && !task.completed)
          .map(task => ({ ...task, targetName: plan.targetName }))
      );
  }, [actionPlans]);

  const hasContent = useMemo(() => {
    return sitesWithNotes.length > 0 || cleanersWithNotes.length > 0 || tasksDueToday.length > 0;
  }, [sitesWithNotes, cleanersWithNotes, tasksDueToday]);

  const handleRefreshToast = () => {
    toast({
      title: "Summary Refreshed",
      description: "The summary has been updated with the latest data.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          A summary of all notes and tasks due today. Updates automatically.
        </p>
        <Button onClick={handleRefreshToast} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {hasContent ? (
        <div className="rounded-lg border bg-card text-card-foreground p-6">
          <div className="space-y-6">
             {tasksDueToday.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-card-foreground">Action Plan Tasks Due Today</h3>
                <div className="space-y-2">
                  {tasksDueToday.map(task => (
                    <div key={task.id}>
                      <p className="font-medium text-foreground">{task.targetName}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">&bull; {task.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sitesWithNotes.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-card-foreground">Site Notes</h3>
                <div className="space-y-2">
                  {sitesWithNotes.map(site => (
                    <div key={site.id}>
                      <p className="font-medium text-foreground">{site.name}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{site.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cleanersWithNotes.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-card-foreground">Cleaner Notes</h3>
                <div className="space-y-2">
                  {cleanersWithNotes.map(cleaner => (
                    <div key={cleaner.id}>
                      <p className="font-medium text-foreground">{cleaner.name}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cleaner.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card text-card-foreground p-6 min-h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">No notes or tasks due today.</p>
        </div>
      )}
    </div>
  );
}
