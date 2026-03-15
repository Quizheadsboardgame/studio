'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Cleaner, CleanerPerformance } from '@/lib/data';
import { cleanerPerformances } from '@/lib/data';

interface CleanersTabProps {
  cleaners: Cleaner[];
  onRatingChange: (cleanerId: string, newRating: CleanerPerformance) => void;
}

export default function CleanersTab({ cleaners, onRatingChange }: CleanersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCleaners = cleaners.filter(cleaner =>
    cleaner.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search Cleaner..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Cleaner</TableHead>
              <TableHead>Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCleaners.length > 0 ? filteredCleaners.map((cleaner) => (
              <TableRow key={cleaner.id}>
                <TableCell className="font-medium">{cleaner.name}</TableCell>
                <TableCell>
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
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  No cleaners found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
