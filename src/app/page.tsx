'use client';

import { useEffect, useMemo, useState } from 'react';
import { type Site, type Cleaner, type SiteStatus, type CleanerPerformance, type ActionPlan, type Leave, type ScheduleEntry, type Consumable, type MonthlySupplyOrder, type MonthlyAudit, type Appointment, type Task, type ConversationRecord, initialSites, initialCleaners, initialSchedule, initialLeave } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, ClipboardList, CalendarDays, FileCheck, FileClock, Package, BookOpenCheck, ListTodo, MessageSquare } from 'lucide-react';
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
import ConversationLogTab from '@/components/conversation-log-tab';
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
    { value: 'conversation-log', label: 'Conversation Log', icon: MessageSquare },
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

  // Seeding effect
  useEffect(() => {
    if (!firestore || !user) return;

    const seedDatabase = async () => {
      // Using a new key to force re-evaluation for users with old data.
      const SEED_VERSION = 'db_seeded_with_contacts_v1';
      if (sessionStorage.getItem(SEED_VERSION)) {
        return;
      }

      // Check if the sites collection is empty.
      const sitesCollectionRef = collection(firestore, 'sites');
      const sitesQuery = query(sitesCollectionRef, limit(1));
      const sitesSnapshot = await getDocs(sitesQuery);

      const batch = writeBatch(firestore);

      if (sitesSnapshot.empty) {
        // FULL SEED for a new database
        console.log('Database appears empty. Seeding data...');
        toast({ title: "Setting up your app", description: "Please wait while we populate some initial data." });

        // Sites
        initialSites.forEach(siteData => {
          const siteRef = doc(sitesCollectionRef);
          batch.set(siteRef, siteData);
        });
        
        // Cleaners
        const cleanersCollectionRef = collection(firestore, 'cleaners');
        const cleanerNameToIdMap = new Map<string, string>();
        initialCleaners.forEach(cleanerData => {
          const cleanerRef = doc(cleanersCollectionRef);
          cleanerNameToIdMap.set(cleanerData.name, cleanerRef.id);
          batch.set(cleanerRef, cleanerData);
        });
        
        // Schedule
        const scheduleCollectionRef = collection(firestore, 'schedule');
        initialSchedule.forEach(scheduleData => {
          const scheduleRef = doc(scheduleCollectionRef);
          batch.set(scheduleRef, scheduleData);
        });

        // Leave
        const leaveCollectionRef = collection(firestore, 'leave');
        const cleanerUpdates: { [key: string]: { holidayTaken: number; sickDaysTaken: number } } = {};
        initialLeave.forEach(leaveData => {
          const cleanerId = cleanerNameToIdMap.get(leaveData.cleanerName);
          if (cleanerId) {
            const leaveRef = doc(leaveCollectionRef);
            batch.set(leaveRef, {
              ...leaveData,
              cleanerId,
              coverAssignments: []
            });

            if (!cleanerUpdates[cleanerId]) {
              cleanerUpdates[cleanerId] = { holidayTaken: 0, sickDaysTaken: 0 };
            }
            if (leaveData.type === 'holiday') {
              cleanerUpdates[cleanerId].holidayTaken++;
            } else if (leaveData.type === 'sick') {
              cleanerUpdates[cleanerId].sickDaysTaken++;
            }
          }
        });
        
        // Update cleaner leave counts
        for (const cleanerId in cleanerUpdates) {
          const cleanerRef = doc(firestore, 'cleaners', cleanerId);
          const originalCleanerData = initialCleaners.find(c => cleanerNameToIdMap.get(c.name) === cleanerId);
          if (originalCleanerData) {
            batch.update(cleanerRef, {
              holidayTaken: (originalCleanerData.holidayTaken || 0) + cleanerUpdates[cleanerId].holidayTaken,
              sickDaysTaken: (originalCleanerData.sickDaysTaken || 0) + cleanerUpdates[cleanerId].sickDaysTaken,
            });
          }
        }
        
        try {
          await batch.commit();
          toast({ title: "Setup Complete", description: "Your application data has been loaded." });
          console.log('Database seeding complete.');
          sessionStorage.setItem(SEED_VERSION, 'true');
        } catch (error) {
          console.error('Error seeding database:', error);
          toast({ variant: 'destructive', title: "Seeding Failed", description: "There was an error setting up your application." });
        }
      } else {
        // UPDATE existing sites with siteCode and contacts
        console.log('Database already exists. Checking for site data updates...');
        
        const allSitesSnapshot = await getDocs(sitesCollectionRef);
        let updatesMade = false;
        allSitesSnapshot.forEach(docSnap => {
            const existingSiteData = docSnap.data();
            // Check if data is old (lacks siteCode)
            if (existingSiteData.siteCode === undefined) {
                const initialSiteData = initialSites.find(s => s.name === existingSiteData.name);
                if (initialSiteData) {
                    batch.update(docSnap.ref, {
                        siteCode: initialSiteData.siteCode,
                        contacts: initialSiteData.contacts,
                    });
                    updatesMade = true;
                }
            }
        });

        if (updatesMade) {
            try {
                await batch.commit();
                toast({ title: "Data Update", description: "Site contact information has been updated." });
                console.log('Site data update complete.');
            } catch (error) {
                console.error('Error updating site data:', error);
                toast({ variant: 'destructive', title: "Update Failed", description: "Could not update site contact information." });
            }
        } else {
            console.log('Site data is already up to date.');
        }
        
        // Mark as seeded regardless of whether an update was needed, to prevent re-running this logic.
        sessionStorage.setItem(SEED_VERSION, 'true');
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
  
  const conversationRecordsCollection = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'conversationRecords') : null, [firestore, user]);
  const { data: conversationRecords, isLoading: conversationRecordsLoading } = useCollection<ConversationRecord>(conversationRecordsCollection);

  // Annual holiday reset effect
  useEffect(() => {
    if (!firestore || !user || !cleaners || cleaners.length === 0) return;

    const performAnnualHolidayReset = async () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const resetMonth = 3; // April is month 3 (0-indexed)

      const resetKey = `holiday_reset_year_${currentYear}`;

      if (localStorage.getItem(resetKey)) {
        return;
      }

      // Check if it's April 1st or later
      if (today.getMonth() >= resetMonth) {
        console.log(`Performing annual holiday reset for ${currentYear}...`);
        
        const batch = writeBatch(firestore);
        
        cleaners.forEach(cleaner => {
          const cleanerRef = doc(firestore, 'cleaners', cleaner.id);
          // Only reset holidayTaken, preserve custom holidayAllowance
          batch.update(cleanerRef, {
            holidayTaken: 0
          });
        });

        try {
          await batch.commit();
          toast({ title: "Holiday Balances Reset", description: `Cleaners' holiday days taken have been reset for ${currentYear}.` });
          localStorage.setItem(resetKey, 'true');
          console.log("Annual holiday reset complete.");
        } catch (error) {
          console.error("Error performing annual holiday reset:", error);
          toast({ variant: 'destructive', title: "Reset Failed", description: "Could not reset holiday balances." });
        }
      }
    };
    
    performAnnualHolidayReset();
  }, [firestore, user, cleaners, toast]);


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
  
  const handleHolidayAllowanceChange = (cleanerId: string, newAllowance: number) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'cleaners', cleanerId), { holidayAllowance: newAllowance });
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
    if (!firestore || !leave || !cleaners) return;

    const originalLeave = leave.find(l => l.id === leaveId);
    if (!originalLeave) return;

    // If type is changing, we need to adjust cleaner stats
    if (updatedData.type && updatedData.type !== originalLeave.type) {
        const cleaner = cleaners.find(c => c.id === originalLeave.cleanerId);
        if (cleaner) {
            const cleanerRef = doc(firestore, 'cleaners', originalLeave.cleanerId);
            let holidayUpdate = 0;
            let sickUpdate = 0;
            
            if (originalLeave.type === 'holiday' && updatedData.type === 'sick') {
                holidayUpdate = -1;
                sickUpdate = 1;
            } else if (originalLeave.type === 'sick' && updatedData.type === 'holiday') {
                holidayUpdate = 1;
                sickUpdate = -1;
            }
            
            if(holidayUpdate !== 0 || sickUpdate !== 0) {
                const newHolidayTaken = Math.max(0, (cleaner.holidayTaken || 0) + holidayUpdate);
                const newSickDaysTaken = Math.max(0, (cleaner.sickDaysTaken || 0) + sickUpdate);
                updateDocumentNonBlocking(cleanerRef, {
                    holidayTaken: newHolidayTaken,
                    sickDaysTaken: newSickDaysTaken,
                });
            }
        }
    }

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

  const handleAddConversationRecord = (newRecordData: Omit<ConversationRecord, 'id'>) => {
    if (!conversationRecordsCollection) return;
    addDocumentNonBlocking(conversationRecordsCollection, newRecordData);
  };

  const handleUpdateConversationRecord = (recordId: string, updatedData: Partial<Omit<ConversationRecord, 'id'>>) => {
      if (!firestore) return;
      updateDocumentNonBlocking(doc(firestore, 'conversationRecords', recordId), updatedData);
  };

  const handleRemoveConversationRecord = (recordId: string) => {
      if (!firestore) return;
      deleteDocumentNonBlocking(doc(firestore, 'conversationRecords', recordId));
  };


  const isLoading = isUserLoading || sitesLoading || cleanersLoading || actionPlansLoading || leaveLoading || scheduleLoading || supplyOrdersLoading || monthlyAuditsLoading || appointmentsLoading || tasksLoading || conversationRecordsLoading;
  const sortedSites = useMemo(() => sites ? [...sites].sort((a, b) => a.name.localeCompare(b.name)) : [], [sites]);
  const sortedCleaners = useMemo(() => cleaners ? [...cleaners].sort((a, b) => a.name.localeCompare(b.name)) : [], [cleaners]);
  const sortedSchedule = useMemo(() => schedule ? [...schedule].sort((a, b) => a.site.localeCompare(b.site) || a.cleaner.localeCompare(b.cleaner)) : [], [schedule]);
  const outstandingTasksCount = useMemo(() => tasks ? tasks.filter(t => !t.completed).length : 0, [tasks]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-black">
      <header className="sticky top-0 z-30 flex h-auto items-center justify-between gap-4 border-b border-border bg-black px-4 py-3 sm:h-20 sm:px-6 sm:py-0">
          <div className="flex items-center gap-4">
              <div className="p-2 relative">
                  <svg
                      className="h-8 w-8 text-excellerate-orange"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                  >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                   {outstandingTasksCount > 0 && (
                    <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                        {outstandingTasksCount}
                    </div>
                  )}
              </div>
              <div className='flex flex-col justify-center'>
                <h1 className="text-xl font-bold tracking-tight text-excellerate-orange font-headline">
                    Excellerate Services
                </h1>
                <p className="text-xs text-muted-foreground">Lot 4. Addenbrooke’s</p>
              </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-excellerate-orange text-sm sm:text-base">Manager: Owen Newton</p>
            <p className="text-xs text-muted-foreground sm:text-sm">Assistant Manager: Nick Miller</p>
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
                    onHolidayAllowanceChange={handleHolidayAllowanceChange}
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

            <TabsContent value="conversation-log">
              <ConversationLogTab
                cleaners={sortedCleaners}
                sites={sortedSites}
                conversationRecords={conversationRecords || []}
                onAddRecord={handleAddConversationRecord}
                onUpdateRecord={handleUpdateConversationRecord}
                onRemoveRecord={handleRemoveConversationRecord}
              />
            </TabsContent>

          </Tabs>
        )}
      </main>
      <Toaster />
    </div>
  );
}
