'use client';

import { useState, useTransition } from 'react';
import type { Site } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { generateDailyOperationalReport } from '@/ai/flows/generate-daily-operational-report';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from './ui/skeleton';

interface DailySummaryTabProps {
  sites: Site[];
}

export default function DailySummaryTab({ sites }: DailySummaryTabProps) {
  const [report, setReport] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateReport = () => {
    startTransition(async () => {
      setReport('');
      
      const relevantSites = sites
        .filter(site => site.status !== 'N/A')
        .map(site => ({ name: site.name, status: site.status }));

      if (relevantSites.length === 0) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "Please update site statuses before generating a report.",
        });
        return;
      }

      try {
        const result = await generateDailyOperationalReport({ sites: relevantSites });
        setReport(result);
      } catch (error) {
        console.error('Failed to generate report:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate the report. Please try again.",
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-2 sm:space-y-0">
        <Button onClick={handleGenerateReport} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isPending ? 'Generating...' : 'Generate Report'}
        </Button>
        <p className="text-sm text-muted-foreground">AI-powered summary of the current site statuses.</p>
      </div>

      {(isPending || report) && (
        <div className="rounded-lg border bg-card text-card-foreground p-6 min-h-[200px]">
          {isPending && (
            <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
            </div>
          )}
          {report && (
            <div className="text-sm text-foreground whitespace-pre-wrap font-mono">
              {report}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
