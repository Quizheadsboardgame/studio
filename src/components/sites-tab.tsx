'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Site, SiteStatus } from '@/lib/data';
import { siteStatuses } from '@/lib/data';

interface SitesTabProps {
  sites: Site[];
  onStatusChange: (siteId: string, newStatus: SiteStatus) => void;
}

export default function SitesTab({ sites, onStatusChange }: SitesTabProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[60%]">Site</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sites.map((site) => (
                    <TableRow key={site.id}>
                        <TableCell className="font-medium">{site.name}</TableCell>
                        <TableCell>
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
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
}
