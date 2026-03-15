'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Site, Cleaner, ActionPlan } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface DailySummaryTabProps {
  sites: Site[];
  cleaners: Cleaner[];
  actionPlans: ActionPlan[];
}

interface SummaryData {
  sitesWithNotes: Site[];
  cleanersWithNotes: Cleaner[];
  tasksDueToday: (ActionPlan['tasks'][0] & { targetName: string })[];
}

export default function DailySummaryTab({ sites, cleaners, actionPlans }: DailySummaryTabProps) {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    sitesWithNotes: [],
    cleanersWithNotes: [],
    tasksDueToday: [],
  });

  const generateSummary = useCallback(() => {
    const sitesWithNotes = sites.filter(site => site.notes && site.notes.trim() !== '');
    const cleanersWithNotes = cleaners.filter(cleaner => cleaner.notes && cleaner.notes.trim() !== '');
    const today = format(new Date(), 'yyyy-MM-dd');
    const tasksDueToday = actionPlans
      .flatMap(plan => 
        plan.tasks
          .filter(task => task.dueDate === today && !task.completed)
          .map(task => ({ ...task, targetName: plan.targetName }))
      );
    
    setSummaryData({ sitesWithNotes, cleanersWithNotes, tasksDueToday });
  }, [sites, cleaners, actionPlans]);

  useEffect(() => {
    generateSummary();
  }, [generateSummary]);

  const hasContent = summaryData.sitesWithNotes.length > 0 || summaryData.cleanersWithNotes.length > 0 || summaryData.tasksDueToday.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          A summary of all notes and tasks due today.
        </p>
        <Button onClick={generateSummary} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Summary
        </Button>
      </div>

      {hasContent ? (
        <div className="rounded-lg border bg-card text-card-foreground p-6">
          <div className="space-y-6">
             {summaryData.tasksDueToday.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-card-foreground">Action Plan Tasks Due Today</h3>
                <div className="space-y-2">
                  {summaryData.tasksDueToday.map(task => (
                    <div key={task.id}>
                      <p className="font-medium text-foreground">{task.targetName}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">&bull; {task.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summaryData.sitesWithNotes.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-card-foreground">Site Notes</h3>
                <div className="space-y-2">
                  {summaryData.sitesWithNotes.map(site => (
                    <div key={site.id}>
                      <p className="font-medium text-foreground">{site.name}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{site.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summaryData.cleanersWithNotes.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 text-card-foreground">Cleaner Notes</h3>
                <div className="space-y-2">
                  {summaryData.cleanersWithNotes.map(cleaner => (
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
            <p className="text-muted-foreground">No notes or tasks due today. Click refresh to check for updates.</p>
        </div>
      )}
    </div>
  );
}
