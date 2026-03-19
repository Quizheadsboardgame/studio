'use client';

import { useEffect, useMemo, useState } from 'react';
import { type Site, type Cleaner, type SiteStatus, type CleanerPerformance, type ActionPlan, type Leave, type ScheduleEntry, type Consumable, type MonthlySupplyOrder, type MonthlyAudit, type Appointment, type Task, type ConversationRecord, type AvailabilityStatus, initialSites, initialCleaners, initialSchedule, initialLeave } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, ClipboardList, CalendarDays, FileCheck, FileClock, Package, BookOpenCheck, ListTodo, MessageSquare, Clock, Map } from 'lucide-react';
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
import AvailabilityTab from '@/components/availability-tab';
import SiteMapTab from '@/components/site-map-tab';
import { Toaster } from "@/components/ui/toaster";
import { useFirebase, useCollection, useMemoFirebase, initiateAnonymousSignIn, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, getDocs, query, limit, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';


export default function DashboardPage() {
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = useMemo(() => [
    { value: 'action-plan', label: 'Action Plans', icon: ClipboardList },
    { value: 'audit-history', label: 'Audit History', icon: FileClock },
    { value: 'audits', label: 'Audits', icon: FileCheck },
    { value: 'availability', label: 'Cleaner Availability', icon: Clock },
    { value: 'cleaners', label: 'Cleaner Performance', icon: Users },
    { value: 'company-schedule', label: 'Company Schedule', icon: Calendar },
    { value: 'conversation-log', label: 'Conversation Log', icon: MessageSquare },
    { value: 'summary', label: 'Daily Summary', icon: FileText },
    { value: 'diary', label: 'Diary', icon: BookOpenCheck },
    { value: 'leave-calendar', label: 'Leave Calendar', icon: CalendarDays },
    { value: 'risk', label: 'Site Risk Dashboard', icon: ShieldAlert },
    { value: 'sites', label: 'Site Performance', icon: LayoutDashboard },
    { value: 'site-map', label: 'Site Map', icon: Map },
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
      const SEED_VERSION = 'db_seeded_with_availability_v1';
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
        console.log('Database already exists. Checking for data updates...');
        
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

        // Check for cleaner data updates (add availability fields)
        const cleanersCollectionRef = collection(firestore, 'cleaners');
        const allCleanersSnapshot = await getDocs(cleanersCollectionRef);
        allCleanersSnapshot.forEach(docSnap => {
            const existingCleanerData = docSnap.data();
            if (existingCleanerData.availabilityStatus === undefined) {
                batch.update(docSnap.ref, {
                    availabilityStatus: 'Unavailable',
                    availableLots: [],
                    availabilityNotes: '',
                });
                updatesMade = true;
            }
        });

        if (updatesMade) {
            try {
                await batch.commit();
                toast({ title: "Data Update", description: "Your application data has been updated." });
                console.log('Data update complete.');
            } catch (error) {
                console.error('Error updating data:', error);
                toast({ variant: 'destructive', title: "Update Failed", description: "Could not update your application data." });
            }
        } else {
            console.log('Data is already up to date.');
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

  const calculatedSites = useMemo(() => {
    if (!sites || !actionPlans || !monthlyAudits) {
        return sites || [];
    }

    return sites.map(site => {
        let newStatus: SiteStatus;

        // 1. Check for action plans
        const siteActionPlan = actionPlans.find(p => p.targetType === 'site' && p.id === site.id);
        if (siteActionPlan) {
            newStatus = 'Site under action plan';
            return { ...site, status: newStatus };
        }

        // 2. Check latest audit score
        const siteAudits = monthlyAudits
            .filter(a => a.siteId === site.id && a.status === 'Completed' && a.score !== null && a.score !== undefined)
            .sort((a, b) => parseISO(b.bookedDate!).getTime() - parseISO(a.bookedDate!).getTime());

        if (siteAudits.length > 0) {
            const latestAudit = siteAudits[0];
            if (latestAudit.score === 100) {
                newStatus = 'Gold Star Site';
            } else if (latestAudit.score >= 99) {
                newStatus = 'Client happy';
            } else if (latestAudit.score >= 96) {
                newStatus = 'Client concerns';
            } else {
                newStatus = 'Site requires action plan';
            }
        } else {
            newStatus = 'No Concerns'; // Default if no audits
        }
        
        return { ...site, status: newStatus };
    });
  }, [sites, actionPlans, monthlyAudits]);


  const calculatedCleaners = useMemo(() => {
    if (!cleaners || !calculatedSites || !schedule || !conversationRecords || !actionPlans) {
        return cleaners || [];
    }

    return cleaners.map(cleaner => {
        let newRating: CleanerPerformance = 'No Concerns'; // Start with default

        // Highest priority: direct action plan on cleaner
        const cleanerActionPlan = actionPlans.find(p => p.targetType === 'cleaner' && p.id === cleaner.id);
        if (cleanerActionPlan) {
            return { ...cleaner, rating: 'Under action plan' };
        }

        // Second priority: conversation that requires follow up
        const records = conversationRecords.filter(r => r.cleanerId === cleaner.id);
        if (records.some(r => r.followUpRequired)) {
            return { ...cleaner, rating: 'Operational concerns' };
        }
        
        // Third priority: cleaner works at a "bad" site
        const cleanerSiteNames = [...new Set(schedule.filter(s => s.cleaner === cleaner.name).map(s => s.site))];
        const cleanerSites = cleanerSiteNames.map(name => calculatedSites.find(s => s.name === name)).filter((s): s is Site => !!s);
        
        if (cleanerSites.some(s => s.status === 'Site under action plan' || s.status === 'Client concerns' || s.status === 'Site requires action plan')) {
             return { ...cleaner, rating: 'Needs retraining' };
        }

        // Fourth priority: any conversation log
        if (records.length > 0) {
            return { ...cleaner, rating: 'Slight improvement needed' };
        }

        // Positive ratings if no negative indicators are found
        if (cleanerSites.length > 0) {
            if (cleanerSites.every(s => s.status === 'Client happy' || s.status === 'Gold Star Site')) {
                return { ...cleaner, rating: 'Gold Star Cleaner' };
            }
            // If they have sites, but no negative indicators and not all are "Excellent"
            return { ...cleaner, rating: 'Site satisfied' };
        }
        
        // Default to No Concerns if no data points are available for the cleaner
        return { ...cleaner, rating: newRating };
    });
  }, [cleaners, calculatedSites, schedule, conversationRecords, actionPlans]);

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
  };

  const handleAddSite = (siteName: string) => {
    if (siteName.trim() === '' || !sitesCollection) return;
    addDocumentNonBlocking(sitesCollection, { name: siteName, status: 'No Concerns', notes: '' });
  };

  const handleEditSite = (siteId: string, newName: string) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'sites', siteId), { name: newName });
  };

  const handleRemoveSite = (siteId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'sites', siteId));
  };
  
  const handleUpdateCleaner = (cleanerId: string, updatedData: Partial<Omit<Cleaner, 'id'>>) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'cleaners', cleanerId), updatedData);
  };

  const handleAddCleaner = (cleanerName: string) => {
    if (cleanerName.trim() === '' || !cleanersCollection) return;
    const newCleanerData = initialCleaners.find(c => c.name === cleanerName) || {
      name: cleanerName,
      rating: 'No Concerns',
      notes: '',
      holidayAllowance: 20,
      holidayTaken: 0,
      sickDaysTaken: 0,
      availabilityStatus: 'Unavailable',
      availableLots: [],
      availabilityNotes: '',
    };
    addDocumentNonBlocking(cleanersCollection, newCleanerData);
  };

  const handleRemoveCleaner = (cleanerId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'cleaners', cleanerId));
  };

  const handleUpdateActionPlan = (updatedPlan: ActionPlan) => {
    if (!firestore || !actionPlansCollection) return;
    setDocumentNonBlocking(doc(actionPlansCollection, updatedPlan.id), updatedPlan, { merge: true });
  };

  const handleRemoveActionPlan = (planId: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'actionPlans', planId));
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
  const sortedSites = useMemo(() => calculatedSites ? [...calculatedSites].sort((a, b) => a.name.localeCompare(b.name)) : [], [calculatedSites]);
  const sortedCleaners = useMemo(() => calculatedCleaners ? [...calculatedCleaners].sort((a, b) => a.name.localeCompare(b.name)) : [], [calculatedCleaners]);
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
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile navigation */}
            <div className="md:hidden mb-4">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full text-base font-medium h-12 bg-card border-border">
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

            {/* Desktop navigation */}
            <div className="hidden md:block mb-4">
                <ScrollArea className="w-full whitespace-nowrap">
                    <TabsList className="inline-flex h-auto p-1">
                        {tabs.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} className="text-xs lg:text-sm px-2 lg:px-3">
                                <tab.icon className="mr-2 h-4 w-4" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
            
            <TabsContent value="sites">
              <Card>
                <CardHeader>
                  <CardTitle>Site Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <SitesTab 
                    sites={sortedSites} 
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
                    onUpdateCleaner={handleUpdateCleaner}
                    onAddCleaner={handleAddCleaner}
                    onRemoveCleaner={handleRemoveCleaner}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="availability">
              <AvailabilityTab
                cleaners={sortedCleaners}
                onUpdateCleaner={handleUpdateCleaner}
              />
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
                <RiskDashboardTab sites={sortedSites} cleaners={sortedCleaners} />
            </TabsContent>

            <TabsContent value="summary">
              <DailySummaryTab sites={sortedSites} cleaners={sortedCleaners} actionPlans={actionPlans || []} schedule={schedule || []} leave={leave || []} />
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
                sites={sortedSites}
                cleaners={sortedCleaners}
                actionPlans={actionPlans || []}
                onUpdateActionPlan={handleUpdateActionPlan}
                onRemoveActionPlan={handleRemoveActionPlan}
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

            <TabsContent value="site-map">
              <SiteMapTab sites={sortedSites} />
            </TabsContent>

          </Tabs>
        )}
      </main>
      <Toaster />
    </div>
  );
}
