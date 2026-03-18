'use client';

import { useState, useMemo } from 'react';
import type { Site, AuditStatus, MonthlyAudit } from '@/lib/data';
import { auditStatuses } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parseISO, subMonths, addMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';


interface AuditsTabProps {
  sites: Site[];
  monthlyAudits: MonthlyAudit[];
  onSetAudit: (siteId: string, date: Date, auditData: Partial<Omit<MonthlyAudit, 'id' | 'siteId' | 'month' | 'year'>>) => void;
}

export default function AuditsTab({ sites, monthlyAudits, onSetAudit }: AuditsTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const auditsForMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    return monthlyAudits.filter(audit => audit.year === year && audit.month === month);
  }, [monthlyAudits, currentDate]);


  const handleScoreChange = (siteId: string, scoreString: string) => {
    const score = scoreString === '' ? undefined : parseInt(scoreString, 10);
    if (score !== undefined && (score < 0 || score > 100)) return;

    const updateData: Partial<Omit<MonthlyAudit, 'id'>> = { score };

    if (score !== undefined) {
        updateData.status = 'Completed';
        updateData.completedDate = format(new Date(), 'yyyy-MM-dd');
    }
    
    onSetAudit(siteId, currentDate, updateData);
  };
  
  const handleStatusChange = (siteId: string, newStatus: AuditStatus) => {
    const updateData: Partial<Omit<MonthlyAudit, 'id'>> = { status: newStatus };
    if (newStatus !== 'Completed') {
      updateData.score = undefined;
      updateData.completedDate = undefined;
    }
    onSetAudit(siteId, currentDate, updateData);
  };
  
  const handleNotesChange = (siteId: string, notes: string) => {
    onSetAudit(siteId, currentDate, { notes });
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
                <CardTitle>Site Audits</CardTitle>
                <CardDescription>Track and score audits for each site. Site status will be updated based on the score.</CardDescription>
            </div>
            <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium text-center w-32">{format(currentDate, 'MMMM yyyy')}</span>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Site</TableHead>
                <TableHead className="w-[20%]">Audit Status</TableHead>
                <TableHead className="w-[15%]">Audit Score (%)</TableHead>
                <TableHead className="w-[15%]">Completed Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.length > 0 ? sites.map((site) => {
                const audit = auditsForMonth.find(a => a.siteId === site.id);
                return (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium align-top py-4">{site.name}</TableCell>
                    <TableCell className="align-top py-4">
                      <Select
                        value={audit?.status || 'Not Booked'}
                        onValueChange={(newStatus: AuditStatus) => handleStatusChange(site.id, newStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {auditStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <Input
                          type="number"
                          placeholder="Score"
                          value={audit?.score ?? ''}
                          onChange={(e) => handleScoreChange(site.id, e.target.value)}
                          min="0"
                          max="100"
                          className="w-24"
                        />
                    </TableCell>
                    <TableCell className="align-top py-4 text-sm text-muted-foreground">
                      {audit?.completedDate ? format(parseISO(audit.completedDate), 'PPP') : 'N/A'}
                    </TableCell>
                    <TableCell className="py-2 align-top">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="notes" className="border-b-0">
                          <AccordionTrigger className="py-2 text-sm font-normal hover:no-underline">
                              {audit?.notes ? 'View/Edit Notes' : 'Add Notes'}
                          </AccordionTrigger>
                          <AccordionContent>
                            <Textarea
                              placeholder="Add audit notes..."
                              value={audit?.notes || ''}
                              onChange={(e) => handleNotesChange(site.id, e.target.value)}
                              className="w-full min-h-[60px] resize-y"
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No sites found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
