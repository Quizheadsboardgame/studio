'use client';

import { useState } from 'react';
import type { Cleaner, AvailabilityStatus } from '@/lib/data';
import { availabilityStatuses } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const LOTS = [1, 3, 4];

interface AvailabilityTabProps {
  cleaners: Cleaner[];
  onUpdateCleaner: (cleanerId: string, data: Partial<Omit<Cleaner, 'id'>>) => void;
}

export default function AvailabilityTab({ cleaners, onUpdateCleaner }: AvailabilityTabProps) {

  const handleLotsChange = (cleanerId: string, availableLots: number[], lot: number) => {
    const newLots = availableLots.includes(lot)
      ? availableLots.filter(l => l !== lot)
      : [...availableLots, lot];
    onUpdateCleaner(cleanerId, { availableLots: newLots.sort() });
  };

  const handleStatusChange = (cleanerId: string, newStatus: AvailabilityStatus) => {
    const update: Partial<Cleaner> = { availabilityStatus: newStatus };
    // If status is not 'Available for Specific Lots', clear the lots.
    if (newStatus !== 'Available for Specific Lots') {
      update.availableLots = [];
    }
    onUpdateCleaner(cleanerId, update);
  };


  return (
    <Card>
        <CardHeader>
            <CardTitle>Cleaner Availability</CardTitle>
            <CardDescription>Track cleaner availability for extra hours across different lots.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[25%]">Cleaner</TableHead>
                    <TableHead className="w-[25%]">Availability Status</TableHead>
                    <TableHead className="w-[25%]">Available Lots</TableHead>
                    <TableHead>Notes</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {cleaners.length > 0 ? cleaners.map((cleaner) => {
                    const isLotsDisabled = cleaner.availabilityStatus !== 'Available for Specific Lots';
                    const availableLots = cleaner.availableLots || [];
                    return (
                    <TableRow key={cleaner.id}>
                        <TableCell className="font-medium align-top py-4">
                        {cleaner.name}
                        </TableCell>
                        <TableCell className="align-top py-4">
                        <Select
                            value={cleaner.availabilityStatus || 'Unavailable'}
                            onValueChange={(newStatus: AvailabilityStatus) => handleStatusChange(cleaner.id, newStatus)}
                        >
                            <SelectTrigger>
                            <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                            {availabilityStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                {status}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </TableCell>
                        <TableCell className="align-top py-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                            "w-full justify-between",
                                            availableLots.length === 0 && "text-muted-foreground"
                                        )}
                                        disabled={isLotsDisabled}
                                    >
                                        {availableLots.length > 0
                                            ? `Lots: ${availableLots.join(', ')}`
                                            : "Select lots..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0">
                                   <div className="p-4 space-y-2">
                                        <p className="text-sm font-medium">Select Lots</p>
                                        {LOTS.map(lot => (
                                            <div key={lot} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`lot-${cleaner.id}-${lot}`}
                                                    checked={availableLots.includes(lot)}
                                                    onCheckedChange={() => handleLotsChange(cleaner.id, availableLots, lot)}
                                                />
                                                <Label htmlFor={`lot-${cleaner.id}-${lot}`}>Lot {lot}</Label>
                                            </div>
                                        ))}
                                   </div>
                                </PopoverContent>
                            </Popover>
                        </TableCell>
                        <TableCell className="py-2 align-top">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="notes" className="border-b-0">
                            <AccordionTrigger className="py-2 text-sm font-normal hover:no-underline">
                                {cleaner.availabilityNotes ? 'View/Edit Notes' : 'Add Notes'}
                            </AccordionTrigger>
                            <AccordionContent>
                                <Textarea
                                placeholder="Add availability notes..."
                                value={cleaner.availabilityNotes || ''}
                                onChange={(e) => onUpdateCleaner(cleaner.id, { availabilityNotes: e.target.value })}
                                className="w-full min-h-[60px] resize-y"
                                />
                            </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        </TableCell>
                    </TableRow>
                    )
                }) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                    No cleaners found.
                    </TableCell>
                </TableRow>
                )}
                </TableBody>
            </Table>
            </div>
        </CardContent>
    </Card>
  );
}
