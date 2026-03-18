'use client';

import { useState } from 'react';
import type { Site } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { generateDailyOperationalReport } from '@/ai/flows/generate-daily-operational-report';
import { Bot, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface GeneratedReportTabProps {
  sites: Site[];
}

export default function GeneratedReportTab({ sites }: GeneratedReportTabProps) {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    setReport('');

    try {
      const reportInput = {
        sites: sites.map(s => ({
          name: s.name,
          status: s.status,
          notes: s.notes,
        })),
      };
      const result = await generateDailyOperationalReport(reportInput);
      setReport(result);
    } catch (e) {
      console.error(e);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
                <CardTitle>AI-Generated Daily Report</CardTitle>
                <CardDescription>
                Generate a natural language summary of all site statuses and notes.
                </CardDescription>
            </div>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
                {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
            <div className="space-y-2 p-4 border rounded-lg bg-background/50 min-h-[240px]">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                 <Skeleton className="h-4 w-3/4 mt-4" />
                <Skeleton className="h-4 w-full" />
            </div>
        )}
        {error && <p className="text-destructive text-center py-10">{error}</p>}
        {report && (
          <div className="p-4 border rounded-lg bg-background/50 min-h-[240px]">
            <pre className="whitespace-pre-wrap font-body text-sm">{report}</pre>
          </div>
        )}
        {!isLoading && !report && !error && (
            <div className="flex items-center justify-center h-60 border-2 border-dashed rounded-lg">
                <div className="text-center">
                    <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Click "Generate Report" to create a summary.</p>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
