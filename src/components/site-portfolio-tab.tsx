'use client';

import { useState, useMemo } from 'react';
import type { Site, Cleaner, ScheduleEntry, ActionPlan, MonthlyAudit, Task, Appointment, AdditionalCleaner, Contact } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Users, Star, PlusCircle, Trash2, UserSearch, Pencil, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { AppointmentDialog } from './appointment-dialog';

interface ManageContactsDialogProps {
  site: Site;
  onUpdateSite: (siteId: string, data: Partial<Omit<Site, 'id'>>) => void;
  children: React.ReactNode;
}

function ManageContactsDialog({ site, onUpdateSite, children }: ManageContactsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const { toast } = useToast();

    const startEditing = (contact: Contact) => {
        setEditingContactId(contact.id);
        setContactName(contact.name);
        setContactEmail(contact.email || '');
        setContactPhone(contact.phone || '');
    };

    const cancelEditing = () => {
        setEditingContactId(null);
        setContactName('');
        setContactEmail('');
        setContactPhone('');
    };

    const handleSave = () => {
        if (!contactName.trim()) {
            toast({ variant: "destructive", title: "Name is required" });
            return;
        }

        const currentContacts = site.contacts || [];
        let updatedContacts: Contact[];

        if (editingContactId) {
            updatedContacts = currentContacts.map(c => 
                c.id === editingContactId 
                ? { ...c, name: contactName, email: contactEmail, phone: contactPhone } 
                : c
            );
        } else {
            updatedContacts = [
                ...currentContacts, 
                { id: `contact-${Date.now()}`, name: contactName, email: contactEmail, phone: contactPhone }
            ];
        }

        onUpdateSite(site.id, { contacts: updatedContacts });
        cancelEditing();
    };
    
    const handleRemove = (contactId: string) => {
        const updatedContacts = (site.contacts || []).filter(c => c.id !== contactId);
        onUpdateSite(site.id, { contacts: updatedContacts });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Manage Contacts for {site.name}</DialogTitle>
                    <DialogDescription>Add, edit, or remove client contacts for this site.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    {(site.contacts || []).map(contact => (
                        <div key={contact.id} className="border p-3 rounded-lg">
                           {editingContactId === contact.id ? (
                                <div className="space-y-2">
                                     <Input placeholder="Name" value={contactName} onChange={e => setContactName(e.target.value)} />
                                     <Input placeholder="Email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                                     <Input placeholder="Phone" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                                     <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancel</Button>
                                        <Button size="sm" onClick={handleSave}>Save</Button>
                                     </div>
                                </div>
                           ) : (
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{contact.name}</p>
                                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => startEditing(contact)}><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemove(contact.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                           )}
                        </div>
                    ))}

                    {!editingContactId && (
                         <div className="border-t pt-4 space-y-2">
                             <h4 className="font-semibold">Add New Contact</h4>
                             <Input placeholder="Name" value={contactName} onChange={e => setContactName(e.target.value)} />
                             <Input placeholder="Email (Optional)" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                             <Input placeholder="Phone (Optional)" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                             <div className="flex justify-end">
                                <Button onClick={handleSave}><PlusCircle className="mr-2 h-4 w-4" /> Add Contact</Button>
                             </div>
                        </div>
                    )}
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button onClick={() => {setIsOpen(false); cancelEditing();}}>Done</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface AssociatedCleanersDialogProps {
  site: Site;
  allCleaners: Cleaner[];
  onUpdateSite: (siteId: string, data: Partial<Omit<Site, 'id'>>) => void;
  children: React.ReactNode;
}

function AssociatedCleanersDialog({ site, allCleaners, onUpdateSite, children }: AssociatedCleanersDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCleanerName, setSelectedCleanerName] = useState('');
  const [role, setRole] = useState<'Trained' | 'Previously Cleaned'>('Trained');
  const { toast } = useToast();

  const handleAddCleaner = () => {
    if (!selectedCleanerName) {
      toast({ variant: 'destructive', title: 'Please select a cleaner.' });
      return;
    }
    const currentAssociated = site.additionalCleaners || [];
    if (currentAssociated.some(c => c.name === selectedCleanerName)) {
        toast({ variant: 'destructive', title: 'Cleaner already associated with this site.' });
        return;
    }

    const newAssociatedCleaners = [...currentAssociated, { name: selectedCleanerName, role }];
    onUpdateSite(site.id, { additionalCleaners: newAssociatedCleaners });
    toast({ title: 'Cleaner Associated', description: `${selectedCleanerName} has been added.` });
  };
  
  const handleRemoveCleaner = (cleanerName: string) => {
    const newAssociatedCleaners = (site.additionalCleaners || []).filter(c => c.name !== cleanerName);
    onUpdateSite(site.id, { additionalCleaners: newAssociatedCleaners });
    toast({ title: 'Association Removed' });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Associated Cleaners for {site.name}</DialogTitle>
          <DialogDescription>Add or remove cleaners who are trained or have previously worked at this site.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex gap-2 items-end">
                <div className="flex-grow space-y-2">
                    <Label>Cleaner</Label>
                    <Select value={selectedCleanerName} onValueChange={setSelectedCleanerName}>
                        <SelectTrigger><SelectValue placeholder="Select a cleaner..." /></SelectTrigger>
                        <SelectContent>
                            {allCleaners.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v: 'Trained' | 'Previously Cleaned') => setRole(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Trained">Trained</SelectItem>
                            <SelectItem value="Previously Cleaned">Previously Cleaned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleAddCleaner}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
            </div>
             <div className="border rounded-lg max-h-60 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(site.additionalCleaners || []).length > 0 ? (
                            site.additionalCleaners?.map(c => (
                                <TableRow key={c.name}>
                                    <TableCell>{c.name}</TableCell>
                                    <TableCell>{c.role}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveCleaner(c.name)}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} className="text-center h-24">No associated cleaners yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button>Done</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ManageScheduleDialogProps {
  site: Site;
  allCleaners: Cleaner[];
  siteSchedule: ScheduleEntry[];
  onAdd: (entry: Omit<ScheduleEntry, 'id'>) => void;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}

function ManageScheduleDialog({ site, allCleaners, siteSchedule, onAdd, onRemove, children }: ManageScheduleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState('');
  const [startTime, setStartTime] = useState('');
  const [finishTime, setFinishTime] = useState('');
  const { toast } = useToast();

  const handleAdd = () => {
    if (!selectedCleaner) {
      toast({ variant: 'destructive', title: 'Please select a cleaner.' });
      return;
    }
    const isDuplicate = siteSchedule.some(
      e => e.site === site.name && e.cleaner === selectedCleaner && e.start === startTime && e.finish === finishTime
    );

    if (isDuplicate) {
        toast({
            variant: 'destructive',
            title: 'Duplicate Schedule Entry',
            description: 'This exact shift is already scheduled for this cleaner.',
        });
        return;
    }

    onAdd({ site: site.name, cleaner: selectedCleaner, start: startTime, finish: finishTime });
    setSelectedCleaner('');
    setStartTime('');
    setFinishTime('');
    toast({ title: 'Schedule Updated', description: `${selectedCleaner} has been added to the schedule for ${site.name}.` });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Schedule for {site.name}</DialogTitle>
          <DialogDescription>Add or remove shifts for this site.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                 <div className="sm:col-span-2 space-y-2">
                    <Label>Cleaner</Label>
                    <Select value={selectedCleaner} onValueChange={setSelectedCleaner}>
                        <SelectTrigger><SelectValue placeholder="Select a cleaner..." /></SelectTrigger>
                        <SelectContent>
                            {allCleaners.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label>Finish Time</Label>
                    <Input value={finishTime} onChange={e => setFinishTime(e.target.value)} />
                </div>
            </div>
             <div className="flex justify-end">
                <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Shift</Button>
            </div>
             <div className="border rounded-lg max-h-60 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cleaner</TableHead>
                            <TableHead>Shift</TableHead>
                            <TableHead className="text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {siteSchedule.length > 0 ? (
                            siteSchedule.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell>{s.cleaner}</TableCell>
                                    <TableCell>{s.start} - {s.finish}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => onRemove(s.id)}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} className="text-center h-24">No shifts scheduled for this site.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button>Done</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


interface SitePortfolioTabProps {
  sites: Site[];
  cleaners: Cleaner[];
  schedule: ScheduleEntry[];
  actionPlans: ActionPlan[];
  monthlyAudits: MonthlyAudit[];
  tasks: Task[];
  appointments: Appointment[];
  onUpdateSite: (siteId: string, data: Partial<Omit<Site, 'id'>>) => void;
  onUpdateTask: (taskId: string, task: Partial<Omit<Task, 'id'>>) => void;
  onRemoveTask: (taskId: string) => void;
  onAddAppointment: (data: Omit<Appointment, 'id'>) => void;
  onUpdateAppointment: (id: string, data: Partial<Omit<Appointment, 'id'>>) => void;
  onRemoveAppointment: (id: string) => void;
  onAddScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => void;
  onUpdateScheduleEntry: (id: string, entry: Partial<Omit<ScheduleEntry, 'id'>>) => void;
  onRemoveScheduleEntry: (id: string) => void;
}

export default function SitePortfolioTab({
  sites,
  cleaners,
  schedule,
  actionPlans,
  monthlyAudits,
  tasks,
  appointments,
  onUpdateSite,
  onUpdateTask,
  onRemoveTask,
  onAddAppointment,
  onUpdateAppointment,
  onRemoveAppointment,
  onAddScheduleEntry,
  onUpdateScheduleEntry,
  onRemoveScheduleEntry,
}: SitePortfolioTabProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  const siteData = useMemo(() => {
    if (!selectedSite || !schedule || !actionPlans || !monthlyAudits || !tasks || !appointments) return null;
    
    const siteScheduleEntries = schedule.filter(s => s.site.toLowerCase().includes(selectedSite.name.toLowerCase()));
    const siteActionPlan = actionPlans.find(p => p.targetType === 'site' && p.id === selectedSite.id);
    const siteAudits = monthlyAudits.filter(a => a.siteId === selectedSite.id && a.status === 'Completed' && a.bookedDate).sort((a,b) => parseISO(b.bookedDate!).getTime() - parseISO(a.bookedDate!).getTime());
    const siteTasks = tasks.filter(t => t.site === selectedSite.name);
    const siteAppointments = appointments.filter(a => a.site === selectedSite.name);

    return {
        siteSchedule: siteScheduleEntries,
        actionPlan: siteActionPlan,
        audits: siteAudits,
        tasks: siteTasks,
        appointments: siteAppointments,
    };
  }, [selectedSite, schedule, actionPlans, monthlyAudits, tasks, appointments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Portfolio</CardTitle>
        <CardDescription>A comprehensive overview of a single site, consolidating all related information.</CardDescription>
        <div className="pt-4">
            <Label>Select a Site</Label>
            <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="w-full sm:w-[350px]">
                    <SelectValue placeholder="Choose a site to view its portfolio" />
                </SelectTrigger>
                <SelectContent>
                    {sites.map(site => (
                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedSite ? (
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Please select a site to view its portfolio.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Site Information</CardTitle>
                            <ManageContactsDialog site={selectedSite} onUpdateSite={onUpdateSite}>
                                <Button variant="outline" size="sm">Manage Contacts</Button>
                            </ManageContactsDialog>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <p><strong>Site Code:</strong> {selectedSite.siteCode || 'N/A'}</p>
                            <p><strong>Status:</strong> {selectedSite.status}</p>
                            {selectedSite.contacts && selectedSite.contacts.length > 0 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="link" className="p-0 h-auto">
                                          <UserSearch className="mr-2" /> View {selectedSite.contacts.length} Contact(s)
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                      <div className="space-y-4">
                                        <h4 className="font-medium">Contacts for {selectedSite.name}</h4>
                                        {selectedSite.contacts.map((c, i) => (
                                            <div key={i} className="border-t pt-2">
                                              <p className="font-semibold">{c.name}</p>
                                              {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                                              {c.phone && <p className="text-xs text-muted-foreground">Tel: {c.phone}</p>}
                                            </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Users /> Personnel</CardTitle></CardHeader>
                        <CardContent>
                           <Accordion type="multiple" defaultValue={['current', 'associated']}>
                                <AccordionItem value="current">
                                    <AccordionTrigger>Current Cleaners</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2">
                                            {siteData?.siteSchedule && siteData.siteSchedule.length > 0 ? (
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {siteData.siteSchedule.map(entry => <li key={entry.id}>{entry.cleaner} ({entry.start} - {entry.finish})</li>)}
                                                </ul>
                                            ) : <p className="text-muted-foreground">No cleaners currently scheduled.</p>}
                                             <ManageScheduleDialog 
                                                site={selectedSite} 
                                                allCleaners={cleaners} 
                                                siteSchedule={siteData?.siteSchedule || []} 
                                                onAdd={onAddScheduleEntry} 
                                                onRemove={onRemoveScheduleEntry}
                                            >
                                                <Button variant="secondary" size="sm">Manage Schedule</Button>
                                            </ManageScheduleDialog>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                 <AccordionItem value="associated">
                                    <AccordionTrigger>Associated Cleaners</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2">
                                            {(selectedSite.additionalCleaners || []).length > 0 ? (
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {selectedSite.additionalCleaners?.map(c => <li key={c.name}>{c.name} ({c.role})</li>)}
                                                </ul>
                                            ) : <p className="text-muted-foreground">No associated cleaners.</p>}
                                            <AssociatedCleanersDialog site={selectedSite} allCleaners={cleaners} onUpdateSite={onUpdateSite}>
                                                <Button variant="secondary" size="sm">Manage Associated Cleaners</Button>
                                            </AssociatedCleanersDialog>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                           </Accordion>
                        </CardContent>
                    </Card>
                </div>
                 <div className="space-y-6">
                   <Card>
                        <CardHeader><CardTitle>Site Details</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full">
                                <AccordionItem value="notes">
                                    <AccordionTrigger>Site Notes</AccordionTrigger>
                                    <AccordionContent>
                                        <Textarea
                                            placeholder="Add general notes for this site..."
                                            value={selectedSite.notes || ''}
                                            onChange={(e) => onUpdateSite(selectedSite.id, { notes: e.target.value })}
                                            className="min-h-[100px]"
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="action-plan">
                                    <AccordionTrigger>Action Plan</AccordionTrigger>
                                    <AccordionContent>
                                        {siteData?.actionPlan ? (
                                            <div className="space-y-2">
                                                {siteData.actionPlan.tasks.map(t => (
                                                    <div key={t.id} className="flex items-center gap-2">
                                                        <Checkbox checked={t.completed} disabled />
                                                        <span className={t.completed ? 'line-through text-muted-foreground' : ''}>{t.description} (Due: {format(parseISO(t.dueDate), 'PP')})</span>
                                                    </div>
                                                ))}
                                                {siteData.actionPlan.notes && <p className="text-sm text-muted-foreground pt-2 border-t mt-2">Notes: {siteData.actionPlan.notes}</p>}
                                            </div>
                                        ) : <p className="text-muted-foreground">No action plan for this site.</p>}
                                    </AccordionContent>
                                </AccordionItem>
                                 <AccordionItem value="audit-history">
                                    <AccordionTrigger>Audit History</AccordionTrigger>
                                    <AccordionContent>
                                         {siteData?.audits && siteData.audits.length > 0 ? (
                                             <Table>
                                                 <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Score</TableHead></TableRow></TableHeader>
                                                 <TableBody>
                                                     {siteData.audits.map(a => <TableRow key={a.id}><TableCell>{format(parseISO(a.bookedDate!), 'PP')}</TableCell><TableCell>{a.score}%</TableCell></TableRow>)}
                                                 </TableBody>
                                             </Table>
                                         ) : <p className="text-muted-foreground">No completed audits for this site.</p>}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="tasks">
                                    <AccordionTrigger>Tasks</AccordionTrigger>
                                    <AccordionContent>
                                         {siteData?.tasks && siteData.tasks.length > 0 ? (
                                             <div className="space-y-2">
                                                {siteData.tasks.map(t => (
                                                  <div key={t.id} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox checked={t.completed} onCheckedChange={(checked) => onUpdateTask(t.id, { completed: !!checked })} />
                                                        <label className={t.completed ? 'line-through text-muted-foreground' : ''}>
                                                            {t.description}
                                                            {t.dueDate && ` (Due: ${format(parseISO(t.dueDate), 'PP')})`}
                                                        </label>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => onRemoveTask(t.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                                                  </div>
                                                ))}
                                            </div>
                                         ) : <p className="text-muted-foreground">No tasks for this site.</p>}
                                    </AccordionContent>
                                </AccordionItem>
                                 <AccordionItem value="appointments">
                                    <AccordionTrigger>Appointments</AccordionTrigger>
                                    <AccordionContent>
                                          {siteData?.appointments && siteData.appointments.length > 0 ? (
                                             <div className="space-y-2">
                                                {siteData.appointments.map(a => (
                                                  <div key={a.id} className="flex items-center justify-between">
                                                    <p>{a.title} on {format(parseISO(a.date), 'PP')} with {a.assignee}</p>
                                                    <div className="flex items-center gap-1">
                                                      <AppointmentDialog sites={sites} onSave={(data) => onUpdateAppointment(a.id, data)} appointment={a}>
                                                          <Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                                                      </AppointmentDialog>
                                                      <AlertDialog>
                                                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></AlertDialogTrigger>
                                                          <AlertDialogContent>
                                                              <AlertDialogHeader><AlertDialogTitle>Delete Appointment?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                              <AlertDialogFooter>
                                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                  <AlertDialogAction onClick={() => onRemoveAppointment(a.id)}>Delete</AlertDialogAction>
                                                              </AlertDialogFooter>
                                                          </AlertDialogContent>
                                                      </AlertDialog>
                                                    </div>
                                                  </div>
                                                ))}
                                            </div>
                                         ) : <p className="text-muted-foreground">No appointments for this site.</p>}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
