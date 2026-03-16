'use client';

import { useState, useMemo } from 'react';
import type { Cleaner, Leave } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Trash2 } from 'lucide-react';
import { format, parseISO, isSameDay, isFuture, startOfToday, isToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface LeaveCalendarTabProps {
  cleaners: Cleaner[];
  leave: Leave[];
  onAddLeave: (leaveData: Omit<Leave, 'id'>) => void;
  onDeleteLeave: (leave: Leave) => void;
  onUpdateLeave: (leaveId: string, updatedData: Partial<Omit<Leave, 'id'>>) => void;
}

function AddLeaveForm({ cleaners, selectedDate, onAddLeave, onClose }: { cleaners: Cleaner[], selectedDate: Date, onAddLeave: LeaveCalendarTabProps['onAddLeave'], onClose: () => void }) {
    const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
    const [leaveType, setLeaveType] = useState<'holiday' | 'sick'>('holiday');
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!selectedCleanerId) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a cleaner.' });
            return;
        }

        const cleanerName = cleaners.find(c => c.id === selectedCleanerId)?.name || 'Unknown Cleaner';
        
        onAddLeave({
            cleanerId: selectedCleanerId,
            cleanerName,
            type: leaveType,
            date: format(selectedDate, 'yyyy-MM-dd'),
        });

        toast({ title: 'Leave Added', description: `${leaveType} for ${cleanerName} on ${format(selectedDate, 'PPP')} has been logged.` });
        onClose();
    };

    return (
        <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold">Add Absence</h4>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cleaner" className="text-right">Cleaner</Label>
                <Select value={selectedCleanerId} onValueChange={setSelectedCleanerId}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a cleaner" /></SelectTrigger>
                    <SelectContent>{cleaners.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Type</Label>
                <Select value={leaveType} onValueChange={(value: 'holiday' | 'sick') => setLeaveType(value)}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="sick">Sickness</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end gap-2">
                 <Button variant="ghost" onClick={onClose}>Cancel</Button>
                 <Button onClick={handleSubmit}>Add Absence</Button>
            </div>
        </div>
    );
}

export default function LeaveCalendarTab({ cleaners, leave, onAddLeave, onDeleteLeave, onUpdateLeave }: LeaveCalendarTabProps) {
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const handleDayClick = (day: Date) => {
      setSelectedDay(day);
      setIsDialogOpen(true);
  };
  
  const leaveOnSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return leave.filter(l => isSameDay(parseISO(l.date), selectedDay));
  }, [leave, selectedDay]);

  const holidays = useMemo(() => leave.filter(l => l.type === 'holiday').map(l => parseISO(l.date)), [leave]);
  const sickDays = useMemo(() => leave.filter(l => l.type === 'sick').map(l => parseISO(l.date)), [leave]);

  const modifiers = {
      holiday: holidays,
      sick: sickDays,
  };
  const modifierStyles = {
      holiday: { backgroundColor: 'hsl(var(--chart-4))', color: 'hsl(var(--primary-foreground))', borderRadius: '0.25rem' },
      sick: { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', borderRadius: '0.25rem' }
  };
  
  const getRemainingHolidays = (cleaner: Cleaner) => {
    if (!cleaner) return 'N/A';
    return `${(cleaner.holidayAllowance || 20) - (cleaner.holidayTaken || 0)}`;
  }

  const upcomingAbsences = useMemo(() => {
    const today = startOfToday();
    return leave
      .filter(l => isFuture(parseISO(l.date)) || isToday(parseISO(l.date)))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [leave]);

  const handleAssignCover = (leaveId: string, coverCleanerName: string) => {
    const isActuallyCovered = coverCleanerName && coverCleanerName !== '__NONE__';
    const finalCoverName = isActuallyCovered ? coverCleanerName : '';

    onUpdateLeave(leaveId, { coverCleanerName: finalCoverName, isCovered: isActuallyCovered });
    
    if (isActuallyCovered) {
        toast({
          title: 'Cover Assigned',
          description: `${finalCoverName} is now covering this shift.`,
        });
    } else {
        toast({
          title: 'Cover Removed',
          description: `The shift is now marked as uncovered.`,
        });
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
            <CardTitle>Leave Calendar</CardTitle>
            <CardDescription>Click a date to add holiday or log sickness. View leave balances below.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-8">
            <div className="flex-grow flex justify-center">
                 <Calendar
                    mode="single"
                    selected={selectedDay}
                    onDayClick={handleDayClick}
                    month={month}
                    onMonthChange={setMonth}
                    modifiers={modifiers}
                    modifiersClassNames={{
                      holiday: 'font-semibold',
                      sick: 'font-semibold'
                    }}
                    className="rounded-md border"
                />
            </div>
            <div className="w-full md:w-1/3">
                <h3 className="text-lg font-semibold mb-2">Leave Balances</h3>
                 <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                         <thead className="sticky top-0 bg-muted">
                            <tr className="border-b">
                                <th className="py-2 px-3 text-left font-medium">Cleaner</th>
                                <th className="py-2 px-3 text-center font-medium">Holidays Left</th>
                                <th className="py-2 px-3 text-center font-medium">Sick Days</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cleaners.map(cleaner => (
                                <tr key={cleaner.id} className="border-b last:border-b-0">
                                    <td className="py-2 px-3 font-medium">{cleaner.name}</td>
                                    <td className={`py-2 px-3 text-center font-bold`}>{getRemainingHolidays(cleaner)}</td>
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
          <CardDescription>Assign cover for upcoming holidays and sickness.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingAbsences.length > 0 ? (
            <div className="space-y-4">
              {upcomingAbsences.map(l => (
                <div key={l.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-3 border rounded-lg">
                  <div className="font-medium">
                    <p>{l.cleanerName}</p>
                    <p className="text-sm text-muted-foreground">{format(parseISO(l.date), 'EEE, PPP')}</p>
                  </div>
                  <div>
                    <Badge variant={l.type === 'holiday' ? 'secondary' : 'destructive'}>{l.type}</Badge>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Assign Cover</Label>
                    <Select
                      value={l.coverCleanerName || '__NONE__'}
                      onValueChange={(cleanerName) => handleAssignCover(l.id, cleanerName)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cleaner to cover..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__NONE__">
                          <span className="text-muted-foreground">None (Uncovered)</span>
                        </SelectItem>
                        {cleaners
                          .filter(c => c.name !== l.cleanerName)
                          .map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No upcoming absences.</p>
          )}
        </CardContent>
      </Card>

      {selectedDay && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Absences for {format(selectedDay, 'PPP')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {leaveOnSelectedDay.length > 0 ? (
                        <div className="space-y-2">
                           <h4 className="font-semibold">Cleaners on Leave</h4>
                           {leaveOnSelectedDay.map(l => (
                               <div key={l.id} className="flex items-center justify-between p-2 border rounded-md">
                                   <div>
                                       <p className="font-medium">{l.cleanerName}</p>
                                       <Badge variant={l.type === 'holiday' ? 'secondary' : 'destructive'}>{l.type}</Badge>
                                   </div>
                                   <Button size="icon" variant="ghost" onClick={() => onDeleteLeave(l)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                               </div>
                           ))}
                        </div>
                    ) : <p className="text-muted-foreground text-sm text-center py-4">No absences logged for this day.</p>}
                     <AddLeaveForm cleaners={cleaners} selectedDate={selectedDay} onAddLeave={onAddLeave} onClose={() => setIsDialogOpen(false)} />
                </div>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
