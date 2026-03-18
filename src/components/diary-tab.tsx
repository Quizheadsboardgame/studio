'use client';

import { useState, useMemo } from 'react';
import type { Site, MonthlyAudit, Appointment } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { PlusCircle, Pencil, Trash2, Calendar, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

// Event type for combined view
type DiaryEvent = {
    id: string;
    type: 'audit' | 'appointment';
    date: Date;
    title: string;
    details: string;
    notes?: string;
    raw: Appointment | MonthlyAudit;
};

interface AppointmentDialogProps {
  onSave: (data: Omit<Appointment, 'id'> | (Partial<Omit<Appointment, 'id'>> & { id: string })) => void;
  appointment?: Appointment;
  children: React.ReactNode;
}

function AppointmentDialog({ onSave, appointment, children }: AppointmentDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    
    const [title, setTitle] = useState(appointment?.title || '');
    const [date, setDate] = useState<Date | undefined>(appointment ? parseISO(appointment.date) : undefined);
    const [startTime, setStartTime] = useState(appointment?.startTime || '');
    const [endTime, setEndTime] = useState(appointment?.endTime || '');
    const [notes, setNotes] = useState(appointment?.notes || '');

    const handleSave = () => {
        if (!title || !date) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a title and date.' });
            return;
        }

        const appointmentData = {
            title,
            date: format(date, 'yyyy-MM-dd'),
            startTime,
            endTime,
            notes
        };

        if (appointment) {
            onSave({ id: appointment.id, ...appointmentData });
        } else {
            onSave(appointmentData);
        }
        
        setIsOpen(false);
    };
    
    const handleOpenChange = (open: boolean) => {
        if (open) {
            setTitle(appointment?.title || '');
            setDate(appointment ? parseISO(appointment.date) : new Date());
            setStartTime(appointment?.startTime || '');
            setEndTime(appointment?.endTime || '');
            setNotes(appointment?.notes || '');
        }
        setIsOpen(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>{appointment ? 'Edit' : 'Add'} Appointment</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <DatePicker date={date} onDateChange={setDate} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-time">Start Time</Label>
                            <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-time">End Time</Label>
                            <Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface DiaryTabProps {
  sites: Site[];
  appointments: Appointment[];
  monthlyAudits: MonthlyAudit[];
  onAddAppointment: (data: Omit<Appointment, 'id'>) => void;
  onUpdateAppointment: (id: string, data: Partial<Omit<Appointment, 'id'>>) => void;
  onRemoveAppointment: (id: string) => void;
}

export default function DiaryTab({ sites, appointments, monthlyAudits, onAddAppointment, onUpdateAppointment, onRemoveAppointment }: DiaryTabProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(), to: new Date() });

    const events = useMemo(() => {
        const auditEvents: DiaryEvent[] = monthlyAudits
            .filter(audit => audit.bookedDate)
            .map(audit => {
                const site = sites.find(s => s.id === audit.siteId);
                return {
                    id: audit.id,
                    type: 'audit',
                    date: parseISO(audit.bookedDate!),
                    title: `Audit @ ${site?.name || 'Unknown Site'}`,
                    details: `Status: ${audit.status}${audit.bookedTime ? ` at ${audit.bookedTime}`: ''}`,
                    notes: audit.score ? `Score: ${audit.score}%` : undefined,
                    raw: audit,
                };
            });

        const appointmentEvents: DiaryEvent[] = appointments.map(app => ({
            id: app.id,
            type: 'appointment',
            date: parseISO(app.date),
            title: app.title,
            details: `${app.startTime || ''}${app.endTime ? ` - ${app.endTime}` : ''}`,
            notes: app.notes,
            raw: app,
        }));
        
        const allEvents = [...auditEvents, ...appointmentEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
        
        if (!dateRange?.from) {
          return allEvents;
        }
        
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0,0,0,0);
        let toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        toDate.setHours(23, 59, 59, 999);

        return allEvents.filter(event => event.date >= fromDate && event.date <= toDate);

    }, [monthlyAudits, appointments, sites, dateRange]);

    const groupedEvents = useMemo(() => {
        return events.reduce((acc, event) => {
            const day = format(event.date, 'yyyy-MM-dd');
            if (!acc[day]) {
                acc[day] = [];
            }
            acc[day].push(event);
            return acc;
        }, {} as Record<string, DiaryEvent[]>);
    }, [events]);

    const sortedDays = Object.keys(groupedEvents).sort();

    const handleSaveAppointment = (data: Omit<Appointment, 'id'> | (Partial<Omit<Appointment, 'id'>> & { id: string })) => {
        if ('id' in data) {
            const { id, ...updateData } = data;
            onUpdateAppointment(id, updateData);
        } else {
            onAddAppointment(data);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
                    <div>
                        <CardTitle>Diary</CardTitle>
                        <CardDescription>View upcoming audits and appointments.</CardDescription>
                    </div>
                     <AppointmentDialog onSave={handleSaveAppointment}>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Appointment</Button>
                    </AppointmentDialog>
                </div>
                 <div className="pt-4">
                    <Label className="text-sm font-medium">Filter by date</Label>
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {sortedDays.length > 0 ? (
                    sortedDays.map(day => (
                        <div key={day}>
                            <h3 className="font-semibold text-lg border-b pb-2 mb-4">{format(parseISO(day), 'EEEE, do MMMM yyyy')}</h3>
                            <div className="space-y-4">
                                {groupedEvents[day].map(event => (
                                    <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg border">
                                        <div className={cn("mt-1 flex h-8 w-8 items-center justify-center rounded-full", event.type === 'audit' ? 'bg-excellerate-blue' : 'bg-excellerate-teal')}>
                                            {event.type === 'audit' ? <Briefcase className="h-4 w-4 text-white" /> : <Calendar className="h-4 w-4 text-white" />}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-semibold">{event.title}</p>
                                            <p className="text-sm text-muted-foreground">{event.details}</p>
                                            {event.notes && <p className="text-sm text-muted-foreground mt-1 italic">"{event.notes}"</p>}
                                        </div>
                                        {event.type === 'appointment' && (
                                            <div className="flex items-center gap-1">
                                                <AppointmentDialog onSave={handleSaveAppointment} appointment={event.raw as Appointment}>
                                                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                                                </AppointmentDialog>
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
                                                            <AlertDialogDescription>Are you sure you want to delete "{event.title}"? This action cannot be undone.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => onRemoveAppointment(event.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground text-center">No events scheduled for the selected date range.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
