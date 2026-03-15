'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Site, SiteStatus } from '@/lib/data';
import { siteStatuses } from '@/lib/data';
import { PlusCircle, Pencil, Check, X, Trash2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SitesTabProps {
  sites: Site[];
  onStatusChange: (siteId: string, newStatus: SiteStatus) => void;
  onNoteChange: (siteId: string, newNote: string) => void;
  onAddSite: (siteName: string) => void;
  onEditSite: (siteId: string, newName: string) => void;
  onRemoveSite: (siteId: string) => void;
}

export default function SitesTab({ sites, onStatusChange, onNoteChange, onAddSite, onEditSite, onRemoveSite }: SitesTabProps) {
  const [newSiteName, setNewSiteName] = useState('');
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editedSiteName, setEditedSiteName] = useState('');

  const handleAddClick = () => {
    onAddSite(newSiteName);
    setNewSiteName('');
  };

  const handleEditClick = (site: Site) => {
    setEditingSiteId(site.id);
    setEditedSiteName(site.name);
  };

  const handleCancelEdit = () => {
    setEditingSiteId(null);
    setEditedSiteName('');
  };

  const handleSaveEdit = (siteId: string) => {
    if (editedSiteName.trim()) {
      onEditSite(siteId, editedSiteName.trim());
    }
    setEditingSiteId(null);
    setEditedSiteName('');
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
              <TableHead className="w-[120px] text-right">Actions</TableHead>
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
                   {editingSiteId === site.id ? (
                    <Input
                      value={editedSiteName}
                      onChange={(e) => setEditedSiteName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(site.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                      className="h-9"
                    />
                  ) : (
                    site.name
                  )}
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
                 <TableCell className="align-top py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {editingSiteId === site.id ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(site.id)}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(site)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the site and all its related data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onRemoveSite(site.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
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
