
'use client';

import { useState } from 'react';
import type { Site, Appointment } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

interface AppointmentDialogProps {
  sites: Site[];
  onSave: (data: Omit<Appointment, 'id'> | (Partial<Omit<Appointment, 'id'>> & { id: string })) => void;
  appointment?: Appointment;
  defaultAssignee?: string;
  children: React.ReactNode;
}

export function AppointmentDialog({ sites, onSave, appointment, defaultAssignee, children }: AppointmentDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    
    const [title, setTitle] = useState(appointment?.title || '');
    const [site, setSite] = useState(appointment?.site || '');
    const [date, setDate] = useState<string>('');
    const [assignee, setAssignee] = useState(appointment?.assignee || defaultAssignee || 'Manager');
    const [startTime, setStartTime] = useState(appointment?.startTime || '');
    const [endTime, setEndTime] = useState(appointment?.endTime || '');
    const [notes, setNotes] = useState(appointment?.notes || '');
    const [recurrence, setRecurrence] = useState<RecurrenceType>(appointment?.recurrence || 'none');
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');

    const handleSave = () => {
        if (!title || !assignee) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a title and assignee.' });
            return;
        }

        if (recurrence !== 'none' && !recurrenceEndDate) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide an end date for the recurring appointment.' });
            return;
        }

        const appointmentData = {
            title,
            site: site || undefined,
            date: date || format(new Date(), 'yyyy-MM-dd'),
            assignee,
            startTime,
            endTime,
            notes,
            recurrence,
            recurrenceEndDate: (recurrence !== 'none' && recurrenceEndDate) ? recurrenceEndDate : undefined
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
            setSite(appointment?.site || '');
            setDate(appointment ? appointment.date : format(new Date(), 'yyyy-MM-dd'));
            setAssignee(appointment?.assignee || defaultAssignee || 'Manager');
            setStartTime(appointment?.startTime || '');
            setEndTime(appointment?.endTime || '');
            setNotes(appointment?.notes || '');
            setRecurrence(appointment?.recurrence || 'none');
            setRecurrenceEndDate(appointment?.recurrenceEndDate || '');
        }
        setIsOpen(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader><DialogTitle>{appointment ? 'Edit' : 'Add'} Appointment</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="site">Site (Optional)</Label>
                        <Select value={site} onValueChange={(value) => setSite(value === '__NONE__' ? '' : value)}>
                            <SelectTrigger id="site">
                                <SelectValue placeholder="Select a site" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__NONE__">None</SelectItem>
                                {sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="assignee">Assign To</Label>
                             <Select value={assignee} onValueChange={setAssignee}>
                                <SelectTrigger id="assignee">
                                    <SelectValue placeholder="Select person" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Manager">Manager</SelectItem>
                                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                                    <SelectItem value="Mobile Cleaner">Mobile Cleaner</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <Label>Recurrence</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <Select value={recurrence} onValueChange={(v: RecurrenceType) => setRecurrence(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="No recurrence" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                             </Select>
                             {recurrence !== 'none' && (
                                <Input type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} placeholder="End date" />
                             )}
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
