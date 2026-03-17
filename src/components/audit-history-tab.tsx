'use client';

import type { Site } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface AuditHistoryTabProps {
  sites: Site[];
  onResetAudits: () => void;
}

export default function AuditHistoryTab({ sites, onResetAudits }: AuditHistoryTabProps) {
  
  const getScoreBadgeVariant = (score: number) => {
    if (score <= 95) return 'destructive';
    if (score >= 99) return 'success';
    return 'secondary'; // For scores between 96-98
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <CardTitle>Audit History</CardTitle>
            <CardDescription>View past audit scores to track site improvement over time.</CardDescription>
        </div>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline">Start New Monthly Audits</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to start a new month?</AlertDialogTitle>
                <AlertDialogDescription>
                This will reset the current audit status and score for all sites, archiving the current data if it hasn't been already. This action is intended to be done at the beginning of each month. It cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onResetAudits}>Confirm & Start New Month</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        {sites.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-2">
            {sites.map(site => (
              <AccordionItem key={site.id} value={site.id} className="border rounded-md px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-medium">{site.name}</span>
                </AccordionTrigger>
                <AccordionContent>
                  {site.auditHistory && site.auditHistory.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[30%]">Date</TableHead>
                                <TableHead className="w-[20%]">Score</TableHead>
                                <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...site.auditHistory].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()).map((history, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{format(parseISO(history.date), 'PPP')}</TableCell>
                                        <TableCell>
                                            <Badge variant={getScoreBadgeVariant(history.score)}>{history.score}%</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{history.notes || 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No audit history for this site.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-center text-muted-foreground py-8">No sites available.</p>
        )}
      </CardContent>
    </Card>
  );
}

    