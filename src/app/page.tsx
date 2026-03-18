'use client';

import { useEffect, useMemo, useState } from 'react';
import { type Site, type Cleaner, type SiteStatus, type CleanerPerformance, type ActionPlan, type Leave, type ScheduleEntry, type Consumable, type MonthlySupplyOrder, type MonthlyAudit, type Appointment } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, ClipboardList, CalendarDays, FileCheck, FileClock, Package, BookOpenCheck } from 'lucide-react';
import SitesTab from '@/components/sites-tab';
import CleanersTab from '@/components/cleaners-tab';
import CompanyScheduleTab from '@/components/schedule-tab';
import RiskDashboardTab from '@/components/risk-dashboard-tab';
import DailySummaryTab from '@/components/daily-summary-tab';
import ActionPlanTab from '@/components/action-plan-tab';
import LeaveCalendarTab from '@/components/leave-calendar-tab';
import AuditsTab from '@/components/audits-tab';
import AuditHistoryTab from '@/components/audit-history-tab';
import SuppliesTab from '@/components/supplies-tab';
import DiaryTab from '@/components/diary-tab';
import { Toaster } from "@/components/ui/toaster";
import { useFirebase, useCollection, useMemoFirebase, initiateAnonymousSignIn, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from 'react';


export default function DashboardPage() {
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('diary');

  const tabs = useMemo(() => [
    { value: 'action-plan', label: 'Action Plans', icon: ClipboardList },
    { value: 'audit-history', label: 'Audit History', icon: FileClock },
    { value: 'audits', label: 'Audits', icon: FileCheck },
    { value: 'cleaners', label: 'Cleaner Performance', icon: Users },
    { value: 'company-schedule', label: 'Company Schedule', icon: Calendar },
    { value: 'summary', label: 'Daily Summary', icon: FileText },
    { value: 'diary', label: 'Diary', icon: BookOpenCheck },
    { value: 'leave-calendar', label: 'Leave Calendar', icon: CalendarDays },
    { value: 'risk', label: 'Site Risk Dashboard', icon: ShieldAlert },
    { value: 'sites', label: 'Sites', icon: LayoutDashboard },
    { value: 'supplies', label: 'Supply Orders', icon: Package },
  ].sort((a, b) => a.label.localeCompare(b.label)), []);

  const ActiveIcon = useMemo(() => tabs.find(t => t.value === activeTab)?.icon, [activeTab, tabs]);

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
  
  const supplyOrdersCollection = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'supplyOrders') : null, [firestore, user]);
  const { data: supplyOrders, isLoading: supplyOrdersLoading } = useCollection<MonthlySupplyOrder>(supplyOrdersCollection);
  
  const monthlyAuditsCollection = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'monthlyAudits') : null, [firestore, user]);
  const { data: monthlyAudits, isLoading: monthlyAuditsLoading } = useCollection<MonthlyAudit>(monthlyAuditsCollection);
  
  const appointmentsCollection = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'appointments') : null, [firestore, user]);
  const { data: appointments, isLoading: appointmentsLoading } = useCollection<Appointment>(appointmentsCollection);

  const handleSiteStatusChange = (siteId: string, newStatus: SiteStatus) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'sites', siteId), { status: newStatus });
  };

  const handleSiteNoteChange = (siteId: string, newNote: string) => {
     if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'sites', siteId), { notes: newNote });
  };

  const handleSetMonthlyAudit = (siteId: string, date: Date, auditData: Partial<Omit<MonthlyAudit, 'id' | 'siteId' | 'month' | 'year'>>) => {
    if (!firestore) return;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const docId = `${siteId}-${format(date, 'yyyy-MM')}`;

    const fullAuditData = {
      siteId,
      year,
      month,
      auditor: 'Unassigned',
      ...auditData,
    };
    
    setDocumentNonBlocking(doc(firestore, 'monthlyAudits', docId), fullAuditData, { merge: true });

    // Update site status if score is provided and is a valid number
    if (auditData.score !== undefined && auditData.score !== null) {
      let newSiteStatus: SiteStatus = 'N/A'; // Default case
      if (auditData.score <= 95) {
        newSiteStatus = 'Site under action plan';
      } else if (auditData.score >= 96 && auditData.score <= 98) {
        newSiteStatus = 'Client concerns';
      } else if (auditData.score >= 99 && auditData.score <= 100) {
        newSiteStatus = 'Client happy';
      }
      
      const site = sites?.find(s => s.id === siteId);
      if (site && site.status !== newSiteStatus && newSiteStatus !== 'N/A') {
        updateDocumentNonBlocking(doc(firestore, 'sites', siteId), { status: newSiteStatus });
      }
    }
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
  
  const handleSetSupplyOrder = (siteId: string, consumableId: string, date: Date, quantity: number) => {
    if (!firestore) return;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const docId = `${siteId}-${consumableId}-${format(date, 'yyyy-MM')}`;
    
    const orderData: Omit<MonthlySupplyOrder, 'id'> = {
      siteId,
      consumableId,
      year,
      month,
      quantity,
    };
    
    if (quantity > 0) {
      setDocumentNonBlocking(doc(firestore, 'supplyOrders', docId), orderData, { merge: true });
    } else {
      // If quantity is 0 or less, we can remove the document.
      deleteDocumentNonBlocking(doc(firestore, 'supplyOrders', docId));
    }
  };

  const handleAddConsumable = (siteId: string, consumableData: Omit<Consumable, 'id'>) => {
    if (!firestore) return;
    const consumablesCollection = collection(firestore, 'sites', siteId, 'consumables');
    addDocumentNonBlocking(consumablesCollection, consumableData);
  };

  const handleEditConsumable = (siteId: string, consumableId: string, consumableData: Partial<Omit<Consumable, 'id'>>) => {
    if (!firestore) return;
    const consumableDocRef = doc(firestore, 'sites', siteId, 'consumables', consumableId);
    updateDocumentNonBlocking(consumableDocRef, consumableData);
  };

  const handleRemoveConsumable = (siteId: string, consumableId: string) => {
    if (!firestore) return;
    const consumableDocRef = doc(firestore, 'sites', siteId, 'consumables', consumableId);
    deleteDocumentNonBlocking(consumableDocRef);
  };
  
  const handleAddAppointment = (newAppointment: Omit<Appointment, 'id'>) => {
    if (!appointmentsCollection) return;
    addDocumentNonBlocking(appointmentsCollection, newAppointment);
  };

  const handleUpdateAppointment = (appointmentId: string, updatedData: Partial<Omit<Appointment, 'id'>>) => {
      if (!firestore) return;
      updateDocumentNonBlocking(doc(firestore, 'appointments', appointmentId), updatedData);
  };

  const handleRemoveAppointment = (appointmentId: string) => {
      if (!firestore) return;
      deleteDocumentNonBlocking(doc(firestore, 'appointments', appointmentId));
  };


  const isLoading = isUserLoading || sitesLoading || cleanersLoading || actionPlansLoading || leaveLoading || scheduleLoading || supplyOrdersLoading || monthlyAuditsLoading || appointmentsLoading;
  const sortedSites = useMemo(() => sites ? [...sites].sort((a, b) => a.name.localeCompare(b.name)) : [], [sites]);
  const sortedCleaners = useMemo(() => cleaners ? [...cleaners].sort((a, b) => a.name.localeCompare(b.name)) : [], [cleaners]);
  const sortedSchedule = useMemo(() => schedule ? [...schedule].sort((a, b) => a.site.localeCompare(b.site) || a.cleaner.localeCompare(b.cleaner)) : [], [schedule]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-black">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-black px-4 sm:h-20 sm:px-6">
          <div className="flex items-center gap-4">
              <div className="p-2">
                  <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                  >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </div>
              <div className='flex flex-col justify-center'>
                <h1 className="text-xl font-bold tracking-tight text-white font-headline">
                    Excellerate Services
                </h1>
                <p className="text-xs text-muted-foreground">Lot 4. Addenbrooke’s</p>
              </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-white">Manager: Owen Newton</p>
            <p className="text-sm text-muted-foreground">Assistant Manager: Nick Miller</p>
          </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {isLoading ? (
           <div className="space-y-4">
              <Skeleton className="h-12 w-full md:w-[320px]" />
              <Skeleton className="h-96 w-full" />
            </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-4">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full md:w-[320px] text-base font-medium h-12 bg-card border-border">
                  <div className="flex items-center gap-3">
                    {ActiveIcon && <ActiveIcon className="h-5 w-5" />}
                    <span>{tabs.find(t => t.value === activeTab)?.label}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {tabs.map((tab) => (
                    <SelectItem key={tab.value} value={tab.value}>
                      <div className="flex items-center gap-2">
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
            
             <TabsContent value="supplies">
                <SuppliesTab
                    sites={sortedSites}
                    firestore={firestore}
                    supplyOrders={supplyOrders || []}
                    onSetOrder={handleSetSupplyOrder}
                    onAddConsumable={handleAddConsumable}
                    onEditConsumable={handleEditConsumable}
                    onRemoveConsumable={handleRemoveConsumable}
                />
            </TabsContent>

            <TabsContent value="audits">
              <AuditsTab 
                sites={sortedSites} 
                monthlyAudits={monthlyAudits || []}
                onSetAudit={handleSetMonthlyAudit}
              />
            </TabsContent>
            
            <TabsContent value="audit-history">
              <AuditHistoryTab
                sites={sortedSites}
                monthlyAudits={monthlyAudits || []}
              />
            </TabsContent>

             <TabsContent value="risk">
                <RiskDashboardTab sites={sites || []} cleaners={sortedCleaners} />
            </TabsContent>

            <TabsContent value="summary">
              <DailySummaryTab sites={sites || []} cleaners={sortedCleaners} actionPlans={actionPlans || []} schedule={schedule || []} leave={leave || []} />
            </TabsContent>
            
            <TabsContent value="diary">
              <DiaryTab
                sites={sortedSites}
                appointments={appointments || []}
                monthlyAudits={monthlyAudits || []}
                leave={leave || []}
                schedule={sortedSchedule || []}
                onAddAppointment={handleAddAppointment}
                onUpdateAppointment={handleUpdateAppointment}
                onRemoveAppointment={handleRemoveAppointment}
              />
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
