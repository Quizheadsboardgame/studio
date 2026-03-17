'use client';

import type { Site, AuditStatus } from '@/lib/data';
import { auditStatuses } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from '@/components/ui/date-picker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AuditsTabProps {
  sites: Site[];
  onUpdateAudit: (siteId: string, auditData: Partial<Pick<Site, 'auditStatus' | 'auditBookedDate' | 'auditCompletedDate' | 'auditNotes'>>) => void;
}

export default function AuditsTab({ sites, onUpdateAudit }: AuditsTabProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Audits</CardTitle>
        <CardDescription>Track booked and completed audits for each site.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Site</TableHead>
                <TableHead className="w-[20%]">Audit Status</TableHead>
                <TableHead className="w-[15%]">Booked Date</TableHead>
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
                      onValueChange={(newStatus: AuditStatus) => onUpdateAudit(site.id, { auditStatus: newStatus })}
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
                    <DatePicker
                      date={site.auditBookedDate ? parseISO(site.auditBookedDate) : undefined}
                      onDateChange={(date) => onUpdateAudit(site.id, { auditBookedDate: date ? format(date, 'yyyy-MM-dd') : undefined })}
                      placeholder="Set date"
                    />
                  </TableCell>
                   <TableCell className="align-top py-4">
                    <DatePicker
                      date={site.auditCompletedDate ? parseISO(site.auditCompletedDate) : undefined}
                      onDateChange={(date) => onUpdateAudit(site.id, { auditCompletedDate: date ? format(date, 'yyyy-MM-dd') : undefined })}
                      placeholder="Set date"
                      disabled={site.auditStatus !== 'Completed'}
                    />
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
