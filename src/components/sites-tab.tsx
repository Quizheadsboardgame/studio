'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Site } from '@/lib/data';
import { PlusCircle, Pencil, Check, X, Trash2, UserSearch, Star, Lock } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';

interface SitesTabProps {
  sites: Site[];
  onNoteChange: (siteId: string, newNote: string) => void;
  onAddSite: (siteName: string) => void;
  onEditSite: (siteId: string, newName: string) => void;
  onRemoveSite: (siteId: string) => void;
}

export default function SitesTab({ sites, onNoteChange, onAddSite, onEditSite, onRemoveSite }: SitesTabProps) {
  const { user } = useFirebase();
  const isReadOnly = !!user?.isAnonymous;
  const [newSiteName, setNewSiteName] = useState('');
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editedSiteName, setEditedSiteName] = useState('');
  const { toast } = useToast();

  const handleAddClick = () => {
    const trimmedName = newSiteName.trim();
    if (trimmedName === '') return;

    if (sites.some(site => site.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Site',
        description: `A site with the name "${trimmedName}" already exists.`,
      });
      return;
    }
    
    onAddSite(trimmedName);
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
    const trimmedName = editedSiteName.trim();
    if (!trimmedName) {
      handleCancelEdit();
      return;
    }

    if (sites.some(site => site.id !== siteId && site.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Site',
        description: `A site with the name "${trimmedName}" already exists.`,
      });
      return;
    }
    
    onEditSite(siteId, trimmedName);
    setEditingSiteId(null);
    setEditedSiteName('');
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Enter new site name..."
          value={newSiteName}
          onChange={(e) => setNewSiteName(e.target.value)}
          className="max-w-sm"
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddClick(); }}
          disabled={isReadOnly}
        />
        <Button onClick={handleAddClick} size="sm" disabled={isReadOnly}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">Site</TableHead>
              <TableHead className="w-[15%] hidden md:table-cell">Site Code</TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[10%]">Contacts</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.length > 0 ? sites.map((site) => (
              <TableRow key={site.id} className={cn({
                'border-l-4 border-gold-star': site.status === 'Gold Star Site',
                'border-l-4 border-accent': site.status === 'Client happy' || site.status === 'No Concerns',
                'border-l-4 border-destructive': site.status === 'Site under action plan' || site.status === 'Site requires action plan',
                'border-l-4 border-chart-4': site.status === 'Client concerns',
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
                    <>
                      {site.status === 'Gold Star Site' && <Star className="h-4 w-4 inline-block mr-2 text-gold-star fill-gold-star" />}
                      {site.name}
                    </>
                  )}
                </TableCell>
                <TableCell className="align-top py-4 text-muted-foreground hidden md:table-cell">{site.siteCode}</TableCell>
                <TableCell className="align-top py-4 font-medium">
                  {site.status}
                </TableCell>
                <TableCell className="py-2 align-top">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="notes" className="border-b-0">
                      <AccordionTrigger className="py-2 text-sm font-normal hover:no-underline" disabled={isReadOnly && !site.notes}>
                          {site.notes ? 'View/Edit Notes' : 'Add Notes'}
                      </AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          placeholder="Add notes for this site..."
                          value={site.notes || ''}
                          onChange={(e) => onNoteChange(site.id, e.target.value)}
                          className="w-full min-h-[60px] resize-y"
                          disabled={isReadOnly}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TableCell>
                <TableCell className="align-top py-4">
                   {isReadOnly ? (
                        <Button variant="outline" size="sm" className="w-full" disabled>
                            <Lock className="mr-2 h-4 w-4" /> Locked
                        </Button>
                   ) : site.contacts && site.contacts.length > 0 ? (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full">
                                  <UserSearch className="mr-2 h-4 w-4" /> 
                                  {site.contacts.length}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                    <div className="space-y-1">
                                        <h4 className="font-medium leading-none">Client Contacts</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {site.name}
                                        </p>
                                    </div>
                                    <div className="grid gap-4">
                                        {site.contacts.map((contact, index) => (
                                            <div key={index} className="grid gap-1">
                                                <p className="text-sm font-medium leading-none">{contact.name}</p>
                                                {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                                                {contact.phone && <p className="text-sm text-muted-foreground">Tel: {contact.phone}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                    )}
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
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(site)} disabled={isReadOnly}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isReadOnly}>
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
                <TableCell colSpan={6} className="h-24 text-center">
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
