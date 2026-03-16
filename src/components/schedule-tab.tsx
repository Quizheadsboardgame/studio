import { schedule } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CompanyScheduleTab() {
  return (
    <div className="border rounded-lg overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Cleaner</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Finish</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {schedule.map((entry) => (
                    <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.site}</TableCell>
                        <TableCell>{entry.cleaner}</TableCell>
                        <TableCell>{entry.start}</TableCell>
                        <TableCell>{entry.finish}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
}
