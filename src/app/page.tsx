'use client';

import { useState, useEffect, useMemo } from 'react';
import { initialSites, initialCleaners, initialSchedule, type Site, type Cleaner, type SiteStatus, type CleanerPerformance, type ActionPlan, type Leave, type ScheduleEntry } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, ClipboardCheck, ClipboardList, CalendarDays } from 'lucide-react';
import SitesTab from '@/components/sites-tab';
import CleanersTab from '@/components/cleaners-tab';
import CompanyScheduleTab from '@/components/schedule-tab';
import RiskDashboardTab from '@/components/risk-dashboard-tab';
import DailySummaryTab from '@/components/daily-summary-tab';
import ActionPlanTab from '@/components/action-plan-tab';
import LeaveCalendarTab from '@/components/leave-calendar-tab';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase, initiateAnonymousSignIn, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [initialSeedDone, setInitialSeedDone] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  const sitesCollection = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'sites') : null, [firestore, user]);
  const { data: sites, isLoading: sitesLoading } = useCollection<Site>(sitesCollection);

  const cleanersCollection = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'cleaners') : null, [firestore, user]);
  const { data: cleaners, isLoading: cleanersLoading } = useCollection<Cleaner>(cleanersCollection);

  const actionPlansCollection = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'actionPlans') : null, [firestore, user]);
  const { data: actionPlans, isLoading: actionPlansLoading } = useCollection<ActionPlan>(actionPlansCollection);
  
  const leaveCollection = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'leave') : null, [firestore, user]);
  const { data: leave, isLoading: leaveLoading } = useCollection<Leave>(leaveCollection);

  const scheduleCollection = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'schedule') : null, [firestore, user]);
  const { data: schedule, isLoading: scheduleLoading } = useCollection<ScheduleEntry>(scheduleCollection);


  const handleSeedDatabase = async () => {
    if (!firestore || !sitesCollection || !cleanersCollection || !scheduleCollection) {
      toast({ variant: "destructive", title: "Cannot Seed", description: "Firebase is not ready." });
      return;
    }
    if (sitesLoading || cleanersLoading || scheduleLoading) {
      toast({ variant: "destructive", title: "Cannot Seed", description: "Data is still loading." });
      return;
    }
    toast({ title: "Re-seeding Database...", description: "This may take a moment." });
    try {
      const batch = writeBatch(firestore);
      
      if (sites) sites.forEach(site => batch.delete(doc(firestore, 'sites', site.id)));
      if (cleaners) cleaners.forEach(cleaner => batch.delete(doc(firestore, 'cleaners', cleaner.id)));
      if (schedule) schedule.forEach(entry => batch.delete(doc(firestore, 'schedule', entry.id)));
      if (leave) leave.forEach(l => batch.delete(doc(firestore, 'leave', l.id)));
      if (actionPlans) actionPlans.forEach(ap => batch.delete(doc(firestore, 'actionPlans', ap.id)));

      initialSites.forEach(site => {
          const docRef = doc(sitesCollection);
          batch.set(docRef, { name: site.name, status: site.status, notes: site.notes });
      });

      initialCleaners.forEach(cleaner => {
          const docRef = doc(cleanersCollection);
          batch.set(docRef, { name: cleaner.name, rating: cleaner.rating, notes: cleaner.notes, holidayAllowance: cleaner.holidayAllowance, holidayTaken: cleaner.holidayTaken, sickDaysTaken: cleaner.sickDaysTaken });
      });

      initialSchedule.forEach(entry => {
          const docRef = doc(scheduleCollection);
          batch.set(docRef, { site: entry.site, cleaner: entry.cleaner, start: entry.start, finish: entry.finish });
      });

      await batch.commit();
      toast({ title: "Database Reloaded", description: "All data has been reset to the initial state." });
    } catch (error) {
      console.error("Error seeding database:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ variant: "destructive", title: "Seeding Failed", description: errorMessage });
    }
  };
  
  useEffect(() => {
    if (!isUserLoading && user && firestore && !sitesLoading && !cleanersLoading && !scheduleLoading && sites && cleaners && schedule && !initialSeedDone) {
        if (sites.length === 0 && cleaners.length === 0 && schedule.length === 0) {
            handleSeedDatabase();
            setInitialSeedDone(true);
        } else {
             // Mark as done even if not empty to prevent re-seeding on navigation
            setInitialSeedDone(true);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoading, user, firestore, sitesLoading, cleanersLoading, scheduleLoading, sites, cleaners, schedule]);


  const handleSiteStatusChange = (siteId: string, newStatus: SiteStatus) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'sites', siteId), { status: newStatus });
  };

  const handleSiteNoteChange = (siteId: string, newNote: string) => {
     if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'sites', siteId), { notes: newNote });
  };

  const handleAddSite = (siteName: string) => {
    if (siteName.trim() === '' || !sitesCollection) return;
    addDocumentNonBlocking(sitesCollection, { name: siteName, status: 'N/A', notes: '' });
  };

  const handleEditSite = (siteId: string, newName: string) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'sites', siteId), { name: newName });
  };

  const handleRemoveSite = (siteId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'sites', siteId));
  };

  const handleCleanerRatingChange = (cleanerId: string, newRating: CleanerPerformance) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'cleaners', cleanerId), { rating: newRating });
  };
  
  const handleCleanerNoteChange = (cleanerId: string, newNote: string) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'cleaners', cleanerId), { notes: newNote });
  };

  const handleAddCleaner = (cleanerName: string) => {
    if (cleanerName.trim() === '' || !cleanersCollection) return;
    addDocumentNonBlocking(cleanersCollection, { name: cleanerName, rating: 'N/A', notes: '', holidayAllowance: 20, holidayTaken: 0, sickDaysTaken: 0 });
  };

  const handleRemoveCleaner = (cleanerId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'cleaners', cleanerId));
  };

  const handleUpdateActionPlan = (updatedPlan: ActionPlan) => {
    if (!firestore || !actionPlansCollection) return;
    setDocumentNonBlocking(doc(actionPlansCollection, updatedPlan.id), updatedPlan, { merge: true });
  };
  
  const handleAddLeave = (newLeaveData: Omit<Leave, 'id' | 'coverAssignments'>) => {
    if (!leaveCollection || !firestore) return;
    addDocumentNonBlocking(leaveCollection, { ...newLeaveData, coverAssignments: [] });

    if (!cleaners) {
      console.warn("Cannot update leave counts: cleaners data not available yet.");
      return;
    }
    const cleaner = cleaners.find(c => c.id === newLeaveData.cleanerId);
    if (cleaner) {
      if (newLeaveData.type === 'holiday') {
        const newHolidayTaken = (cleaner.holidayTaken || 0) + 1;
        updateDocumentNonBlocking(doc(firestore, 'cleaners', newLeaveData.cleanerId), { holidayTaken: newHolidayTaken });
      } else if (newLeaveData.type === 'sick') {
        const newSickDaysTaken = (cleaner.sickDaysTaken || 0) + 1;
        updateDocumentNonBlocking(doc(firestore, 'cleaners', newLeaveData.cleanerId), { sickDaysTaken: newSickDaysTaken });
      }
    }
  };

  const handleUpdateLeave = (leaveId: string, updatedData: Partial<Omit<Leave, 'id'>>) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'leave', leaveId), updatedData);
  };

  const handleDeleteLeave = (leaveToDelete: Leave) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'leave', leaveToDelete.id));

    if (!cleaners) {
      console.warn("Cannot update leave counts: cleaners data not available yet.");
      return;
    }
    const cleaner = cleaners.find(c => c.id === leaveToDelete.cleanerId);
    if (cleaner) {
      if (leaveToDelete.type === 'holiday') {
        const newHolidayTaken = Math.max(0, (cleaner.holidayTaken || 0) - 1);
        updateDocumentNonBlocking(doc(firestore, 'cleaners', leaveToDelete.cleanerId), { holidayTaken: newHolidayTaken });
      } else if (leaveToDelete.type === 'sick') {
        const newSickDaysTaken = Math.max(0, (cleaner.sickDaysTaken || 0) - 1);
        updateDocumentNonBlocking(doc(firestore, 'cleaners', leaveToDelete.cleanerId), { sickDaysTaken: newSickDaysTaken });
      }
    }
  };
  
  const handleAddScheduleEntry = (newEntry: Omit<ScheduleEntry, 'id'>) => {
    if (!scheduleCollection) return;
    addDocumentNonBlocking(scheduleCollection, newEntry);
  };

  const handleUpdateScheduleEntry = (entryId: string, updatedEntry: Partial<Omit<ScheduleEntry, 'id'>>) => {
      if (!firestore) return;
      updateDocumentNonBlocking(doc(firestore, 'schedule', entryId), updatedEntry);
  };

  const handleRemoveScheduleEntry = (entryId: string) => {
      if (!firestore) return;
      deleteDocumentNonBlocking(doc(firestore, 'schedule', entryId));
  };

  const isLoading = isUserLoading || sitesLoading || cleanersLoading || actionPlansLoading || leaveLoading || scheduleLoading;
  const sortedSites = useMemo(() => sites ? [...sites].sort((a, b) => a.name.localeCompare(b.name)) : [], [sites]);
  const sortedCleaners = useMemo(() => cleaners ? [...cleaners].sort((a, b) => a.name.localeCompare(b.name)) : [], [cleaners]);
  const sortedSchedule = useMemo(() => schedule ? [...schedule].sort((a, b) => a.site.localeCompare(b.site) || a.cleaner.localeCompare(b.cleaner)) : [], [schedule]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:h-20 sm:px-6">
          <div className="flex items-center gap-4">
              <div className="bg-accent p-3 rounded-lg">
                  <ClipboardCheck className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-headline">
                    Excellerate Ops
                </h1>
                <p className="text-sm text-muted-foreground">Cleaning Operations Hub</p>
              </div>
          </div>
          <div className="ml-auto">
            <Button onClick={handleSeedDatabase} variant="outline" size="sm">Seed Database</Button>
          </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {isLoading && !initialSeedDone ? (
           <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
        ) : (
          <Tabs defaultValue="sites" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-7 h-auto flex-wrap">
              <TabsTrigger value="sites"><LayoutDashboard className="mr-2 h-4 w-4" />Sites</TabsTrigger>
              <TabsTrigger value="cleaners"><Users className="mr-2 h-4 w-4" />Cleaner Performance</TabsTrigger>
              <TabsTrigger value="company-schedule"><Calendar className="mr-2 h-4 w-4" />Company Schedule</TabsTrigger>
              <TabsTrigger value="leave-calendar"><CalendarDays className="mr-2 h-4 w-4" />Leave Calendar</TabsTrigger>
              <TabsTrigger value="risk"><ShieldAlert className="mr-2 h-4 w-4" />Site Risk Dashboard</TabsTrigger>
              <TabsTrigger value="summary"><FileText className="mr-2 h-4 w-4" />Daily Summary</TabsTrigger>
              <TabsTrigger value="action-plan"><ClipboardList className="mr-2 h-4 w-4" />Action Plans</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sites">
              <Card>
                <CardHeader>
                  <CardTitle>Site Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <SitesTab 
                    sites={sortedSites} 
                    onStatusChange={handleSiteStatusChange}
                    onNoteChange={handleSiteNoteChange}
                    onAddSite={handleAddSite}
                    onEditSite={handleEditSite}
                    onRemoveSite={handleRemoveSite}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cleaners">
              <Card>
                <CardHeader>
                  <CardTitle>Cleaner Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <CleanersTab 
                    cleaners={sortedCleaners} 
                    onRatingChange={handleCleanerRatingChange}
                    onNoteChange={handleCleanerNoteChange}
                    onAddCleaner={handleAddCleaner}
                    onRemoveCleaner={handleRemoveCleaner}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company-schedule">
                <Card>
                    <CardHeader>
                        <CardTitle>Company Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CompanyScheduleTab 
                            schedule={sortedSchedule}
                            sites={sortedSites}
                            cleaners={sortedCleaners}
                            onAdd={handleAddScheduleEntry}
                            onUpdate={handleUpdateScheduleEntry}
                            onRemove={handleRemoveScheduleEntry}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="leave-calendar">
               <LeaveCalendarTab 
                  cleaners={sortedCleaners}
                  leave={leave || []}
                  schedule={sortedSchedule || []}
                  onAddLeave={handleAddLeave}
                  onDeleteLeave={handleDeleteLeave}
                  onUpdateLeave={handleUpdateLeave}
               />
            </TabsContent>

             <TabsContent value="risk">
                <RiskDashboardTab sites={sites || []} />
            </TabsContent>

            <TabsContent value="summary">
              <DailySummaryTab sites={sites || []} cleaners={sortedCleaners} actionPlans={actionPlans || []} schedule={schedule || []} leave={leave || []} />
            </TabsContent>

            <TabsContent value="action-plan">
              <ActionPlanTab
                sites={sites || []}
                cleaners={sortedCleaners}
                actionPlans={actionPlans || []}
                onUpdateActionPlan={handleUpdateActionPlan}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Toaster />
    </div>
  );
}
