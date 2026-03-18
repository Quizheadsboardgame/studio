'use client';

import { useEffect, useMemo, useState } from 'react';
import { type Site, type Cleaner, type SiteStatus, type CleanerPerformance, type ActionPlan, type Leave, type ScheduleEntry, type Consumable, type MonthlySupplyOrder, type MonthlyAudit, type Appointment, type Task, initialSites, initialCleaners, initialSchedule, initialLeave } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, ClipboardList, CalendarDays, FileCheck, FileClock, Package, BookOpenCheck, ListTodo } from 'lucide-react';
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
import TasksTab from '@/components/tasks-tab';
import { Toaster } from "@/components/ui/toaster";
import { useFirebase, useCollection, useMemoFirebase, initiateAnonymousSignIn, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, getDocs, query, limit, writeBatch } from 'firebase/firestore';
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
    { value: 'tasks', label: 'Tasks', icon: ListTodo },
  ].sort((a, b) => a.label.localeCompare(b.label)), []);

  const ActiveIcon = useMemo(() => tabs.find(t => t.value === activeTab)?.icon, [activeTab, tabs]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  // Seeding and Migration effect
  useEffect(() => {
    if (!firestore || !user) return;

    const seedDatabase = async () => {
      // This function now handles both initial seeding and data migration.
      const setupVersionKey = 'db_setup_version';
      const currentVersion = 'v1.2'; // Increment to re-run migration

      if (sessionStorage.getItem(setupVersionKey) === currentVersion) {
        return;
      }
      
      console.log('Running database setup/migration...');
      toast({ title: "Setting up your app", description: "Please wait while we check for data updates." });

      const sitesQuery = query(collection(firestore, 'sites'), limit(1));
      const sitesSnapshot = await getDocs(sitesQuery);
      let didAnything = false;

      const batch = writeBatch(firestore);

      if (sitesSnapshot.empty) {
        // --- INITIAL SEEDING for empty database ---
        console.log('Database appears empty. Seeding all initial data...');
        didAnything = true;
        
        const sitesCollectionRef = collection(firestore, 'sites');
        initialSites.forEach(siteData => {
          const siteRef = doc(sitesCollectionRef);
          batch.set(siteRef, siteData);
        });
        
        const cleanersCollectionRef = collection(firestore, 'cleaners');
        const cleanerNameToIdMap = new Map<string, string>();
        initialCleaners.forEach(cleanerData => {
          const cleanerRef = doc(cleanersCollectionRef);
          cleanerNameToIdMap.set(cleanerData.name, cleanerRef.id);
          batch.set(cleanerRef, cleanerData);
        });
        
        const scheduleCollectionRef = collection(firestore, 'schedule');
        initialSchedule.forEach(scheduleData => {
          const scheduleRef = doc(scheduleCollectionRef);
          batch.set(scheduleRef, scheduleData);
        });

        const leaveCollectionRef = collection(firestore, 'leave');
        const cleanerUpdates: { [key: string]: { holidayTaken: number; sickDaysTaken: number } } = {};
        initialLeave.forEach(leaveData => {
          const cleanerId = cleanerNameToIdMap.get(leaveData.cleanerName);
          if (cleanerId) {
            const leaveRef = doc(leaveCollectionRef);
            batch.set(leaveRef, { ...leaveData, cleanerId, coverAssignments: [] });

            if (!cleanerUpdates[cleanerId]) {
              cleanerUpdates[cleanerId] = { holidayTaken: 0, sickDaysTaken: 0 };
            }
            if (leaveData.type === 'holiday') cleanerUpdates[cleanerId].holidayTaken++;
            else if (leaveData.type === 'sick') cleanerUpdates[cleanerId].sickDaysTaken++;
          }
        });
        
        for (const cleanerId in cleanerUpdates) {
          const cleanerRef = doc(firestore, 'cleaners', cleanerId);
          const originalCleaner = initialCleaners.find(c => cleanerNameToIdMap.get(c.name) === cleanerId);
          if (originalCleaner) {
            batch.update(cleanerRef, {
              holidayTaken: (originalCleaner.holidayTaken || 0) + cleanerUpdates[cleanerId].holidayTaken,
              sickDaysTaken: (originalCleaner.sickDaysTaken || 0) + cleanerUpdates[cleanerId].sickDaysTaken,
            });
          }
        }
      } else {
        // --- MIGRATION for existing database ---
        console.log('Database already has data. Checking for migrations...');
        const allSitesSnapshot = await getDocs(collection(firestore, 'sites'));
        allSitesSnapshot.forEach(docSnap => {
          const existingSite = docSnap.data() as Site;
          // Check if the site is missing the new fields
          if (existingSite.contacts === undefined || existingSite.siteCode === undefined) {
            const initialData = initialSites.find(is => is.name === existingSite.name);
            if (initialData) {
              console.log(`Migrating site: ${existingSite.name}`);
              didAnything = true;
              batch.update(docSnap.ref, {
                siteCode: initialData.siteCode,
                contacts: initialData.contacts
              });
            }
          }
        });
      }

      if (!didAnything) {
        console.log('No data changes or migrations were needed.');
        sessionStorage.setItem(setupVersionKey, currentVersion);
        // No need to show a toast if nothing happened.
        const toasts = document.querySelectorAll('[data-radix-toast-announce-exclude]');
        toasts.forEach(t => t.remove());
        return;
      }

      try {
        await batch.commit();
        toast({ title: "Setup Complete", description: "Your application data is up to date." });
        console.log('Database setup/migration complete.');
        sessionStorage.setItem(setupVersionKey, currentVersion);
      } catch (error) {
        console.error('Error during database setup:', error);
        toast({ variant: 'destructive', title: "Setup Failed", description: "There was an error setting up your application." });
      }
    };


    seedDatabase();

  }, [firestore, user, toast]);

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

  const tasksCollection = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'tasks') : null, [firestore, user]);
  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksCollection);

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
    const initialSiteData = initialSites.find(s => s.name.toLowerCase() === siteName.toLowerCase().trim());
    const newSite = {
      name: siteName.trim(),
      status: 'N/A' as SiteStatus,
      notes: '',
      siteCode: initialSiteData?.siteCode || '',
      contacts: initialSiteData?.contacts || [],
    };
    addDocumentNonBlocking(sitesCollection, newSite);
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
    // Ensure the ID is correctly passed for setDocumentNonBlocking
    const planId = updatedPlan.id || updatedPlan.targetName;
    const planToSave = { ...updatedPlan, id: planId };
    setDocumentNonBlocking(doc(actionPlansCollection, planId), planToSave, { merge: true });
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
  
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    if (!tasksCollection) return;
    addDocumentNonBlocking(tasksCollection, { ...newTaskData, completed: false });
  };

  const handleUpdateTask = (taskId: string, updatedData: Partial<Omit<Task, 'id'>>) => {
      if (!firestore) return;
      updateDocumentNonBlocking(doc(firestore, 'tasks', taskId), updatedData);
  };

  const handleRemoveTask = (taskId: string) => {
      if (!firestore) return;
      deleteDocumentNonBlocking(doc(firestore, 'tasks', taskId));
  };


  const isLoading = isUserLoading || sitesLoading || cleanersLoading || actionPlansLoading || leaveLoading || scheduleLoading || supplyOrdersLoading || monthlyAuditsLoading || appointmentsLoading || tasksLoading;
  const sortedSites = useMemo(() => sites ? [...sites].sort((a, b) => a.name.localeCompare(b.name)) : [], [sites]);
  const sortedCleaners = useMemo(() => cleaners ? [...cleaners].sort((a, b) => a.name.localeCompare(b.name)) : [], [cleaners]);
  const sortedSchedule = useMemo(() => schedule ? [...schedule].sort((a, b) => a.site.localeCompare(b.site) || a.cleaner.localeCompare(b.cleaner)) : [], [schedule]);
  const outstandingTasksCount = useMemo(() => tasks ? tasks.filter(t => !t.completed).length : 0, [tasks]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-black">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-black px-4 sm:h-20 sm:px-6">
          <div className="flex items-center gap-4">
              <div className="p-2 relative">
                  <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                  >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                   {outstandingTasksCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                        {outstandingTasksCount}
                    </div>
                  )}
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

            <TabsContent value="tasks">
              <TasksTab
                tasks={tasks || []}
                sites={sortedSites}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onRemoveTask={handleRemoveTask}
              />
            </TabsContent>

          </Tabs>
        )}
      </main>
      <Toaster />
    </div>
  );
}
