'use client';

import { useState, useMemo } from 'react';
import type { Site, Cleaner, ScheduleEntry, ActionPlan, MonthlyAudit, Task, Appointment, AdditionalCleaner } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Users, Star, PlusCircle, Trash2, UserSearch } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';


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

interface SitePortfolioTabProps {
  sites: Site[];
  cleaners: Cleaner[];
  schedule: ScheduleEntry[];
  actionPlans: ActionPlan[];
  monthlyAudits: MonthlyAudit[];
  tasks: Task[];
  appointments: Appointment[];
  onUpdateSite: (siteId: string, data: Partial<Omit<Site, 'id'>>) => void;
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
}: SitePortfolioTabProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

  const siteData = useMemo(() => {
    if (!selectedSite) return null;
    
    const uniqueCleaners = [...new Set(schedule.filter(s => s.site === selectedSite.name).map(s => s.cleaner))];
    const siteActionPlan = actionPlans.find(p => p.targetType === 'site' && p.id === selectedSite.id);
    const siteAudits = monthlyAudits.filter(a => a.siteId === selectedSite.id && a.status === 'Completed').sort((a,b) => parseISO(b.bookedDate!).getTime() - parseISO(a.bookedDate!).getTime());
    const siteTasks = tasks.filter(t => t.site === selectedSite.name);
    const siteAppointments = appointments.filter(a => a.site === selectedSite.name);

    return {
        currentCleaners: uniqueCleaners,
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
                        <CardHeader><CardTitle>Site Information</CardTitle></CardHeader>
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
                                        {siteData?.currentCleaners && siteData.currentCleaners.length > 0 ? (
                                            <ul className="list-disc pl-5 space-y-1">
                                                {siteData.currentCleaners.map(name => <li key={name}>{name}</li>)}
                                            </ul>
                                        ) : <p className="text-muted-foreground">No cleaners currently scheduled.</p>}
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
                                                        <input type="checkbox" checked={t.completed} readOnly className="form-checkbox h-4 w-4" />
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
                                             <ul className="list-disc pl-5 space-y-1">
                                                {siteData.tasks.map(t => (
                                                  <li key={t.id} className={t.completed ? 'line-through text-muted-foreground' : ''}>
                                                    {t.description}
                                                    {t.dueDate && ` (Due: ${format(parseISO(t.dueDate), 'PP')})`}
                                                  </li>
                                                ))}
                                            </ul>
                                         ) : <p className="text-muted-foreground">No tasks for this site.</p>}
                                    </AccordionContent>
                                </AccordionItem>
                                 <AccordionItem value="appointments">
                                    <AccordionTrigger>Appointments</AccordionTrigger>
                                    <AccordionContent>
                                          {siteData?.appointments && siteData.appointments.length > 0 ? (
                                             <ul className="list-disc pl-5 space-y-1">
                                                {siteData.appointments.map(a => (
                                                  <li key={a.id}>{a.title} on {format(parseISO(a.date), 'PP')} with {a.assignee}</li>
                                                ))}
                                            </ul>
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
