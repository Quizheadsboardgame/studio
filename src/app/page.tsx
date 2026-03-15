'use client';

import { useState } from 'react';
import { initialSites, initialCleaners, type Site, type Cleaner, type SiteStatus, type CleanerPerformance } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, Bot } from 'lucide-react';
import SitesTab from '@/components/sites-tab';
import CleanersTab from '@/components/cleaners-tab';
import ScheduleTab from '@/components/schedule-tab';
import RiskDashboardTab from '@/components/risk-dashboard-tab';
import DailySummaryTab from '@/components/daily-summary-tab';
import { Toaster } from "@/components/ui/toaster";

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [cleaners, setCleaners] = useState<Cleaner[]>(initialCleaners);

  const handleSiteStatusChange = (siteId: string, newStatus: SiteStatus) => {
    setSites(sites.map(site => site.id === siteId ? { ...site, status: newStatus } : site));
  };

  const handleCleanerRatingChange = (cleanerId: string, newRating: CleanerPerformance) => {
    setCleaners(cleaners.map(cleaner => cleaner.id === cleanerId ? { ...cleaner, rating: newRating } : cleaner));
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto flex-wrap">
            <TabsTrigger value="sites"><LayoutDashboard className="mr-2 h-4 w-4" />Sites</TabsTrigger>
            <TabsTrigger value="cleaners"><Users className="mr-2 h-4 w-4" />Cleaner Performance</TabsTrigger>
            <TabsTrigger value="schedule"><Calendar className="mr-2 h-4 w-4" />Cleaner Schedule</TabsTrigger>
            <TabsTrigger value="risk"><ShieldAlert className="mr-2 h-4 w-4" />Site Risk Dashboard</TabsTrigger>
            <TabsTrigger value="summary"><FileText className="mr-2 h-4 w-4" />Daily Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sites">
            <Card>
              <CardHeader>
                <CardTitle>Site Status</CardTitle>
              </CardHeader>
              <CardContent>
                <SitesTab sites={sites} onStatusChange={handleSiteStatusChange} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cleaners">
            <Card>
              <CardHeader>
                <CardTitle>Cleaner Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <CleanersTab cleaners={cleaners} onRatingChange={handleCleanerRatingChange} />
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
             <RiskDashboardTab sites={sites} />
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Daily Operations Report</CardTitle>
              </CardHeader>
              <CardContent>
                <DailySummaryTab sites={sites} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
