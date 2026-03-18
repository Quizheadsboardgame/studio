'use client';

import { useReducer, useMemo, useRef, useState } from 'react';
import type { Site, Cleaner, SiteStatus, CleanerPerformance, ActionPlan, ScheduleEntry, Leave } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday } from 'date-fns';

interface DailySummaryTabProps {
  sites: Site[];
  cleaners: Cleaner[];
  actionPlans: ActionPlan[];
  schedule: ScheduleEntry[];
  leave: Leave[];
}

type GroupedItems<T> = {
  red: T[];
  amber: T[];
  green: T[];
  other: T[];
};

const getSiteColor = (status: SiteStatus) => {
    if (status === 'Client happy' || status === 'Site satisfied') return 'green';
    if (status.includes('action plan') || status === 'Client concerns') return 'red';
    if (status === 'Operations request' || status === 'Under control') return 'amber';
    return 'other';
}

const getCleanerColor = (rating: CleanerPerformance) => {
    if (rating === 'Excellent feedback' || rating === 'Site satisfied') return 'green';
    if (rating.includes('action plan') || rating === 'Needs retraining' || rating === 'Operational concerns') return 'red';
    if (rating === 'Slight improvement needed') return 'amber';
    return 'other';
}


function PrintableSummary({ 
  groupedSites, 
  groupedCleaners, 
  todaysTasks, 
  todaysShiftsToCover,
  schedule,
  forwardedRef 
}: { 
  groupedSites: GroupedItems<Site>,
  groupedCleaners: GroupedItems<Cleaner>,
  todaysTasks: any[],
  todaysShiftsToCover: any[],
  schedule: ScheduleEntry[],
  forwardedRef: React.Ref<HTMLDivElement> 
}) {
  return (
    <div ref={forwardedRef} className="p-8 bg-white text-black" style={{ width: '794px', minHeight: '1123px' }}>
        <h1 className="text-3xl font-bold mb-2 border-b-2 border-black pb-2">Daily Operations Report</h1>
        <p className="text-lg mb-6">{format(new Date(), 'PPP')}</p>

        <div className="space-y-8">
            {/* COVER SUMMARY */}
            {todaysShiftsToCover.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">Absences & Cover Today</h3>
                    <div className="space-y-4">
                        {todaysShiftsToCover.map(shift => (
                        <div key={shift.id} className="pl-4">
                            <p className="font-semibold">{shift.cleanerName} is off ({shift.type}) - Shift: {shift.site}</p>
                            {shift.isCovered ? (
                                <p className="text-gray-700">Covered by: {shift.coverCleanerName}</p>
                            ) : (
                                <p className="text-red-700 font-bold">NOT COVERED</p>
                            )}
                        </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* ACTION PLAN TASKS FOR TODAY */}
            {todaysTasks.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">Action Plan Tasks Due Today</h3>
                <div className="space-y-2">
                  {todaysTasks.map(task => (
                    <div key={task.id} className="pl-4">
                      <p className="font-semibold">{task.description}</p>
                      <p className="text-gray-700">For: {task.targetName} ({task.targetType})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* SITE SUMMARY */}
            <div>
                <h3 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">Site Status Summary</h3>
                <div className="space-y-4">
                     {groupedSites.red.map(site => (
                        <div key={site.id} className="pl-4">
                            <p className="font-semibold">{site.name} - <span className="font-normal text-red-700">{site.status}</span></p>
                            {site.notes && <p className="text-gray-600 italic whitespace-pre-wrap pl-2 border-l-2 ml-1">"{site.notes}"</p>}
                        </div>
                    ))}
                     {groupedSites.amber.map(site => (
                         <div key={site.id} className="pl-4">
                            <p className="font-semibold">{site.name} - <span className="font-normal text-yellow-700">{site.status}</span></p>
                            {site.notes && <p className="text-gray-600 italic whitespace-pre-wrap pl-2 border-l-2 ml-1">"{site.notes}"</p>}
                        </div>
                    ))}
                     {groupedSites.green.map(site => (
                         <div key={site.id} className="pl-4">
                            <p className="font-semibold">{site.name} - <span className="font-normal text-green-700">{site.status}</span></p>
                            {site.notes && <p className="text-gray-600 italic whitespace-pre-wrap pl-2 border-l-2 ml-1">"{site.notes}"</p>}
                        </div>
                    ))}
                     {groupedSites.other.map(site => (
                        <div key={site.id} className="pl-4">
                           <p className="font-semibold">{site.name} - <span className="font-normal">{site.status}</span></p>
                           {site.notes && <p className="text-gray-600 italic whitespace-pre-wrap pl-2 border-l-2 ml-1">"{site.notes}"</p>}
                       </div>
                    ))}
                </div>
            </div>

            {/* CLEANER SUMMARY */}
            <div>
                <h3 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">Cleaner Performance Summary</h3>
                 <div className="space-y-4">
                    {groupedCleaners.red.map(cleaner => (
                         <div key={cleaner.id} className="pl-4">
                            <p className="font-semibold">{cleaner.name} - <span className="font-normal text-red-700">{cleaner.rating}</span></p>
                            {cleaner.notes && <p className="text-gray-600 italic whitespace-pre-wrap pl-2 border-l-2 ml-1">"{cleaner.notes}"</p>}
                        </div>
                    ))}
                     {groupedCleaners.amber.map(cleaner => (
                         <div key={cleaner.id} className="pl-4">
                            <p className="font-semibold">{cleaner.name} - <span className="font-normal text-yellow-700">{cleaner.rating}</span></p>
                            {cleaner.notes && <p className="text-gray-600 italic whitespace-pre-wrap pl-2 border-l-2 ml-1">"{cleaner.notes}"</p>}
                        </div>
                    ))}
                     {groupedCleaners.green.map(cleaner => (
                         <div key={cleaner.id} className="pl-4">
                            <p className="font-semibold">{cleaner.name} - <span className="font-normal text-green-700">{cleaner.rating}</span></p>
                            {cleaner.notes && <p className="text-gray-600 italic whitespace-pre-wrap pl-2 border-l-2 ml-1">"{cleaner.notes}"</p>}
                        </div>
                    ))}
                     {groupedCleaners.other.map(cleaner => (
                         <div key={cleaner.id} className="pl-4">
                           <p className="font-semibold">{cleaner.name} - <span className="font-normal">{cleaner.rating}</span></p>
                           {cleaner.notes && <p className="text-gray-600 italic whitespace-pre-wrap pl-2 border-l-2 ml-1">"{cleaner.notes}"</p>}
                       </div>
                    ))}
                </div>
            </div>
            
            {/* SCHEDULE SUMMARY */}
            <div>
                 <h3 className="text-xl font-bold mb-3 border-b border-gray-400 pb-1">Today's Schedule</h3>
                 <table className="w-full text-left">
                     <thead>
                         <tr className="border-b-2 border-black">
                             <th className="py-2 w-1/3">Site</th>
                             <th className="py-2 w-1/3">Cleaner</th>
                             <th className="py-2 w-1/3">Time</th>
                         </tr>
                     </thead>
                     <tbody>
                         {schedule.map((entry) => (
                             <tr key={entry.id} className="border-b border-gray-300">
                                 <td className="py-2">{entry.site}</td>
                                 <td className="py-2">{entry.cleaner}</td>
                                 <td className="py-2">{entry.start} - {entry.finish}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
            </div>
        </div>

        <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', textAlign: 'center', fontSize: '10px', color: '#888' }}>
          Report Generated by Excellerate Services on {format(new Date(), 'PPP')}
        </div>
    </div>
  );
}


export default function DailySummaryTab({ sites, cleaners, actionPlans, schedule, leave }: DailySummaryTabProps) {
  const [key, forceUpdate] = useReducer((x) => x + 1, 0);
  const printableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
  
  const todaysTasks = actionPlans
    .flatMap(plan => plan.tasks.map(task => ({ ...task, targetName: plan.targetName, targetType: plan.targetType })))
    .filter(task => task.dueDate && isToday(parseISO(task.dueDate)) && !task.completed);

  const todaysAbsences = useMemo(() => {
    return leave.filter(l => isToday(parseISO(l.date)));
  }, [leave]);
  
  const todaysShiftsToCover = useMemo(() => {
     return todaysAbsences.flatMap(absence => {
        const cleanerSchedule = schedule.filter(s => s.cleaner === absence.cleanerName);
        
        if (cleanerSchedule.length > 0) {
            return cleanerSchedule.map((shift, index) => {
                const coverAssignment = absence.coverAssignments?.find(a => a.site === shift.site);
                return {
                    id: `${absence.id}-${shift.id || index}`,
                    cleanerName: absence.cleanerName,
                    type: absence.type,
                    site: shift.site,
                    isCovered: !!coverAssignment,
                    coverCleanerName: coverAssignment?.coverCleanerName
                }
            });
        }
        
        return []; // Don't show entry if cleaner had no shifts
    });
  }, [todaysAbsences, schedule]);


  const hasContent = [
      ...Object.values(groupedSites).flat(), 
      ...Object.values(groupedCleaners).flat(),
      ...todaysTasks,
      ...todaysShiftsToCover,
    ].length > 0;

  const renderColorPill = (color: 'red' | 'amber' | 'green' | 'other') => {
      return <span className={cn('h-4 w-1.5 rounded-full shrink-0', {
          'bg-destructive': color === 'red',
          'bg-chart-4': color === 'amber',
          'bg-accent': color === 'green',
          'bg-muted': color ==='other',
      })} />
  }
  
  const handleGeneratePdf = async () => {
    if (!printableRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      
      let imgWidthInPdf = pdfWidth - 20;
      let imgHeightInPdf = imgWidthInPdf / ratio;
      
      if (imgHeightInPdf > pdfHeight - 20) {
        imgHeightInPdf = pdfHeight - 20;
        imgWidthInPdf = imgHeightInPdf * ratio;
      }

      const x = (pdfWidth - imgWidthInPdf) / 2;
      const y = 10;

      pdf.addImage(imgData, 'PNG', x, y, imgWidthInPdf, imgHeightInPdf);
      pdf.save(`Daily_Summary_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  return (
    <div className="space-y-4" key={key}>
       <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <PrintableSummary
              forwardedRef={printableRef}
              groupedSites={groupedSites}
              groupedCleaners={groupedCleaners}
              todaysTasks={todaysTasks}
              todaysShiftsToCover={todaysShiftsToCover}
              schedule={schedule}
          />
      </div>
       <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Daily Operations Report</CardTitle>
                    <CardDescription>
                        A summary of all site statuses, cleaner performance, and notes.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={forceUpdate} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf} size="sm">
                        {isGeneratingPdf ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                        {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {hasContent ? (
                    <div className="space-y-6">

                        {/* COVER SUMMARY */}
                        {todaysShiftsToCover.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Absences & Cover Today</h3>
                                <div className="space-y-4 p-4 border rounded-lg">
                                    {todaysShiftsToCover.map(shift => (
                                    <div key={shift.id} className="flex items-center gap-3">
                                        <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', {
                                            'bg-accent': shift.isCovered,
                                            'bg-destructive': !shift.isCovered,
                                        })} />
                                        <div className="flex-grow">
                                        <p className="font-medium">{shift.cleanerName} is off ({shift.type})</p>
                                        <p className="text-sm text-muted-foreground">Shift: {shift.site}</p>
                                        {shift.isCovered ? (
                                            <p className="text-sm text-muted-foreground">Covered by: {shift.coverCleanerName}</p>
                                        ) : (
                                            <p className="text-sm text-destructive font-medium">NOT COVERED</p>
                                        )}
                                        </div>
                                    </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(todaysShiftsToCover.length > 0 && (todaysTasks.length > 0 || Object.values(groupedSites).flat().length > 0)) && <Separator />}


                        {/* ACTION PLAN TASKS FOR TODAY */}
                        {todaysTasks.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-lg mb-2">Action Plan Tasks Due Today</h3>
                            <div className="space-y-4 p-4 border rounded-lg">
                              {todaysTasks.map(task => (
                                <div key={task.id} className="pl-6 space-y-1">
                                  <p className="font-medium text-foreground">{task.description}</p>
                                  <p className="text-sm text-muted-foreground">
                                    For: {task.targetName} ({task.targetType})
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {todaysTasks.length > 0 && <Separator />}

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
