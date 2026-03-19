'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Cleaner, CleanerPerformance } from '@/lib/data';
import { cleanerPerformances } from '@/lib/data';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CleanersTabProps {
  cleaners: Cleaner[];
  onRatingChange: (cleanerId: string, newRating: CleanerPerformance) => void;
  onNoteChange: (cleanerId: string, newNote: string) => void;
  onAddCleaner: (cleanerName: string) => void;
  onRemoveCleaner: (cleanerId: string) => void;
  onHolidayAllowanceChange: (cleanerId: string, allowance: number) => void;
}

export default function CleanersTab({ cleaners, onRatingChange, onNoteChange, onAddCleaner, onRemoveCleaner, onHolidayAllowanceChange }: CleanersTabProps) {
  const [newCleanerName, setNewCleanerName] = useState('');
  const { toast } = useToast();

  const handleAddClick = () => {
    const trimmedName = newCleanerName.trim();
    if (trimmedName === '') return;

    if (cleaners.some(cleaner => cleaner.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Cleaner',
        description: `A cleaner with the name "${trimmedName}" already exists.`,
      });
      return;
    }

    onAddCleaner(trimmedName);
    setNewCleanerName('');
  };

  const handleAllowanceChange = (cleanerId: string, value: string) => {
    const allowance = parseInt(value, 10);
    if (!isNaN(allowance) && allowance >= 0) {
      onHolidayAllowanceChange(cleanerId, allowance);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Enter new cleaner name..."
          value={newCleanerName}
          onChange={(e) => setNewCleanerName(e.target.value)}
          className="max-w-sm"
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddClick(); }}
        />
        <Button onClick={handleAddClick} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Cleaner
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">Cleaner</TableHead>
              <TableHead className="w-[20%]">Rating</TableHead>
              <TableHead className="w-[15%] hidden md:table-cell">Holiday Allowance</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[10%] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cleaners.length > 0 ? cleaners.map((cleaner) => (
              <TableRow key={cleaner.id} className={cn({
                  'border-l-4 border-accent': cleaner.rating === 'Excellent feedback' || cleaner.rating === 'Site satisfied',
                  'border-l-4 border-destructive': cleaner.rating === 'Needs retraining' || cleaner.rating === 'Under action plan' || cleaner.rating === 'Operational concerns',
                  'border-l-4 border-chart-4': cleaner.rating === 'Slight improvement needed',
                  'border-l-4 border-transparent': cleaner.rating === 'N/A',
              })}>
                <TableCell className="font-medium align-top py-4">
                  {cleaner.name}
                </TableCell>
                <TableCell className="align-top py-4">
                  <Select
                    value={cleaner.rating}
                    onValueChange={(newRating: CleanerPerformance) => onRatingChange(cleaner.id, newRating)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {cleanerPerformances.map((performance) => (
                        <SelectItem key={performance} value={performance}>
                          {performance}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="align-top py-4 hidden md:table-cell">
                  <Input
                    type="number"
                    value={cleaner.holidayAllowance || 20}
                    onChange={(e) => handleAllowanceChange(cleaner.id, e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell className="py-2 align-top">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="notes" className="border-b-0">
                      <AccordionTrigger className="py-2 text-sm font-normal hover:no-underline">
                          {cleaner.notes ? 'View/Edit Notes' : 'Add Notes'}
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          placeholder="Add notes for this cleaner..."
                          value={cleaner.notes || ''}
                          onChange={(e) => onNoteChange(cleaner.id, e.target.value)}
                          className="w-full min-h-[60px] resize-y"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TableCell>
                <TableCell className="align-top py-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => onRemoveCleaner(cleaner.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No cleaners found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
