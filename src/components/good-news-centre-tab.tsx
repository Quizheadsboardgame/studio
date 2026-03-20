'use client';

import { useState, useMemo } from 'react';
import type { Cleaner, Site, GoodNewsRecord } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { PlusCircle, Pencil, Trash2, Award, User, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GoodNewsDialogProps {
  cleaners: Cleaner[];
  sites: Site[];
  onSave: (data: Omit<GoodNewsRecord, 'id'> | (Partial<Omit<GoodNewsRecord, 'id'>> & { id: string })) => void;
  record?: GoodNewsRecord;
  children: React.ReactNode;
}

function GoodNewsDialog({ cleaners, sites, onSave, record, children }: GoodNewsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const [personType, setPersonType] = useState<'Cleaner' | 'Client'>(record?.personType || 'Cleaner');
    const [personName, setPersonName] = useState(record?.personName || '');
    const [siteName, setSiteName] = useState(record?.siteName || '');
    const [date, setDate] = useState(record?.date || format(new Date(), 'yyyy-MM-dd'));
    const [description, setDescription] = useState(record?.description || '');
    const [acknowledged, setAcknowledged] = useState(record?.acknowledged || false);
    const [acknowledgementNotes, setAcknowledgementNotes] = useState(record?.acknowledgementNotes || '');
    
    const handleSave = () => {
        if (!personName.trim() || !description.trim() || !date) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all required fields.' });
            return;
        }

        const recordData = {
            personName,
            personType,
            siteName: siteName || undefined,
            date,
            description,
            acknowledged,
            acknowledgementNotes,
        };

        if (record) {
            onSave({ id: record.id, ...recordData });
        } else {
            onSave(recordData);
        }
        
        setIsOpen(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setPersonType(record?.personType || 'Cleaner');
            setPersonName(record?.personName || '');
            setSiteName(record?.siteName || '');
            setDate(record?.date || format(new Date(), 'yyyy-MM-dd'));
            setDescription(record?.description || '');
            setAcknowledged(record?.acknowledged || false);
            setAcknowledgementNotes(record?.acknowledgementNotes || '');
        }
        setIsOpen(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{record ? 'Edit' : 'Add'} Good News</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="person-type">Person Type</Label>
                            <Select value={personType} onValueChange={(v: 'Cleaner' | 'Client') => { setPersonType(v); setPersonName(''); }}>
                                <SelectTrigger id="person-type"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cleaner">Cleaner</SelectItem>
                                    <SelectItem value="Client">Client</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="person-name">{personType}</Label>
                            {personType === 'Cleaner' ? (
                                <Select value={personName} onValueChange={setPersonName}>
                                    <SelectTrigger id="person-name"><SelectValue placeholder="Select a cleaner" /></SelectTrigger>
                                    <SelectContent>{cleaners.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            ) : (
                                <Input id="person-name" value={personName} onChange={e => setPersonName(e.target.value)} placeholder="Client's Name" />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="site">Site (Optional)</Label>
                            <Select value={siteName} onValueChange={(value) => setSiteName(value === '__NONE__' ? '' : value)}>
                                <SelectTrigger id="site"><SelectValue placeholder="Select a site" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__NONE__">None</SelectItem>
                                    {sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the positive feedback or event..." />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="acknowledged" checked={acknowledged} onCheckedChange={(checked) => setAcknowledged(!!checked)} />
                            <Label htmlFor="acknowledged">Has this person been acknowledged?</Label>
                        </div>
                        {acknowledged && (
                            <div className="space-y-2">
                                <Label htmlFor="ack-notes">Acknowledgement Notes</Label>
                                <Textarea id="ack-notes" value={acknowledgementNotes} onChange={e => setAcknowledgementNotes(e.target.value)} placeholder="e.g., 'Given a £20 voucher on Monday'" />
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSave}>Save Record</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface GoodNewsCentreTabProps {
  records: GoodNewsRecord[];
  cleaners: Cleaner[];
  sites: Site[];
  onAddRecord: (data: Omit<GoodNewsRecord, 'id'>) => void;
  onUpdateRecord: (id: string, data: Partial<Omit<GoodNewsRecord, 'id'>>) => void;
  onRemoveRecord: (id: string) => void;
}

export default function GoodNewsCentreTab({ records, cleaners, sites, onAddRecord, onUpdateRecord, onRemoveRecord }: GoodNewsCentreTabProps) {
  
    const sortedRecords = useMemo(() => {
        return [...records].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }, [records]);
  
    const handleSave = (data: Omit<GoodNewsRecord, 'id'> | (Partial<Omit<GoodNewsRecord, 'id'>> & { id: string })) => {
        if ('id' in data) {
            const { id, ...updateData } = data;
            onUpdateRecord(id, updateData);
        } else {
            onAddRecord(data as Omit<GoodNewsRecord, 'id'>);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
                    <div>
                        <CardTitle>Good News Centre</CardTitle>
                        <CardDescription>Record positive feedback and celebrate great work.</CardDescription>
                    </div>
                    <GoodNewsDialog cleaners={cleaners} sites={sites} onSave={handleSave}>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/> Record Good News</Button>
                    </GoodNewsDialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {sortedRecords.length > 0 ? (
                    <div className="space-y-4">
                        {sortedRecords.map(record => (
                            <div key={record.id} className={cn("border p-4 rounded-lg space-y-3 transition-colors", record.acknowledged ? 'bg-card' : 'bg-amber-50 dark:bg-amber-950')}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2">
                                            {record.personType === 'Cleaner' ? <Award className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-accent" />}
                                            <p className="font-bold text-lg">{record.personName}</p>
                                            <Badge variant="secondary">{record.personType}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {format(parseISO(record.date), 'PPP')}
                                            {record.siteName && ` at ${record.siteName}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <GoodNewsDialog cleaners={cleaners} sites={sites} onSave={handleSave} record={record}>
                                           <Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                                        </GoodNewsDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                                                    <AlertDialogDescription>Are you sure you want to delete this record? This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onRemoveRecord(record.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                                <div className="pl-7">
                                    <p className="text-foreground whitespace-pre-wrap">{record.description}</p>
                                </div>
                                {record.acknowledged && (
                                    <div className="pl-7 pt-3 mt-3 border-t">
                                        <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                                            <CheckCircle className="h-4 w-4"/>
                                            <span>Acknowledged</span>
                                        </div>
                                        {record.acknowledgementNotes && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap italic">"{record.acknowledgementNotes}"</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground text-center">No good news recorded yet. Time to spread some positivity!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
