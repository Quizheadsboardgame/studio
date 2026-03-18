'use client';

import type { Site, MonthlyAudit } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface AuditHistoryTabProps {
  sites: Site[];
  monthlyAudits: MonthlyAudit[];
}

export default function AuditHistoryTab({ sites, monthlyAudits }: AuditHistoryTabProps) {
  
  const getScoreBadgeVariant = (score: number) => {
    if (score <= 95) return 'destructive';
    if (score >= 99) return 'success';
    return 'secondary'; // For scores between 96-98
  }

  return (
    <Card>
      <CardHeader>
        <div>
            <CardTitle>Audit History</CardTitle>
            <CardDescription>View past audit scores to track site improvement over time.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {sites.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-2">
            {sites.map(site => {
                const siteAudits = monthlyAudits.filter(a => a.siteId === site.id && a.status === 'Completed' && a.score !== undefined && a.score !== null);

                return (
                    <AccordionItem key={site.id} value={site.id} className="border rounded-md px-4">
                        <AccordionTrigger className="hover:no-underline">
                        <span className="font-medium">{site.name}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                        {siteAudits.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                        <TableHead className="w-[50%]">Date</TableHead>
                                        <TableHead className="w-[50%]">Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[...siteAudits].sort((a, b) => {
                                            if (!a.bookedDate || !b.bookedDate) return 0;
                                            return parseISO(b.bookedDate).getTime() - parseISO(a.bookedDate).getTime()
                                        }).map((audit, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {audit.bookedDate ? format(parseISO(audit.bookedDate), 'PPP') : 'N/A'}
                                                    {audit.bookedTime && <span className="text-muted-foreground text-xs"> at {audit.bookedTime}</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getScoreBadgeVariant(audit.score!)}>{audit.score}%</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">No completed audits for this site.</p>
                        )}
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
          </Accordion>
        ) : (
          <p className="text-center text-muted-foreground py-8">No sites available.</p>
        )}
      </CardContent>
    </Card>
  );
}
