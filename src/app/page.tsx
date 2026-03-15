'use client';

import { useState, useEffect, useMemo } from 'react';
import { initialSites, initialCleaners, type Site, type Cleaner, type SiteStatus, type CleanerPerformance, type SiteHistoryEntry, type ActionPlan } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, Sparkles, ClipboardList } from 'lucide-react';
import SitesTab from '@/components/sites-tab';
import CleanersTab from '@/components/cleaners-tab';
import ScheduleTab from '@/components/schedule-tab';
import RiskDashboardTab from '@/components/risk-dashboard-tab';
import DailySummaryTab from '@/components/daily-summary-tab';
import ActionPlanTab from '@/components/action-plan-tab';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase, initiateAnonymousSignIn, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  const sitesCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'sites') : null, [firestore, user]);
  const { data: sites, isLoading: sitesLoading } = useCollection<Site>(sitesCollection);

  const cleanersCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'cleaners') : null, [firestore, user]);
  const { data: cleaners, isLoading: cleanersLoading } = useCollection<Cleaner>(cleanersCollection);

  const historyCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'history') : null, [firestore, user]);
  const { data: history, isLoading: historyLoading } = useCollection<SiteHistoryEntry>(historyCollection);

  const actionPlansCollection = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'actionPlans') : null, [firestore, user]);
  const { data: actionPlans, isLoading: actionPlansLoading } = useCollection<ActionPlan>(actionPlansCollection);

  const handleSeedDatabase = async () => {
    if (!firestore) return;
    try {
      const batch = writeBatch(firestore);
      
      if ((!sites || sites.length === 0)) {
        initialSites.forEach(site => {
            const docRef = doc(sitesCollection!);
            batch.set(docRef, { name: site.name, status: site.status, notes: site.notes });
        });
      }

      if ((!cleaners || cleaners.length === 0)) {
        initialCleaners.forEach(cleaner => {
            const docRef = doc(cleanersCollection!);
            batch.set(docRef, { name: cleaner.name, rating: cleaner.rating, notes: cleaner.notes });
        });
      }

      await batch.commit();
      toast({ title: "Database Seeded", description: "Initial data has been loaded." });
    } catch (error) {
      console.error("Error seeding database:", error);
      toast({ variant: "destructive", title: "Seeding Failed", description: "Could not load initial data." });
    }
  };


  const handleSiteStatusChange = (siteId: string, newStatus: SiteStatus) => {
    if (!firestore) return;
    const siteRef = doc(firestore, 'sites', siteId);
    updateDocumentNonBlocking(siteRef, { status: newStatus });
  };

  const handleSiteNoteChange = (siteId: string, newNote: string) => {
     if (!firestore) return;
    const siteRef = doc(firestore, 'sites', siteId);
    updateDocumentNonBlocking(siteRef, { notes: newNote });
  };

  const handleAddSite = (siteName: string) => {
    if (siteName.trim() === '' || !sitesCollection) return;
    const newSite: Omit<Site, 'id'> = {
      name: siteName,
      status: 'N/A',
      notes: ''
    };
    addDocumentNonBlocking(sitesCollection, newSite);
  };

  const handleEditSite = (siteId: string, newName: string) => {
    if (!firestore) return;
    const siteRef = doc(firestore, 'sites', siteId);
    updateDocumentNonBlocking(siteRef, { name: newName });
  };

  const handleRemoveSite = (siteId: string) => {
    if (!firestore) return;
    const siteRef = doc(firestore, 'sites', siteId);
    deleteDocumentNonBlocking(siteRef);
  };

  const handleCleanerRatingChange = (cleanerId: string, newRating: CleanerPerformance) => {
    if (!firestore) return;
    const cleanerRef = doc(firestore, 'cleaners', cleanerId);
    updateDocumentNonBlocking(cleanerRef, { rating: newRating });
  };
  
  const handleCleanerNoteChange = (cleanerId: string, newNote: string) => {
    if (!firestore) return;
    const cleanerRef = doc(firestore, 'cleaners', cleanerId);
    updateDocumentNonBlocking(cleanerRef, { notes: newNote });
  };

  const handleAddCleaner = (cleanerName: string) => {
    if (cleanerName.trim() === '' || !cleanersCollection) return;
    const newCleaner: Omit<Cleaner, 'id'> = {
      name: cleanerName,
      rating: 'N/A',
      notes: ''
    };
    addDocumentNonBlocking(cleanersCollection, newCleaner);
  };

  const handleRemoveCleaner = (cleanerId: string) => {
    if (!firestore) return;
    const cleanerRef = doc(firestore, 'cleaners', cleanerId);
    deleteDocumentNonBlocking(cleanerRef);
  };

  const handleRecordDay = () => {
    if (!historyCollection || !sites) return;
    const today = new Date().toISOString().split('T')[0];
    const existingEntry = history?.find(entry => entry.date === today);
    const newEntry = { date: today, sites: sites.map(s => ({...s})) };

    if (existingEntry) {
       const historyRef = doc(firestore, 'history', existingEntry.id);
       setDocumentNonBlocking(historyRef, newEntry, { merge: true });
       toast({ title: "Data Updated", description: "Today's site statuses have been updated." });
    } else {
       addDocumentNonBlocking(historyCollection, newEntry);
       toast({ title: "Data Recorded", description: "Today's site statuses have been recorded." });
    }
  };

  const handleUpdateActionPlan = (updatedPlan: ActionPlan) => {
    if (!firestore) return;
    const planRef = doc(firestore, 'actionPlans', updatedPlan.id);
    setDocumentNonBlocking(planRef, updatedPlan, { merge: true });
  };

  const isLoading = sitesLoading || cleanersLoading || historyLoading || actionPlansLoading;
  const sortedSites = useMemo(() => sites ? [...sites].sort((a, b) => a.name.localeCompare(b.name)) : [], [sites]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:h-20 sm:px-6">
          <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-headline">
                  Lot 4
              </h1>
          </div>
          <div className="ml-auto">
            <Button onClick={handleSeedDatabase} variant="outline" size="sm">Seed Database</Button>
          </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {isUserLoading || isLoading ? (
           <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
        ) : (
          <Tabs defaultValue="sites" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 h-auto flex-wrap">
              <TabsTrigger value="sites"><LayoutDashboard className="mr-2 h-4 w-4" />Sites</TabsTrigger>
              <TabsTrigger value="cleaners"><Users className="mr-2 h-4 w-4" />Cleaner Performance</TabsTrigger>
              <TabsTrigger value="schedule"><Calendar className="mr-2 h-4 w-4" />Cleaner Schedule</TabsTrigger>
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
                    cleaners={cleaners || []} 
                    onRatingChange={handleCleanerRatingChange}
                    onNoteChange={handleCleanerNoteChange}
                    onAddCleaner={handleAddCleaner}
                    onRemoveCleaner={handleRemoveCleaner}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card>
                <CardHeader>
                  <CardTitle>Cleaner Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScheduleTab />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk">
              <RiskDashboardTab sites={sites || []} history={history || []} onRecordDay={handleRecordDay}/>
            </TabsContent>

            <TabsContent value="summary">
              <DailySummaryTab sites={sites || []} cleaners={cleaners || []} actionPlans={actionPlans || []} />
            </TabsContent>

            <TabsContent value="action-plan">
              <ActionPlanTab
                sites={sites || []}
                cleaners={cleaners || []}
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
