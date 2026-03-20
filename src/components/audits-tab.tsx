
'use client';

import { useState, useMemo } from 'react';
import type { Site, AuditStatus, MonthlyAudit } from '@/lib/data';
import { auditStatuses } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, subMonths, addMonths, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';


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

  const completedAuditsCount = useMemo(() => {
    return auditsForMonth.filter(a => a.status === 'Completed').length;
  }, [auditsForMonth]);

  const totalSites = sites.length;
  const completionPercentage = totalSites > 0 ? (completedAuditsCount / totalSites) * 100 : 0;

  const handleAuditorChange = (siteId: string, auditor: string) => {
    onSetAudit(siteId, currentDate, { auditor });
  };

  const handleScoreChange = (siteId: string, scoreString: string) => {
    const scoreValue = scoreString.trim() === '' ? null : parseInt(scoreString, 10);
    if (scoreValue !== null && (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100)) return;
    
    const audit = auditsForMonth.find(a => a.siteId === siteId);
    const updateData: Partial<Omit<MonthlyAudit, 'id'>> = { score: scoreValue };

    if (scoreValue !== null) { // A score is being set
        updateData.status = 'Completed';
        // Only set new booked date if it wasn't set before
        if (!audit?.bookedDate) {
            updateData.bookedDate = format(new Date(), 'yyyy-MM-dd');
        }
    } else { // Score is being cleared to null
        // If it was completed, reset status. Let's use 'Booked'.
        if (audit?.status === 'Completed') {
            updateData.status = 'Booked';
            updateData.bookedDate = null;
        }
    }
    onSetAudit(siteId, currentDate, updateData);
  };
  
  const handleStatusChange = (siteId: string, newStatus: AuditStatus) => {
    const updateData: Partial<Omit<MonthlyAudit, 'id'>> = { status: newStatus };
    if (newStatus !== 'Completed') {
      updateData.score = null;
    }
    if (newStatus === 'Not Booked') {
        updateData.bookedDate = null;
        updateData.bookedTime = '';
        updateData.auditor = 'Unassigned';
    }
    onSetAudit(siteId, currentDate, updateData);
  };
  
  const handleBookedDateChange = (siteId: string, dateString: string | null) => {
    onSetAudit(siteId, currentDate, { bookedDate: dateString });
  };
  
  const handleBookedTimeChange = (siteId: string, time: string) => {
    onSetAudit(siteId, currentDate, { bookedTime: time });
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
        <div className="pt-4 space-y-2">
            <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Monthly Completion</span>
                <span>{Math.round(completionPercentage)}% ({completedAuditsCount} / {totalSites})</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Site</TableHead>
                <TableHead className="w-[18%]">Audit Status</TableHead>
                <TableHead className="w-[17%] hidden md:table-cell">Auditor</TableHead>
                <TableHead className="w-[35%]">Booked</TableHead>
                <TableHead className="w-[10%] text-right">Score (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.length > 0 ? sites.map((site) => {
                const audit = auditsForMonth.find(a => a.siteId === site.id);
                const isEditable = audit?.status && audit.status !== 'Not Booked';
                const isCompleted = audit?.status === 'Completed';

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
                    <TableCell className="align-top py-4 hidden md:table-cell">
                       <Select
                        value={audit?.auditor || 'Unassigned'}
                        onValueChange={(auditor) => handleAuditorChange(site.id, auditor)}
                        disabled={!isEditable && !isCompleted}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select auditor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unassigned">Unassigned</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                          <SelectItem value="Mobile Cleaner">Mobile Cleaner</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                     <TableCell className="align-top py-4">
                       <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Input
                                type="date"
                                value={audit?.bookedDate || ''}
                                onChange={(e) => handleBookedDateChange(site.id, e.target.value || null)}
                                className="w-full"
                                disabled={!isEditable && !isCompleted}
                            />
                            <Input
                                type="time"
                                value={audit?.bookedTime || ''}
                                onChange={(e) => handleBookedTimeChange(site.id, e.target.value)}
                                className="w-full"
                                disabled={!isEditable}
                            />
                       </div>
                    </TableCell>
                    <TableCell className="align-top py-4 text-right">
                      <Input
                          type="number"
                          placeholder="N/A"
                          value={audit?.score ?? ''}
                          onChange={(e) => handleScoreChange(site.id, e.target.value)}
                          min="0"
                          max="100"
                          className="w-24 ml-auto"
                        />
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
