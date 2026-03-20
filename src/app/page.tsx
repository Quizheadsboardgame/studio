
'use client';

import { useEffect, useMemo, useState } from 'react';
import { type Site, type Cleaner, type SiteStatus, type CleanerPerformance, type ActionPlan, type Leave, type ScheduleEntry, type Consumable, type MonthlySupplyOrder, type MonthlyAudit, type Appointment, type Task, type ConversationRecord, type AvailabilityStatus, initialSites, initialCleaners, initialSchedule, initialLeave } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, ClipboardList, CalendarDays, FileCheck, FileClock, Package, BookOpenCheck, ListTodo, MessageSquare, Clock, Map, Award, Briefcase, CalendarRange, ChevronRight } from 'lucide-react';
import SitesTab from '@/components/sites-tab';
import CleanersTab from '@/components/cleaners-tab';
import CompanyScheduleTab from '@/components/schedule-tab';
import RiskDashboardTab from '@/components/risk-dashboard-tab';
import DailySummaryTab from '@/components/daily-summary-tab';
import ActionPlanTab from '@/components/action-plan-tab';
import LeaveCalendarTab from '@/components/leave-calendar-tab';
import MonthlyLeaveCalendar from '@/components/monthly-leave-calendar';
import AuditsTab from '@/components/audits-tab';
import AuditHistoryTab from '@/components/audit-history-tab';
import SuppliesTab from '@/components/supplies-tab';
import DiaryTab from '@/components/diary-tab';
import TasksTab from '@/components/tasks-tab';
import ConversationLogTab from '@/components/conversation-log-tab';
import AvailabilityTab from '@/components/availability-tab';
import SiteMapTab from '@/components/site-map-tab';
import GoldStandardTab from '@/components/gold-standard-tab';
import SitePortfolioTab from '@/components/site-portfolio-tab';
import { Toaster } from "@/components/ui/toaster";
import { useFirebase, useCollection, useMemoFirebase, initiateAnonymousSignIn, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, getDocs, query, limit, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import React from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarFooter, SidebarMenuSub } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


export default function DashboardPage() {
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('summary');

  const menuGroups = useMemo(() => [
    {
      group: 'Overview',
      icon: LayoutDashboard,
      items: [
        { value: 'summary', label: 'Daily Summary', icon: FileText },
        { value: 'risk', label: 'Site Risk Dashboard', icon: ShieldAlert },
        { value: 'gold-standard', label: 'Gold Standard', icon: Award },
      ],
    },
    {
      group: 'Management',
      icon: Users,
      items: [
        { value: 'sites', label: 'Site Performance', icon: Briefcase },
        { value: 'cleaners', label: 'Cleaner Performance', icon: Users },
        { value: 'action-plan', label: 'Action Plans', icon: ClipboardList },
        { value: 'conversation-log', label: 'Conversation Log', icon: MessageSquare },
      ],
    },
    {
      group: 'Scheduling',
      icon: Calendar,
      items: [
        { value: 'company-schedule', label: 'Company Schedule', icon: Calendar },
        { value: 'leave-calendar', label: 'Leave Calendar', icon: CalendarDays },
        { value: 'monthly-leave', label: 'Monthly Leave View', icon: CalendarRange },
        { value: 'availability', label: 'Cleaner Availability', icon: Clock },
        { value: 'diary', label: 'Diary', icon: BookOpenCheck },
        { value: 'tasks', label: 'Tasks', icon: ListTodo },
      ],
    },
    {
      group: 'Logistics',
      icon: Package,
      items: [
        { value: 'audits', label: 'Audits', icon: FileCheck },
        { value: 'audit-history', label: 'Audit History', icon: FileClock },
        { value: 'supplies', label: 'Supply Orders', icon: Package },
      ],
    },
    {
      group: 'Site Hub',
      icon: Briefcase,
      items: [
        { value: 'site-portfolio', label: 'Site Portfolio', icon: Briefcase },
        { value: 'site-map', label: 'Site Map', icon: Map },
      ],
    },
  ], []);

  const allTabs = useMemo(() => menuGroups.flatMap(g => g.items), [menuGroups]);
  const activeTabDetails = useMemo(() => allTabs.find(t => t.value === activeTab), [activeTab, allTabs]);

  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>(() => {
    const activeGroup = menuGroups.find(g => g.items.some(i => i.value === activeTab));
    return activeGroup ? [activeGroup.group] : [];
  });
  
  useEffect(() => {
    const activeGroup = menuGroups.find(g => g.items.some(i => i.value === activeTab));
    if (activeGroup && !openCollapsibles.includes(activeGroup.group)) {
      setOpenCollapsibles(prev => [...prev, activeGroup.group]);
    }
  }, [activeTab, menuGroups, openCollapsibles]);


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
            .filter(a => a.siteId === site.id && a.status === 'Completed' && a.score !== null && a.score !== undefined && a.bookedDate)
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
        let newRating: CleanerPerformance;

        // Get data specific to the cleaner
        const cleanerActionPlan = actionPlans.find(p => p.targetType === 'cleaner' && p.id === cleaner.id);
        const records = conversationRecords.filter(r => r.cleanerId === cleaner.id);
        const cleanerSiteNames = [...new Set(schedule.filter(s => s.cleaner === cleaner.name).map(s => s.site))];
        
        const cleanerSites = cleanerSiteNames.flatMap(name =>
            calculatedSites.filter(s => name.toLowerCase().includes(s.name.toLowerCase()))
        ).filter((value, index, self) => self.findIndex(s => s.id === value.id) === index);
        
        // --- Determine Rating based on hierarchy ---

        // 1. Highest priority: direct action plan on cleaner
        if (cleanerActionPlan) {
            newRating = 'Under action plan';
        }
        // 2. Conversation that requires follow up
        else if (records.some(r => r.followUpRequired)) {
            newRating = 'Operational concerns';
        }
        // 3. Cleaner works at a "bad" site
        else if (cleanerSites.some(s => s.status === 'Site under action plan' || s.status === 'Client concerns' || s.status === 'Site requires action plan')) {
             newRating = 'Needs retraining';
        }
        // 4. Any conversation log (but no follow-up required)
        else if (records.length > 0) {
            newRating = 'Slight improvement needed';
        }
        // 5. GOLD STAR: No negative indicators AND all sites are Gold Star or Client Happy
        else if (cleanerSites.length > 0 && cleanerSites.every(s => s.status === 'Gold Star Site' || s.status === 'Client happy')) {
            newRating = 'Gold Star Cleaner';
        }
        // 6. Site satisfied: Works at sites, but not all are Gold Star, and no negative indicators
        else if (cleanerSites.length > 0) {
            newRating = 'Site satisfied';
        }
        // 7. Default if no other conditions met
        else {
            newRating = 'No Concerns';
        }

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

  const handleUpdateSite = (siteId: string, updatedData: Partial<Omit<Site, 'id'>>) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'sites', siteId), updatedData);
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

  const renderActiveTab = () => {
    switch (activeTab) {
        case 'sites':
            return (
                <Card>
                    <CardHeader><CardTitle>Site Performance</CardTitle></CardHeader>
                    <CardContent>
                        <SitesTab sites={sortedSites} onNoteChange={(siteId, notes) => handleUpdateSite(siteId, { notes })} onAddSite={handleAddSite} onEditSite={(siteId, name) => handleUpdateSite(siteId, { name })} onRemoveSite={handleRemoveSite} />
                    </CardContent>
                </Card>
            );
        case 'cleaners':
            return (
                <Card>
                    <CardHeader><CardTitle>Cleaner Performance</CardTitle></CardHeader>
                    <CardContent>
                        <CleanersTab cleaners={sortedCleaners} onUpdateCleaner={handleUpdateCleaner} onAddCleaner={handleAddCleaner} onRemoveCleaner={handleRemoveCleaner} />
                    </CardContent>
                </Card>
            );
        case 'availability':
            return <AvailabilityTab cleaners={sortedCleaners} onUpdateCleaner={handleUpdateCleaner} />;
        case 'company-schedule':
            return (
                <Card>
                    <CardHeader><CardTitle>Company Schedule</CardTitle></CardHeader>
                    <CardContent>
                        <CompanyScheduleTab schedule={sortedSchedule} sites={sortedSites} cleaners={sortedCleaners} onAdd={handleAddScheduleEntry} onUpdate={handleUpdateScheduleEntry} onRemove={handleRemoveScheduleEntry} />
                    </CardContent>
                </Card>
            );
        case 'leave-calendar':
            return <LeaveCalendarTab cleaners={sortedCleaners} leave={leave || []} schedule={sortedSchedule || []} onAddLeave={handleAddLeave} onDeleteLeave={handleDeleteLeave} onUpdateLeave={handleUpdateLeave} />;
        case 'monthly-leave':
            return <MonthlyLeaveCalendar leave={leave || []} />;
        case 'supplies':
            return <SuppliesTab sites={sortedSites} firestore={firestore} supplyOrders={supplyOrders || []} onSetOrder={handleSetSupplyOrder} onAddConsumable={handleAddConsumable} onEditConsumable={handleEditConsumable} onRemoveConsumable={handleRemoveConsumable} />;
        case 'audits':
            return <AuditsTab sites={sortedSites} monthlyAudits={monthlyAudits || []} onSetAudit={handleSetMonthlyAudit} />;
        case 'audit-history':
            return <AuditHistoryTab sites={sortedSites} monthlyAudits={monthlyAudits || []} />;
        case 'risk':
            return <RiskDashboardTab sites={sortedSites} cleaners={sortedCleaners} />;
        case 'diary':
            return <DiaryTab sites={sortedSites} appointments={appointments || []} monthlyAudits={monthlyAudits || []} leave={leave || []} schedule={sortedSchedule || []} onAddAppointment={handleAddAppointment} onUpdateAppointment={handleUpdateAppointment} onRemoveAppointment={handleRemoveAppointment} />;
        case 'action-plan':
            return <ActionPlanTab sites={sortedSites} cleaners={sortedCleaners} actionPlans={actionPlans || []} onUpdateActionPlan={handleUpdateActionPlan} onRemoveActionPlan={handleRemoveActionPlan} />;
        case 'tasks':
            return <TasksTab tasks={tasks || []} sites={sortedSites} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onRemoveTask={handleRemoveTask} />;
        case 'conversation-log':
            return <ConversationLogTab cleaners={sortedCleaners} sites={sortedSites} conversationRecords={conversationRecords || []} onAddRecord={handleAddConversationRecord} onUpdateRecord={handleUpdateConversationRecord} onRemoveRecord={handleRemoveConversationRecord} />;
        case 'site-portfolio':
            return <SitePortfolioTab sites={sortedSites} cleaners={sortedCleaners} schedule={sortedSchedule} actionPlans={actionPlans || []} monthlyAudits={monthlyAudits || []} tasks={tasks || []} appointments={appointments || []} onUpdateSite={handleUpdateSite} onUpdateTask={handleUpdateTask} onRemoveTask={handleRemoveTask} onAddAppointment={handleAddAppointment} onUpdateAppointment={handleUpdateAppointment} onRemoveAppointment={handleRemoveAppointment} onAddScheduleEntry={handleAddScheduleEntry} onUpdateScheduleEntry={handleUpdateScheduleEntry} onRemoveScheduleEntry={handleRemoveScheduleEntry} />;
        case 'site-map':
            return <SiteMapTab sites={sortedSites} />;
        case 'gold-standard':
            return <GoldStandardTab sites={sortedSites} cleaners={sortedCleaners} />;
        default:
            return <DailySummaryTab sites={sortedSites} cleaners={sortedCleaners} actionPlans={actionPlans || []} schedule={schedule || []} leave={leave || []} />;
    }
  };

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 relative bg-primary rounded-lg">
                        <svg
                            className="h-6 w-6 text-primary-foreground"
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
                    <div className='flex flex-col'>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Excellerate
                        </h1>
                        <p className="text-xs text-muted-foreground">Lot 4. Addenbrooke’s</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                  {menuGroups.map((group) => (
                      <Collapsible
                          key={group.group}
                          open={openCollapsibles.includes(group.group)}
                          onOpenChange={(isOpen) =>
                              setOpenCollapsibles((prev) =>
                                  isOpen
                                      ? [...prev, group.group]
                                      : prev.filter((g) => g !== group.group)
                              )
                          }
                          className="w-full"
                      >
                          <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                  <SidebarMenuButton className="justify-between w-full">
                                      <div className="flex items-center gap-2">
                                          <group.icon />
                                          <span>{group.group}</span>
                                      </div>
                                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" style={{ transform: openCollapsibles.includes(group.group) ? 'rotate(90deg)' : 'none' }}/>
                                  </SidebarMenuButton>
                              </CollapsibleTrigger>
                          </SidebarMenuItem>
                          <CollapsibleContent>
                              <SidebarMenuSub>
                                  {group.items.map((item) => (
                                      <SidebarMenuItem key={item.value}>
                                          <SidebarMenuButton
                                              onClick={() => setActiveTab(item.value)}
                                              isActive={activeTab === item.value}
                                              className="justify-start w-full"
                                              tooltip={item.label}
                                          >
                                              <item.icon />
                                              <span>{item.label}</span>
                                          </SidebarMenuButton>
                                      </SidebarMenuItem>
                                  ))}
                              </SidebarMenuSub>
                          </CollapsibleContent>
                      </Collapsible>
                  ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>ON</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm">Owen Newton</p>
                        <p className="text-xs text-muted-foreground">Manager</p>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger />
                    {activeTabDetails?.icon && <activeTabDetails.icon className="h-5 w-5 text-muted-foreground" />}
                    <h2 className="font-semibold text-lg">{activeTabDetails?.label}</h2>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="font-semibold text-sm">Assistant Manager: Nick Miller</p>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                ) : (
                    <div className="w-full">
                        {renderActiveTab()}
                    </div>
                )}
            </main>
        </SidebarInset>
        <Toaster />
    </SidebarProvider>
  );
}

    