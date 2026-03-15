'use client';

import { useState, useEffect } from 'react';
import { initialSites, initialCleaners, initialHistory, initialActionPlans, type Site, type Cleaner, type SiteStatus, type CleanerPerformance, type SiteHistoryEntry, type ActionPlan } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, Bot, ClipboardList } from 'lucide-react';
import SitesTab from '@/components/sites-tab';
import CleanersTab from '@/components/cleaners-tab';
import ScheduleTab from '@/components/schedule-tab';
import RiskDashboardTab from '@/components/risk-dashboard-tab';
import DailySummaryTab from '@/components/daily-summary-tab';
import ActionPlanTab from '@/components/action-plan-tab';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [cleaners, setCleaners] = useState<Cleaner[]>(initialCleaners);
  const [history, setHistory] = useState<SiteHistoryEntry[]>(initialHistory);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>(initialActionPlans);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedSites = window.localStorage.getItem('sites');
      if (savedSites) {
        setSites(JSON.parse(savedSites));
      }
      const savedCleaners = window.localStorage.getItem('cleaners');
      if (savedCleaners) {
        setCleaners(JSON.parse(savedCleaners));
      }
      const savedHistory = window.localStorage.getItem('history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
      const savedActionPlans = window.localStorage.getItem('actionPlans');
      if (savedActionPlans) {
        setActionPlans(JSON.parse(savedActionPlans));
      }
    } catch (error) {
      console.error("Error loading data from localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem('sites', JSON.stringify(sites));
      } catch (error) {
        console.error("Error saving sites to localStorage", error);
      }
    }
  }, [sites, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem('cleaners', JSON.stringify(cleaners));
      } catch (error) {
        console.error("Error saving cleaners to localStorage", error);
      }
    }
  }, [cleaners, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem('history', JSON.stringify(history));
      } catch (error) {
        console.error("Error saving history to localStorage", error);
      }
    }
  }, [history, isLoaded]);
  
  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem('actionPlans', JSON.stringify(actionPlans));
      } catch (error) {
        console.error("Error saving action plans to localStorage", error);
      }
    }
  }, [actionPlans, isLoaded]);

  const { toast } = useToast();

  const handleSiteStatusChange = (siteId: string, newStatus: SiteStatus) => {
    setSites(sites.map(site => site.id === siteId ? { ...site, status: newStatus } : site));
  };

  const handleSiteNoteChange = (siteId: string, newNote: string) => {
    setSites(sites.map(site => site.id === siteId ? { ...site, notes: newNote } : site));
  };

  const handleAddSite = (siteName: string) => {
    if (siteName.trim() === '') return;
    const newSite: Site = {
      id: `site-${Date.now()}`,
      name: siteName,
      status: 'N/A',
      notes: ''
    };
    setSites(prevSites => [...prevSites, newSite]);
  };

  const handleCleanerRatingChange = (cleanerId: string, newRating: CleanerPerformance) => {
    setCleaners(cleaners.map(cleaner => cleaner.id === cleanerId ? { ...cleaner, rating: newRating } : cleaner));
  };
  
  const handleCleanerNoteChange = (cleanerId: string, newNote: string) => {
    setCleaners(cleaners.map(cleaner => cleaner.id === cleanerId ? { ...cleaner, notes: newNote } : cleaner));
  };

  const handleAddCleaner = (cleanerName: string) => {
    if (cleanerName.trim() === '') return;
    const newCleaner: Cleaner = {
      id: `cleaner-${Date.now()}`,
      name: cleanerName,
      rating: 'N/A',
      notes: ''
    };
    setCleaners(prevCleaners => [...prevCleaners, newCleaner]);
  };

  const handleRemoveCleaner = (cleanerId: string) => {
    setCleaners(cleaners.filter(cleaner => cleaner.id !== cleanerId));
  };

  const handleRecordDay = () => {
    const today = new Date().toISOString().split('T')[0];
    const existingEntryIndex = history.findIndex(entry => entry.date === today);
    const newEntry = { date: today, sites: sites.map(s => ({...s})) };

    if (existingEntryIndex > -1) {
      const updatedHistory = [...history];
      updatedHistory[existingEntryIndex] = newEntry;
      setHistory(updatedHistory);
       toast({ title: "Data Updated", description: "Today's site statuses have been updated." });
    } else {
      setHistory(prevHistory => [...prevHistory, newEntry]);
       toast({ title: "Data Recorded", description: "Today's site statuses have been recorded." });
    }
  };

  const handleUpdateActionPlan = (updatedPlan: ActionPlan) => {
    const existingPlanIndex = actionPlans.findIndex(p => p.id === updatedPlan.id);
    const newActionPlans = [...actionPlans];
    if (existingPlanIndex > -1) {
      newActionPlans[existingPlanIndex] = updatedPlan;
    } else {
      newActionPlans.push(updatedPlan);
    }
    setActionPlans(newActionPlans);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-primary px-4 text-primary-foreground sm:h-20 sm:px-6">
          <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/10 p-2 rounded-lg">
                  <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">
                  CleanOps Hub
              </h1>
          </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
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
                  sites={sites} 
                  onStatusChange={handleSiteStatusChange}
                  onNoteChange={handleSiteNoteChange}
                  onAddSite={handleAddSite}
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
                  cleaners={cleaners} 
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
             <RiskDashboardTab sites={sites} history={history} onRecordDay={handleRecordDay}/>
          </TabsContent>

          <TabsContent value="summary">
             <DailySummaryTab sites={sites} cleaners={cleaners} />
          </TabsContent>

          <TabsContent value="action-plan">
            <ActionPlanTab
              sites={sites}
              cleaners={cleaners}
              actionPlans={actionPlans}
              onUpdateActionPlan={handleUpdateActionPlan}
            />
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
