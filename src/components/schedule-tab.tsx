'use client';

import { useState } from 'react';
import type { ScheduleEntry, Site, Cleaner } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Pencil, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduleTabProps {
  schedule: ScheduleEntry[];
  sites: Site[];
  cleaners: Cleaner[];
  onAdd: (entry: Omit<ScheduleEntry, 'id'>) => void;
  onUpdate: (id: string, entry: Partial<Omit<ScheduleEntry, 'id'>>) => void;
  onRemove: (id: string) => void;
}

function ScheduleEntryDialog({ sites, cleaners, onSave, entry, children }: { sites: Site[], cleaners: Cleaner[], onSave: (entry: Omit<ScheduleEntry, 'id'>) => void, entry?: ScheduleEntry, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [site, setSite] = useState(entry?.site || '');
    const [cleaner, setCleaner] = useState(entry?.cleaner || '');
    const [start, setStart] = useState(entry?.start || '');
    const [finish, setFinish] = useState(entry?.finish || '');
    const { toast } = useToast();

    const handleSave = () => {
        if (!site || !cleaner) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a site and cleaner.' });
            return;
        }
        onSave({ site, cleaner, start, finish });
        setIsOpen(false);
        toast({ title: 'Schedule Saved', description: `The entry for ${cleaner} at ${site} has been saved.` });
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{entry ? 'Edit' : 'Add'} Schedule Entry</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
                    <div className="space-y-2">
                        <Label htmlFor="site">Site</Label>
                         <Select value={site} onValueChange={setSite}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a site" />
                            </SelectTrigger>
                            <SelectContent>
                                {sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="cleaner">Cleaner</Label>
                        <Select value={cleaner} onValueChange={setCleaner}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a cleaner" />
                            </SelectTrigger>
                            <SelectContent>
                                {cleaners.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="start">Start Time</Label>
                        <Input id="start" value={start} onChange={e => setStart(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="finish">Finish Time</Label>
                        <Input id="finish" value={finish} onChange={e => setFinish(e.target.value)} />
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

export default function CompanyScheduleTab({ schedule, sites, cleaners, onAdd, onUpdate, onRemove }: ScheduleTabProps) {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedRow, setEditedRow] = useState<Partial<ScheduleEntry>>({});

  const handleEditClick = (entry: ScheduleEntry) => {
    setEditingRowId(entry.id);
    setEditedRow(entry);
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditedRow({});
  };

  const handleSaveEdit = (id: string) => {
    onUpdate(id, editedRow);
    handleCancelEdit();
  };

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <ScheduleEntryDialog sites={sites} cleaners={cleaners} onSave={onAdd}>
                 <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Entry</Button>
            </ScheduleEntryDialog>
        </div>
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Site</TableHead>
                        <TableHead>Cleaner</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>Finish</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {schedule.length > 0 ? (
                        schedule.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{editingRowId === entry.id ? (
                                    <Select value={editedRow.site} onValueChange={(value) => setEditedRow(prev => ({...prev, site: value}))}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>{sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                ) : entry.site}</TableCell>
                                <TableCell>{editingRowId === entry.id ? (
                                    <Select value={editedRow.cleaner} onValueChange={(value) => setEditedRow(prev => ({...prev, cleaner: value}))}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>{cleaners.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                ) : entry.cleaner}</TableCell>
                                <TableCell>{editingRowId === entry.id ? <Input value={editedRow.start} onChange={e => setEditedRow(prev => ({...prev, start: e.target.value}))} /> : entry.start}</TableCell>
                                <TableCell>{editingRowId === entry.id ? <Input value={editedRow.finish} onChange={e => setEditedRow(prev => ({...prev, finish: e.target.value}))} /> : entry.finish}</TableCell>
                                <TableCell className="text-right">
                                    {editingRowId === entry.id ? (
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(entry.id)}><Check className="h-4 w-4 text-green-600" /></Button>
                                            <Button variant="ghost" size="icon" onClick={handleCancelEdit}><X className="h-4 w-4 text-red-600" /></Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(entry)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => onRemove(entry.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                No schedule entries found. Click "Add Entry" to create one.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
