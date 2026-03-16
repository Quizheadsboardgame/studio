'use client';

import { useState, useMemo } from 'react';
import type { Cleaner, Leave, Cover } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface LeaveCoverTabProps {
  cleaners: Cleaner[];
  leave: Leave[];
  covers: Cover[];
  onAddLeave: (leaveData: Omit<Leave, 'id' | 'days'>, startDate: Date, endDate: Date) => void;
  onDeleteLeave: (leave: Leave) => void;
  onAddCover: (coverData: Omit<Cover, 'id'>) => void;
  onRemoveCover: (coverId: string) => void;
}

function LeaveBookingDialog({ cleaners, onAddLeave }: { cleaners: Cleaner[], onAddLeave: LeaveCoverTabProps['onAddLeave'] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
  const [leaveType, setLeaveType] = useState<'holiday' | 'sick'>('holiday');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!selectedCleanerId || !startDate) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a cleaner and a start date.' });
      return;
    }

    const fromDate = startDate;
    const toDate = endDate || startDate;

    if (toDate < fromDate) {
        toast({ variant: 'destructive', title: 'Invalid Date Range', description: 'End date cannot be before the start date.' });
        return;
    }

    const cleanerName = cleaners.find(c => c.id === selectedCleanerId)?.name || 'Unknown Cleaner';
    onAddLeave({ cleanerId: selectedCleanerId, cleanerName, type: leaveType, startDate: format(fromDate, 'yyyy-MM-dd'), endDate: format(toDate, 'yyyy-MM-dd') }, fromDate, toDate);
    
    // Reset form and close dialog
    setIsOpen(false);
    setSelectedCleanerId('');
    setLeaveType('holiday');
    setStartDate(undefined);
    setEndDate(undefined);
    toast({ title: 'Leave Booked', description: `${leaveType === 'holiday' ? 'Holiday' : 'Sickness'} for ${cleanerName} has been logged.` });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Book Leave / Log Sickness</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Leave or Log Sickness</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cleaner" className="text-right">Cleaner</Label>
            <Select value={selectedCleanerId} onValueChange={setSelectedCleanerId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a cleaner" />
              </SelectTrigger>
              <SelectContent>
                {cleaners.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <Select value={leaveType} onValueChange={(value: 'holiday' | 'sick') => setLeaveType(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="sick">Sickness</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-date" className="text-right">
              Start Date
            </Label>
            <DatePicker
              date={startDate}
              onDateChange={setStartDate}
              className="col-span-3"
              placeholder="Select start date"
              modal={false}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-date" className="text-right">
              End Date
            </Label>
            <DatePicker
              date={endDate}
              onDateChange={setEndDate}
              className="col-span-3"
              placeholder="(Optional) Select end date"
              modal={false}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CoverArrangement({ leaveItem, cleaners, covers, onAddCover, onRemoveCover }: { leaveItem: Leave, cleaners: Cleaner[], covers: Cover[], onAddCover: LeaveCoverTabProps['onAddCover'], onRemoveCover: LeaveCoverTabProps['onRemoveCover'] }) {
  const { toast } = useToast();
  const [coveringCleanerId, setCoveringCleanerId] = useState('');
  
  const absentDates = useMemo(() => eachDayOfInterval({ start: parseISO(leaveItem.startDate), end: parseISO(leaveItem.endDate) }), [leaveItem]);
  const availableCleaners = useMemo(() => cleaners.filter(c => c.id !== leaveItem.cleanerId), [cleaners, leaveItem.cleanerId]);
  
  const handleAddCover = (date: Date) => {
    if (!coveringCleanerId) {
      toast({ variant: 'destructive', title: 'No Cleaner Selected', description: 'Please select a cleaner to provide cover.' });
      return;
    }
    const coveringCleanerName = cleaners.find(c => c.id === coveringCleanerId)?.name || 'Unknown';
    onAddCover({
        leaveId: leaveItem.id,
        originalCleanerName: leaveItem.cleanerName,
        date: format(date, 'yyyy-MM-dd'),
        coveringCleanerId,
        coveringCleanerName,
    });
    setCoveringCleanerId('');
    toast({ title: 'Cover Assigned', description: `${coveringCleanerName} will cover for ${leaveItem.cleanerName} on ${format(date, 'PPP')}.`});
  };
  
  return (
    <div className="space-y-4">
        <h4 className="font-semibold text-foreground">Assign Cover</h4>
        {absentDates.map(date => {
            const coverForDate = covers.find(c => c.leaveId === leaveItem.id && c.date === format(date, 'yyyy-MM-dd'));
            return (
                <div key={date.toISOString()} className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 border rounded-md">
                   <p className="font-medium">{format(date, 'eeee, PPP')}</p>
                   {coverForDate ? (
                       <div className="flex items-center gap-2">
                           <p className="text-sm text-muted-foreground">Covered by: <span className="font-semibold text-primary">{coverForDate.coveringCleanerName}</span></p>
                           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveCover(coverForDate.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                       </div>
                   ) : (
                       <div className="flex items-center gap-2">
                            <Select value={coveringCleanerId} onValueChange={setCoveringCleanerId}>
                                <SelectTrigger className="w-[180px] h-8">
                                    <SelectValue placeholder="Select cover" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCleaners.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                           <Button size="sm" className="h-8" onClick={() => handleAddCover(date)}>Assign</Button>
                       </div>
                   )}
                </div>
            )
        })}
    </div>
  );
}


export default function LeaveCoverTab({ cleaners, leave, covers, onAddLeave, onDeleteLeave, onAddCover, onRemoveCover }: LeaveCoverTabProps) {
  
  const upcomingLeave = useMemo(() => {
    return leave.filter(l => parseISO(l.endDate) >= new Date()).sort((a,b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
  }, [leave]);
  
  const sortedCovers = useMemo(() => {
    return covers.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [covers]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Leave & Cover Management</CardTitle>
            <CardDescription>Track holidays and sickness, and arrange cover for absent cleaners.</CardDescription>
          </div>
          <LeaveBookingDialog cleaners={cleaners} onAddLeave={onAddLeave} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="balances">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="balances">Holiday Balances</TabsTrigger>
            <TabsTrigger value="absences">Upcoming Absences</TabsTrigger>
            <TabsTrigger value="covers">Cover Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="balances" className="mt-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cleaner</TableHead>
                    <TableHead className="text-center">Allowance</TableHead>
                    <TableHead className="text-center">Taken</TableHead>
                    <TableHead className="text-center">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cleaners.map(cleaner => {
                    const remaining = (cleaner.holidayAllowance || 20) - (cleaner.holidayTaken || 0);
                    return (
                      <TableRow key={cleaner.id}>
                        <TableCell className="font-medium">{cleaner.name}</TableCell>
                        <TableCell className="text-center">{cleaner.holidayAllowance || 20}</TableCell>
                        <TableCell className="text-center">{cleaner.holidayTaken || 0}</TableCell>
                        <TableCell className={`text-center font-bold ${remaining < 5 ? 'text-destructive' : 'text-accent'}`}>{remaining}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="absences" className="mt-4">
             {upcomingLeave.length > 0 ? (
                 <div className="space-y-4">
                    {upcomingLeave.map(item => (
                        <Card key={item.id}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-4">
                                        <CardTitle>{item.cleanerName}</CardTitle>
                                        <Badge variant={item.type === 'holiday' ? 'secondary' : 'destructive'}>{item.type}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{format(parseISO(item.startDate), 'PPP')} - {format(parseISO(item.endDate), 'PPP')} ({item.days} {item.days > 1 ? 'days' : 'day'})</p>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => onDeleteLeave(item)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </CardHeader>
                            <CardContent>
                                <CoverArrangement leaveItem={item} cleaners={cleaners} covers={covers} onAddCover={onAddCover} onRemoveCover={onRemoveCover}/>
                            </CardContent>
                        </Card>
                    ))}
                 </div>
             ) : (
                <div className="text-center text-muted-foreground py-12">No upcoming absences.</div>
             )}
          </TabsContent>
          
          <TabsContent value="covers" className="mt-4">
             {sortedCovers.length > 0 ? (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Cleaner on Leave</TableHead>
                                <TableHead>Covering Cleaner</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedCovers.map(cover => (
                                <TableRow key={cover.id}>
                                    <TableCell>{format(parseISO(cover.date), 'eeee, PPP')}</TableCell>
                                    <TableCell>{cover.originalCleanerName}</TableCell>
                                    <TableCell className="font-semibold text-primary">{cover.coveringCleanerName}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
             ) : (
                <div className="text-center text-muted-foreground py-12">No cover has been assigned for upcoming absences.</div>
             )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
