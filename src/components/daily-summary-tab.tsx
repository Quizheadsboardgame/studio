'use client';

import { useReducer } from 'react';
import type { Site, Cleaner, SiteStatus, CleanerPerformance } from '@/lib/data';
import { schedule } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DailySummaryTabProps {
  sites: Site[];
  cleaners: Cleaner[];
}

type GroupedItems<T> = {
  red: T[];
  amber: T[];
  green: T[];
  other: T[];
};

const getSiteColor = (status: SiteStatus) => {
    if (status === 'Client happy') return 'green';
    if (status.includes('action plan') || status === 'Client concerns') return 'red';
    if (status === 'Operations request' || status === 'Under control') return 'amber';
    return 'other';
}

const getCleanerColor = (rating: CleanerPerformance) => {
    if (rating === 'Excellent feedback') return 'green';
    if (rating.includes('action plan') || rating === 'Needs retraining' || rating === 'Operational concerns') return 'red';
    if (rating === 'Site satisfied' || rating === 'Slight improvement needed') return 'amber';
    return 'other';
}


export default function DailySummaryTab({ sites, cleaners }: DailySummaryTabProps) {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const groupedSites = sites.reduce((acc, site) => {
    if (site.status === 'N/A' && (!site.notes || site.notes.trim() === '')) return acc;
    const color = getSiteColor(site.status);
    acc[color].push(site);
    return acc;
  }, { red: [], amber: [], green: [], other: [] } as GroupedItems<Site>);

  const groupedCleaners = cleaners.reduce((acc, cleaner) => {
    if (cleaner.rating === 'N/A' && (!cleaner.notes || cleaner.notes.trim() === '')) return acc;
    const color = getCleanerColor(cleaner.rating);
    acc[color].push(cleaner);
    return acc;
  }, { red: [], amber: [], green: [], other: [] } as GroupedItems<Cleaner>);

  const hasContent = [
      ...Object.values(groupedSites).flat(), 
      ...Object.values(groupedCleaners).flat()
    ].length > 0;

  const renderColorPill = (color: 'red' | 'amber' | 'green' | 'other') => {
      return <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', {
          'bg-destructive': color === 'red',
          'bg-chart-4': color === 'amber',
          'bg-accent': color === 'green',
          'bg-muted': color ==='other',
      })} />
  }

  return (
    <div className="space-y-4">
       <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Daily Operations Report</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        A summary of all site statuses, cleaner performance, and notes.
                    </p>
                </div>
                <Button onClick={forceUpdate} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Summary
                </Button>
            </CardHeader>
            <CardContent>
                {hasContent ? (
                    <div className="space-y-6">
                        {/* SITE SUMMARY */}
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Site Status Summary</h3>
                            <div className="space-y-4 p-4 border rounded-lg">
                                 {groupedSites.red.length > 0 && (
                                     <div className="space-y-2">
                                        <div className="flex items-center gap-2">{renderColorPill('red')} <h4 className="font-medium">Red: Sites With Issues</h4></div>
                                        {groupedSites.red.map(site => (
                                            <div key={site.id} className="pl-6 space-y-1">
                                                <p className="font-medium text-foreground">{site.name} <span className="text-sm font-normal text-muted-foreground">({site.status})</span></p>
                                                {site.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-2 border-l-2 ml-1">{site.notes}</p>}
                                            </div>
                                        ))}
                                     </div>
                                 )}
                                 {groupedSites.amber.length > 0 && (
                                     <div className="space-y-2">
                                        <div className="flex items-center gap-2">{renderColorPill('amber')} <h4 className="font-medium">Amber: Sites to Monitor</h4></div>
                                        {groupedSites.amber.map(site => (
                                            <div key={site.id} className="pl-6 space-y-1">
                                                <p className="font-medium text-foreground">{site.name} <span className="text-sm font-normal text-muted-foreground">({site.status})</span></p>
                                                {site.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-2 border-l-2 ml-1">{site.notes}</p>}
                                            </div>
                                        ))}
                                     </div>
                                 )}
                                 {groupedSites.green.length > 0 && (
                                     <div className="space-y-2">
                                        <div className="flex items-center gap-2">{renderColorPill('green')} <h4 className="font-medium">Green: Positive Sites</h4></div>
                                        {groupedSites.green.map(site => (
                                            <div key={site.id} className="pl-6 space-y-1">
                                                <p className="font-medium text-foreground">{site.name} <span className="text-sm font-normal text-muted-foreground">({site.status})</span></p>
                                                {site.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-2 border-l-2 ml-1">{site.notes}</p>}
                                            </div>
                                        ))}
                                     </div>
                                 )}
                                 {groupedSites.other.length > 0 && (
                                     <div className="space-y-2">
                                        <div className="flex items-center gap-2">{renderColorPill('other')} <h4 className="font-medium">Other Sites with Notes</h4></div>
                                        {groupedSites.other.map(site => (
                                            <div key={site.id} className="pl-6 space-y-1">
                                                <p className="font-medium text-foreground">{site.name} <span className="text-sm font-normal text-muted-foreground">({site.status})</span></p>
                                                {site.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-2 border-l-2 ml-1">{site.notes}</p>}
                                            </div>
                                        ))}
                                     </div>
                                 )}
                                 {Object.values(groupedSites).every(g => g.length === 0) && (
                                     <p className="text-sm text-muted-foreground">No site statuses or notes recorded.</p>
                                 )}
                            </div>
                        </div>

                        <Separator />

                        {/* CLEANER SUMMARY */}
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Cleaner Performance Summary</h3>
                             <div className="space-y-4 p-4 border rounded-lg">
                                {groupedCleaners.red.length > 0 && (
                                     <div className="space-y-2">
                                        <div className="flex items-center gap-2">{renderColorPill('red')} <h4 className="font-medium">Red: Performance Issues</h4></div>
                                        {groupedCleaners.red.map(cleaner => (
                                            <div key={cleaner.id} className="pl-6 space-y-1">
                                                <p className="font-medium text-foreground">{cleaner.name} <span className="text-sm font-normal text-muted-foreground">({cleaner.rating})</span></p>
                                                {cleaner.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-2 border-l-2 ml-1">{cleaner.notes}</p>}
                                            </div>
                                        ))}
                                     </div>
                                 )}
                                 {groupedCleaners.amber.length > 0 && (
                                     <div className="space-y-2">
                                        <div className="flex items-center gap-2">{renderColorPill('amber')} <h4 className="font-medium">Amber: Performance to Monitor</h4></div>
                                        {groupedCleaners.amber.map(cleaner => (
                                            <div key={cleaner.id} className="pl-6 space-y-1">
                                                <p className="font-medium text-foreground">{cleaner.name} <span className="text-sm font-normal text-muted-foreground">({cleaner.rating})</span></p>
                                                {cleaner.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-2 border-l-2 ml-1">{cleaner.notes}</p>}
                                            </div>
                                        ))}
                                     </div>
                                 )}
                                 {groupedCleaners.green.length > 0 && (
                                     <div className="space-y-2">
                                        <div className="flex items-center gap-2">{renderColorPill('green')} <h4 className="font-medium">Green: Positive Performance</h4></div>
                                        {groupedCleaners.green.map(cleaner => (
                                            <div key={cleaner.id} className="pl-6 space-y-1">
                                                <p className="font-medium text-foreground">{cleaner.name} <span className="text-sm font-normal text-muted-foreground">({cleaner.rating})</span></p>
                                                {cleaner.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-2 border-l-2 ml-1">{cleaner.notes}</p>}
                                            </div>
                                        ))}
                                     </div>
                                 )}
                                 {groupedCleaners.other.length > 0 && (
                                     <div className="space-y-2">
                                        <div className="flex items-center gap-2">{renderColorPill('other')} <h4 className="font-medium">Other Cleaners with Notes</h4></div>
                                        {groupedCleaners.other.map(cleaner => (
                                            <div key={cleaner.id} className="pl-6 space-y-1">
                                                <p className="font-medium text-foreground">{cleaner.name} <span className="text-sm font-normal text-muted-foreground">({cleaner.rating})</span></p>
                                                {cleaner.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-2 border-l-2 ml-1">{cleaner.notes}</p>}
                                            </div>
                                        ))}
                                     </div>
                                 )}
                                 {Object.values(groupedCleaners).every(g => g.length === 0) && (
                                     <p className="text-sm text-muted-foreground">No cleaner performance ratings or notes recorded.</p>
                                 )}
                            </div>
                        </div>

                         <Separator />
                        
                        {/* SCHEDULE SUMMARY */}
                        <div>
                             <h3 className="font-semibold text-lg mb-2">Today's Schedule</h3>
                              <div className="border rounded-lg overflow-hidden">
                                <div className="max-h-60 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-muted">
                                            <tr>
                                                <th className="py-2 px-4 text-left font-medium">Site</th>
                                                <th className="py-2 px-4 text-left font-medium">Cleaner</th>
                                                <th className="py-2 px-4 text-left font-medium">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {schedule.map((entry) => (
                                                <tr key={entry.id} className="border-b last:border-0">
                                                    <td className="py-2 px-4 font-medium">{entry.site}</td>
                                                    <td className="py-2 px-4">{entry.cleaner}</td>
                                                    <td className="py-2 px-4">{entry.start} - {entry.finish}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                              </div>
                        </div>
                    </div>
                ) : (
                  <div className="rounded-lg p-6 min-h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground">No notes or statuses to report. Click refresh to check for updates.</p>
                  </div>
                )}
            </CardContent>
       </Card>
    </div>
  );
}
