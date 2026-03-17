'use client';

import type { Site, AuditStatus, SiteStatus } from '@/lib/data';
import { auditStatuses } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AuditsTabProps {
  sites: Site[];
  onUpdateAudit: (siteId: string, auditData: Partial<Site>) => void;
}

export default function AuditsTab({ sites, onUpdateAudit }: AuditsTabProps) {

  const handleScoreChange = (siteId: string, scoreString: string) => {
    const score = scoreString === '' ? undefined : parseInt(scoreString, 10);

    if (score !== undefined && (score < 0 || score > 100)) return;

    const updateData: Partial<Site> = { auditScore: score };

    if (score !== undefined) {
      updateData.auditStatus = 'Completed';
      updateData.auditCompletedDate = format(new Date(), 'yyyy-MM-dd');
      
      if (score <= 95) {
        updateData.status = 'Site under action plan';
      } else if (score >= 96 && score <= 98) {
        updateData.status = 'Client concerns';
      } else if (score >= 99 && score <= 100) {
        updateData.status = 'Client happy';
      }
    }
    
    onUpdateAudit(siteId, updateData);
  };
  
  const handleStatusChange = (siteId: string, newStatus: AuditStatus) => {
    const updateData: Partial<Site> = { auditStatus: newStatus };
    if (newStatus !== 'Completed') {
      updateData.auditScore = undefined;
      updateData.auditCompletedDate = undefined;
    }
    onUpdateAudit(siteId, updateData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Audits</CardTitle>
        <CardDescription>Track and score audits for each site. Site status will be updated based on the score.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Site</TableHead>
                <TableHead className="w-[20%]">Audit Status</TableHead>
                <TableHead className="w-[15%]">Audit Score (%)</TableHead>
                <TableHead className="w-[15%]">Completed Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.length > 0 ? sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium align-top py-4">{site.name}</TableCell>
                  <TableCell className="align-top py-4">
                    <Select
                      value={site.auditStatus || 'Not Booked'}
                      onValueChange={(newStatus: AuditStatus) => handleStatusChange(site.id, newStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {auditStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="align-top py-4">
                     <Input
                        type="number"
                        placeholder="Score"
                        value={site.auditScore ?? ''}
                        onChange={(e) => handleScoreChange(site.id, e.target.value)}
                        min="0"
                        max="100"
                        className="w-24"
                      />
                  </TableCell>
                   <TableCell className="align-top py-4 text-sm text-muted-foreground">
                    {site.auditCompletedDate ? format(parseISO(site.auditCompletedDate), 'PPP') : 'N/A'}
                  </TableCell>
                  <TableCell className="py-2 align-top">
                     <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="notes" className="border-b-0">
                        <AccordionTrigger className="py-2 text-sm font-normal hover:no-underline">
                            {site.auditNotes ? 'View/Edit Notes' : 'Add Notes'}
                        </AccordionTrigger>
                        <AccordionContent>
                          <Textarea
                            placeholder="Add audit notes..."
                            value={site.auditNotes || ''}
                            onChange={(e) => onUpdateAudit(site.id, { auditNotes: e.target.value })}
                            className="w-full min-h-[60px] resize-y"
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No sites found.
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
