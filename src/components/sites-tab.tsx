'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Site, SiteStatus } from '@/lib/data';
import { siteStatuses } from '@/lib/data';
import { PlusCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface SitesTabProps {
  sites: Site[];
  onStatusChange: (siteId: string, newStatus: SiteStatus) => void;
  onNoteChange: (siteId: string, newNote: string) => void;
  onAddSite: (siteName: string) => void;
}

export default function SitesTab({ sites, onStatusChange, onNoteChange, onAddSite }: SitesTabProps) {
  const [newSiteName, setNewSiteName] = useState('');

  const handleAddClick = () => {
    onAddSite(newSiteName);
    setNewSiteName('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter new site name..."
          value={newSiteName}
          onChange={(e) => setNewSiteName(e.target.value)}
          className="max-w-sm"
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddClick(); }}
        />
        <Button onClick={handleAddClick} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Site</TableHead>
              <TableHead className="w-[25%]">Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.length > 0 ? sites.map((site) => (
              <TableRow key={site.id} className={cn({
                'border-l-4 border-accent': site.status === 'Client happy',
                'border-l-4 border-destructive': site.status === 'Client concerns' || site.status.includes('action plan'),
                'border-l-4 border-chart-4': site.status === 'Operations request' || site.status === 'Under control',
                'border-l-4 border-transparent': site.status === 'N/A',
              })}>
                <TableCell className="font-medium align-top py-4">
                  {site.name}
                </TableCell>
                <TableCell className="align-top py-4">
                  <Select
                    value={site.status}
                    onValueChange={(newStatus: SiteStatus) => onStatusChange(site.id, newStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {siteStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="py-2 align-top">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="notes" className="border-b-0">
                      <AccordionTrigger className="py-2 text-sm font-normal hover:no-underline">
                          {site.notes ? 'View/Edit Notes' : 'Add Notes'}
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          placeholder="Add notes for this site..."
                          value={site.notes || ''}
                          onChange={(e) => onNoteChange(site.id, e.target.value)}
                          className="w-full min-h-[60px] resize-y"
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No sites found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
