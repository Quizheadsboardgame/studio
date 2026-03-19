'use client';

import { useState, useMemo } from 'react';
import type { Cleaner, Site, ConversationRecord } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ConversationDialogProps {
  cleaners: Cleaner[];
  sites: Site[];
  onSave: (data: Omit<ConversationRecord, 'id'> | (Partial<Omit<ConversationRecord, 'id'>> & { id: string })) => void;
  record?: ConversationRecord;
  children: React.ReactNode;
}

function ConversationDialog({ cleaners, sites, onSave, record, children }: ConversationDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const [cleanerId, setCleanerId] = useState(record?.cleanerId || '');
    const [siteId, setSiteId] = useState(record?.siteId || '');
    const [date, setDate] = useState(record?.date || format(new Date(), 'yyyy-MM-dd'));
    const [issue, setIssue] = useState(record?.issue || '');
    const [notes, setNotes] = useState(record?.notes || '');
    const [followUpRequired, setFollowUpRequired] = useState(record?.followUpRequired || false);

    const handleSave = () => {
        if (!cleanerId || !issue.trim() || !date) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a cleaner, set a date, and describe the issue.' });
            return;
        }

        const cleaner = cleaners.find(c => c.id === cleanerId);
        const site = sites.find(s => s.id === siteId);

        const recordData = {
            cleanerId,
            cleanerName: cleaner?.name || 'Unknown',
            siteId: site?.id,
            siteName: site?.name,
            date,
            issue,
            notes,
            followUpRequired,
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
            setCleanerId(record?.cleanerId || '');
            setSiteId(record?.siteId || '');
            setDate(record?.date || format(new Date(), 'yyyy-MM-dd'));
            setIssue(record?.issue || '');
            setNotes(record?.notes || '');
            setFollowUpRequired(record?.followUpRequired || false);
        }
        setIsOpen(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{record ? 'Edit' : 'Record'} Conversation</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
                    <div className="space-y-2">
                        <Label htmlFor="cleaner">Cleaner</Label>
                        <Select value={cleanerId} onValueChange={setCleanerId}>
                            <SelectTrigger id="cleaner"><SelectValue placeholder="Select a cleaner" /></SelectTrigger>
                            <SelectContent>{cleaners.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="site">Site (Optional)</Label>
                        <Select value={siteId} onValueChange={(value) => setSiteId(value === '__NONE__' ? '' : value)}>
                            <SelectTrigger id="site"><SelectValue placeholder="Select a site" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__NONE__">None</SelectItem>
                                {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="issue">Issue / Subject</Label>
                        <Input id="issue" value={issue} onChange={e => setIssue(e.target.value)} placeholder="e.g., Punctuality, Uniform, Client Feedback" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Conversation Notes</Label>
                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detailed notes about the discussion..." />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="follow-up" checked={followUpRequired} onCheckedChange={(checked) => setFollowUpRequired(!!checked)} />
                        <Label htmlFor="follow-up">Follow-up meeting required</Label>
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

interface ConversationLogTabProps {
  cleaners: Cleaner[];
  sites: Site[];
  conversationRecords: ConversationRecord[];
  onAddRecord: (data: Omit<ConversationRecord, 'id'>) => void;
  onUpdateRecord: (id: string, data: Partial<Omit<ConversationRecord, 'id'>>) => void;
  onRemoveRecord: (id: string) => void;
}

export default function ConversationLogTab({ cleaners, sites, conversationRecords, onAddRecord, onUpdateRecord, onRemoveRecord }: ConversationLogTabProps) {
  const [filterCleanerId, setFilterCleanerId] = useState<string>('__ALL__');

  const filteredRecords = useMemo(() => {
    if (filterCleanerId === '__ALL__') {
      return [...conversationRecords].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }
    return conversationRecords
      .filter(r => r.cleanerId === filterCleanerId)
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [conversationRecords, filterCleanerId]);
  
  const handleSave = (data: Omit<ConversationRecord, 'id'> | (Partial<Omit<ConversationRecord, 'id'>> & { id: string })) => {
        if ('id' in data) {
            const { id, ...updateData } = data;
            onUpdateRecord(id, updateData);
        } else {
            onAddRecord(data);
        }
    };


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
            <div>
              <CardTitle>Conversation Log</CardTitle>
              <CardDescription>Record and review conversations with cleaners.</CardDescription>
            </div>
            <ConversationDialog cleaners={cleaners} sites={sites} onSave={handleSave}>
              <Button><PlusCircle className="mr-2 h-4 w-4"/> Record Conversation</Button>
            </ConversationDialog>
        </div>
        <div className="pt-4 space-y-2">
            <Label>Filter by Cleaner</Label>
            <Select value={filterCleanerId} onValueChange={setFilterCleanerId}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select a cleaner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">All Cleaners</SelectItem>
                {cleaners.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredRecords.length > 0 ? (
          <div className="space-y-4">
            {filteredRecords.map(record => (
              <div key={record.id} className="border p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{record.cleanerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(record.date), 'PPP')}
                      {record.siteName && ` at ${record.siteName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                      <ConversationDialog cleaners={cleaners} sites={sites} onSave={handleSave} record={record}>
                         <Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                      </ConversationDialog>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                                  <AlertDialogDescription>Are you sure you want to delete this conversation record? This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onRemoveRecord(record.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold">{record.issue}</h4>
                  {record.notes && <p className="text-muted-foreground whitespace-pre-wrap mt-1">{record.notes}</p>}
                </div>
                {record.followUpRequired && (
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-destructive">Follow-up required</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-center">No conversation records found for the selected cleaner.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
