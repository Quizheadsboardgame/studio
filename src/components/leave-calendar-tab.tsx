'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Cleaner, Leave, ScheduleEntry } from '@/lib/data';
import { type DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format, parseISO, isSameDay, isFuture, isToday, addDays, eachDayOfInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';

interface LeaveCalendarTabProps {
  cleaners: Cleaner[];
  leave: Leave[];
  schedule: ScheduleEntry[];
  onAddLeave: (leaveData: Omit<Leave, 'id' | 'coverAssignments'>) => void;
  onDeleteLeave: (leave: Leave) => void;
  onUpdateLeave: (leaveId: string, updatedData: Partial<Omit<Leave, 'id'>>) => void;
}

function AddLeaveForm({ cleaners, onAddLeave }: { cleaners: Cleaner[], onAddLeave: LeaveCalendarTabProps['onAddLeave'] }) {
    const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
    const [leaveType, setLeaveType] = useState<'holiday' | 'sick'>('holiday');
    const [startDate, setStartDate] = useState<string>('');
    const [numberOfDays, setNumberOfDays] = useState(1);
    const { toast } = useToast();

    const bankHolidays = useMemo(() => [
        // 2024
        new Date('2024-01-01'), new Date('2024-03-29'), new Date('2024-04-01'),
        new Date('2024-05-06'), new Date('2024-05-27'), new Date('2024-08-26'),
        new Date('2024-12-25'), new Date('2024-12-26'),
        // 2025
        new Date('2025-01-01'), new Date('2025-04-18'), new Date('2025-04-21'),
        new Date('2025-05-05'), new Date('2025-05-26'), new Date('2025-08-25'),
        new Date('2025-12-25'), new Date('2025-12-26'),
    ], []);

    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    };

    const isBankHoliday = useCallback((date: Date) => {
        return bankHolidays.some(bh => isSameDay(bh, date));
    }, [bankHolidays]);


    const handleSubmit = () => {
        if (!selectedCleanerId || !startDate) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a cleaner and a start date.' });
            return;
        }

        const cleanerName = cleaners.find(c => c.id === selectedCleanerId)?.name || 'Unknown Cleaner';
        
        const startAsDate = parseISO(startDate);
        const interval = { start: startAsDate, end: addDays(startAsDate, Math.max(0, numberOfDays - 1)) };
        const daysToBook = eachDayOfInterval(interval);
        
        let daysAdded = 0;
        daysToBook.forEach(day => {
            if (!isWeekend(day) && !isBankHoliday(day)) {
                onAddLeave({
                    cleanerId: selectedCleanerId,
                    cleanerName,
                    type: leaveType,
                    date: format(day, 'yyyy-MM-dd'),
                });
                daysAdded++;
            }
        });

        if (daysAdded > 0) {
            toast({ title: 'Leave Booked', description: `${daysAdded} day(s) of ${leaveType} for ${cleanerName} have been logged.` });
            // Reset form
            setSelectedCleanerId('');
            setStartDate('');
            setNumberOfDays(1);
        } else {
            toast({ variant: 'destructive', title: 'No working days selected', description: 'The selected date range only contains weekends or bank holidays.' });
        }
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Add Absence</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="cleaner">Cleaner</Label>
                    <Select value={selectedCleanerId} onValueChange={setSelectedCleanerId}>
                        <SelectTrigger id="cleaner"><SelectValue placeholder="Select a cleaner" /></SelectTrigger>
                        <SelectContent>{cleaners.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={leaveType} onValueChange={(value: 'holiday' | 'sick') => setLeaveType(value)}>
                        <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="holiday">Holiday</SelectItem>
                            <SelectItem value="sick">Sickness</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="num-days">Number of Days</Label>
                    <Input 
                        id="num-days"
                        type="number"
                        value={numberOfDays}
                        onChange={(e) => setNumberOfDays(parseInt(e.target.value, 10) || 1)}
                        min="1"
                    />
                </div>
            </div>
            <div className="flex justify-end">
                 <Button onClick={handleSubmit}>Book Absence</Button>
            </div>
        </div>
    );
}

export default function LeaveCalendarTab({ cleaners, leave, schedule, onAddLeave, onDeleteLeave, onUpdateLeave }: LeaveCalendarTabProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { toast } = useToast();
  
  const getRemainingHolidays = (cleaner: Cleaner) => {
    if (!cleaner) return 'N/A';
    return `${(cleaner.holidayAllowance || 20) - (cleaner.holidayTaken || 0)}`;
  }

  const upcomingAbsences = useMemo(() => {
    if (!dateRange || !dateRange.from) {
      return [];
    }
    
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0,0,0,0);

    const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    toDate.setHours(23, 59, 59, 999);
    
    const absences = leave
      .filter(l => {
        const leaveDate = parseISO(l.date);
        return leaveDate >= fromDate && leaveDate <= toDate;
      })
      .sort((a, b) => {
        const dateA = parseISO(a.date).getTime();
        const dateB = parseISO(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return a.cleanerName.localeCompare(b.cleanerName);
      });

    // Group shifts by leave record to avoid duplicating cleaner entries
    const detailedAbsences = absences.map(l => {
      const cleanerShifts = schedule.filter(s => s.cleaner === l.cleanerName);
      return {
        ...l,
        shifts: cleanerShifts.map((s, index) => ({
          site: s.site,
          time: `${s.start} - ${s.finish}`,
          uniqueId: `${l.id}-${s.id || index}`
        }))
      };
    });

    return detailedAbsences;
  }, [leave, schedule, dateRange]);
  
  const scheduledCleaners = useMemo(() => new Set(schedule.map(s => s.cleaner)), [schedule]);

  const handleAssignCover = (leaveId: string, site: string, coverCleanerName: string) => {
    const leaveDoc = leave.find(l => l.id === leaveId);
    if (!leaveDoc) return;

    const isActuallyCovered = coverCleanerName && coverCleanerName !== '__NONE__';
    
    let existingAssignments = leaveDoc.coverAssignments || [];
    // Remove any existing assignment for this site
    existingAssignments = existingAssignments.filter(a => a.site !== site);

    // If a new cover cleaner is assigned, add the new assignment
    if (isActuallyCovered) {
        existingAssignments.push({ site: site, coverCleanerName: coverCleanerName });
    }

    onUpdateLeave(leaveId, { coverAssignments: existingAssignments });
    
    if (isActuallyCovered) {
        toast({
          title: 'Cover Assigned',
          description: `${coverCleanerName} is now covering at ${site}.`,
        });
    } else {
        toast({
          title: 'Cover Removed',
          description: `The shift at ${site} is now marked as uncovered.`,
        });
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
            <CardTitle>Leave Management</CardTitle>
            <CardDescription>Book new absences and view leave balances. Weekends and bank holidays are automatically excluded.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <AddLeaveForm cleaners={cleaners} onAddLeave={onAddLeave} />

            <div className="w-full">
                <h3 className="text-lg font-semibold mb-2">Leave Balances</h3>
                 <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                         <thead className="sticky top-0 bg-muted">
                            <tr className="border-b">
                                <th className="py-2 px-3 text-left font-medium">Cleaner</th>
                                <th className="py-2 px-3 text-center font-medium">Allowance</th>
                                <th className="py-2 px-3 text-center font-medium">Taken</th>
                                <th className="py-2 px-3 text-center font-medium">Remaining</th>
                                <th className="py-2 px-3 text-center font-medium">Sick Days</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cleaners.map(cleaner => (
                                <tr key={cleaner.id} className="border-b last:border-b-0">
                                    <td className="py-2 px-3 font-medium">{cleaner.name}</td>
                                    <td className="py-2 px-3 text-center font-bold">{cleaner.holidayAllowance || 20}</td>
                                    <td className="py-2 px-3 text-center font-bold">{cleaner.holidayTaken || 0}</td>
                                    <td className="py-2 px-3 text-center font-bold">{getRemainingHolidays(cleaner)}</td>
                                    <td className="py-2 px-3 text-center font-bold">{cleaner.sickDaysTaken || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Upcoming Absences & Cover</CardTitle>
          <CardDescription>Assign cover for upcoming holidays and sickness. Use the date picker to search for specific dates.</CardDescription>
          <div className="pt-4">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          </div>
        </CardHeader>
        <CardContent>
          {upcomingAbsences.length > 0 ? (
            <div className="space-y-4">
              {upcomingAbsences.map(leaveEntry => {
                return (
                  <div key={leaveEntry.id} className="p-4 border rounded-lg space-y-4 bg-card">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-lg">{leaveEntry.cleanerName}</p>
                            <p className="text-sm text-muted-foreground">{format(parseISO(leaveEntry.date), 'EEEE, do MMMM yyyy')}</p>
                        </div>
                        <Badge variant={leaveEntry.type === 'holiday' ? 'secondary' : 'destructive'}>{leaveEntry.type}</Badge>
                    </div>

                    {leaveEntry.shifts.length > 0 ? (
                      <div className="space-y-3 pl-4 border-l-2 ml-1">
                        {leaveEntry.shifts.map(shift => {
                          const currentCover = leaveEntry.coverAssignments?.find(a => a.site === shift.site)?.coverCleanerName || '__NONE__';
                          const cleanersAtThisSite = new Set(schedule.filter(s => s.site === shift.site).map(s => s.cleaner));

                          return (
                            <div key={shift.uniqueId} className="grid grid-cols-1 md:grid-cols-3 items-center gap-x-4 gap-y-2 py-2">
                              <div className="md:col-span-2">
                                <p className="font-medium">{shift.site}</p>
                                <p className="text-sm text-muted-foreground">{shift.time}</p>
                              </div>
                              <div className="md:col-span-1">
                                <Label className="text-xs font-medium text-muted-foreground">Assign Cover</Label>
                                <Select
                                    value={currentCover}
                                    onValueChange={(cleanerName) => handleAssignCover(leaveEntry.id, shift.site, cleanerName)}
                                  >
                                    <SelectTrigger>
                                       <SelectValue placeholder="Select a cleaner to cover..." />
                                     </SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="__NONE__">
                                            <span className="text-muted-foreground">None (Uncovered)</span>
                                        </SelectItem>
                                        {cleaners
                                            .filter(c => c.name !== leaveEntry.cleanerName)
                                            .map(c => {
                                                const isSuitable = cleanersAtThisSite.has(c.name) || !scheduledCleaners.has(c.name);
                                                return (
                                                  <SelectItem key={c.id} value={c.name}>
                                                      {c.name} {isSuitable && '⭐'}
                                                 </SelectItem>
                                                )
                                            })}
                                      </SelectContent>
                                   </Select>
                              </div>
                            </div>
                           );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground pl-5">No scheduled shifts found for this cleaner.</p>
                    )}
                  </div>
                );
              })}
             </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No upcoming absences found for the selected date range.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
