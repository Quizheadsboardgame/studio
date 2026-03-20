'use client';

import { useMemo, useState } from 'react';
import { type Site, type Cleaner, type ActionPlan, type Leave, type ScheduleEntry, type MonthlySupplyOrder, type MonthlyAudit, type Appointment, type Task, type ConversationRecord, type GoodNewsRecord } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, ClipboardList, CalendarDays, FileCheck, FileClock, Package, BookOpenCheck, ListTodo, MessageSquare, Clock, Map as MapIcon, Award, Briefcase, ChevronRight, ThumbsUp } from 'lucide-react';
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
import GoodNewsCentreTab from '@/components/good-news-centre-tab';
import AvailabilityTab from '@/components/availability-tab';
import SiteMapTab from '@/components/site-map-tab';
import GoldStandardTab from '@/components/gold-standard-tab';
import SitePortfolioTab from '@/components/site-portfolio-tab';
import { Toaster } from "@/components/ui/toaster";
import { format, parseISO, isToday, startOfToday } from 'date-fns';
import React from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarMenuSub, SidebarMenuBadge } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const isMobile = useIsMobile();
  
  // --- LOCAL STATE (BLANK CANVAS) ---
  const [sites, setSites] = useState<Site[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [leave, setLeave] = useState<Leave[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [supplyOrders, setSupplyOrders] = useState<MonthlySupplyOrder[]>([]);
  const [monthlyAudits, setMonthlyAudits] = useState<MonthlyAudit[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conversationRecords, setConversationRecords] = useState<ConversationRecord[]>([]);
  const [goodNewsRecords, setGoodNewsRecords] = useState<GoodNewsRecord[]>([]);

  // --- CALCULATIONS FOR COUNTS ---
  const outstandingTasksCount = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);

  const uncoveredShiftsCount = useMemo(() => {
    if (!leave || !schedule) return 0;
    const todaysAbsences = leave.filter(l => isToday(parseISO(l.date)));
    const uniqueScheduleMap = new Map();
    schedule.forEach(item => {
        const key = `${item.site}|${item.cleaner}|${item.start}|${item.finish}`;
        if (!uniqueScheduleMap.has(key)) uniqueScheduleMap.set(key, item);
    });
    const uniqueSchedule = Array.from(uniqueScheduleMap.values());

    const todaysShiftsToCover = todaysAbsences.flatMap(absence => {
        const cleanerSchedule = uniqueSchedule.filter(s => s.cleaner === absence.cleanerName);
        return cleanerSchedule.map(shift => {
            const coverAssignment = absence.coverAssignments?.find(a => a.site === shift.site);
            return { isCovered: !!coverAssignment };
        });
    });
    return todaysShiftsToCover.filter(shift => !shift.isCovered).length;
  }, [leave, schedule]);

  const redRiskSitesCount = useMemo(() => {
      return sites.filter(s => {
          const plan = actionPlans.find(p => p.targetType === 'site' && p.id === s.id);
          if (plan) return true;
          const siteAudits = monthlyAudits
              .filter(a => a.siteId === s.id && a.status === 'Completed' && typeof a.score === 'number' && a.bookedDate)
              .sort((a, b) => parseISO(b.bookedDate!).getTime() - parseISO(a.bookedDate!).getTime());
          if (siteAudits.length > 0 && siteAudits[0].score! < 96) return true;
          return false;
      }).length;
  }, [sites, actionPlans, monthlyAudits]);

  const overdueActionPlanTasksCount = useMemo(() => {
    const today = startOfToday();
    return actionPlans.flatMap(p => p.tasks).filter(t => !t.completed && t.dueDate && parseISO(t.dueDate) < today).length;
  }, [actionPlans]);

  const followUpConversationsCount = useMemo(() => conversationRecords.filter(r => r.followUpRequired).length, [conversationRecords]);
  const unacknowledgedGoodNewsCount = useMemo(() => goodNewsRecords.filter(r => !r.acknowledged).length, [goodNewsRecords]);

  const pendingAuditsCount = useMemo(() => {
      const currentMonthDate = new Date();
      const year = currentMonthDate.getFullYear();
      const month = currentMonthDate.getMonth() + 1;
      const auditsForCurrentMonth = monthlyAudits.filter(audit => audit.year === year && audit.month === month);
      const completedSiteIds = new Set(auditsForCurrentMonth.filter(a => a.status === 'Completed').map(a => a.siteId));
      return sites.length - completedSiteIds.size;
  }, [monthlyAudits, sites]);

  const menuGroupsWithCounts = useMemo(() => {
    const groups = [
      {
        group: 'Overview',
        icon: LayoutDashboard,
        color: 'text-excellerate-orange',
        items: [
          { value: 'summary', label: 'Daily Summary', icon: FileText, countKey: 'uncoveredShifts' },
          { value: 'risk', label: 'Site Risk Dashboard', icon: ShieldAlert, countKey: 'redRisk' },
          { value: 'gold-standard', label: 'Gold Standard', icon: Award },
        ],
      },
      {
        group: 'Management',
        icon: Users,
        color: 'text-excellerate-blue',
        items: [
          { value: 'sites', label: 'Site Performance', icon: Briefcase },
          { value: 'cleaners', label: 'Cleaner Performance', icon: Users },
          { value: 'action-plan', label: 'Action Plans', icon: ClipboardList, countKey: 'overdueActionPlan' },
        ],
      },
      {
        group: 'Communications',
        icon: MessageSquare,
        color: 'text-excellerate-purple',
        items: [
          { value: 'conversation-log', label: 'Conversation Log', icon: MessageSquare, countKey: 'followUpConversations' },
          { value: 'good-news-centre', label: 'Good News Centre', icon: ThumbsUp, countKey: 'unacknowledgedGoodNews' },
        ]
      },
      {
        group: 'Scheduling',
        icon: Calendar,
        color: 'text-excellerate-teal',
        items: [
          { value: 'company-schedule', label: 'Company Schedule', icon: Calendar },
          { value: 'leave-calendar', label: 'Leave Calendar', icon: CalendarDays, countKey: 'uncoveredShifts' },
          { value: 'monthly-leave', label: 'Monthly Leave View', icon: MapIcon },
          { value: 'availability', label: 'Cleaner Availability', icon: Clock },
          { value: 'diary', label: 'Diary', icon: BookOpenCheck },
          { value: 'tasks', label: 'Tasks', icon: ListTodo, countKey: 'outstandingTasks' },
        ],
      },
      {
        group: 'Logistics',
        icon: Package,
        color: 'text-excellerate-red',
        items: [
          { value: 'audits', label: 'Audits', icon: FileCheck, countKey: 'pendingAudits' },
          { value: 'audit-history', label: 'Audit History', icon: FileClock },
          { value: 'supplies', label: 'Supply Orders', icon: Package },
        ],
      },
      {
        group: 'Site Hub',
        icon: Briefcase,
        color: 'text-excellerate-lime',
        items: [
          { value: 'site-portfolio', label: 'Site Portfolio', icon: Briefcase },
          { value: 'site-map', label: 'Site Map', icon: MapIcon },
        ],
      },
    ];

    return groups.map(group => ({
      ...group,
      items: group.items.map(item => {
        let count = 0;
        if (item.countKey === 'uncoveredShifts') count = uncoveredShiftsCount;
        if (item.countKey === 'redRisk') count = redRiskSitesCount;
        if (item.countKey === 'overdueActionPlan') count = overdueActionPlanTasksCount;
        if (item.countKey === 'followUpConversations') count = followUpConversationsCount;
        if (item.countKey === 'unacknowledgedGoodNews') count = unacknowledgedGoodNewsCount;
        if (item.countKey === 'outstandingTasks') count = outstandingTasksCount;
        if (item.countKey === 'pendingAudits') count = pendingAuditsCount;
        return { ...item, notificationCount: count };
      })
    }));
  }, [uncoveredShiftsCount, redRiskSitesCount, overdueActionPlanTasksCount, followUpConversationsCount, unacknowledgedGoodNewsCount, outstandingTasksCount, pendingAuditsCount]);

  const activeTabInfo = useMemo(() => {
      for (const group of menuGroupsWithCounts) {
          const item = group.items.find(i => i.value === activeTab);
          if (item) return { ...item, groupColor: group.color };
      }
      return undefined;
  }, [activeTab, menuGroupsWithCounts]);

  const primaryColorStyle = useMemo(() => {
      if (!activeTabInfo) return {};
      const colorMap = {
          'text-excellerate-orange': { primary: 'hsl(var(--primary))', foreground: 'hsl(0 0% 10%)'},
          'text-excellerate-blue': { primary: 'hsl(var(--excellerate-blue-hsl))', foreground: 'hsl(0 0% 98%)' },
          'text-excellerate-teal': { primary: 'hsl(var(--accent))', foreground: 'hsl(0 0% 98%)' },
          'text-excellerate-red': { primary: 'hsl(var(--excellerate-red-hsl))', foreground: 'hsl(0 0% 98%)' },
          'text-excellerate-lime': { primary: 'hsl(var(--excellerate-lime-hsl))', foreground: 'hsl(0 0% 10%)' },
          'text-excellerate-purple': { primary: 'hsl(var(--excellerate-purple-hsl))', foreground: 'hsl(0 0% 98%)' },
      };
      const colors = colorMap[activeTabInfo.groupColor as keyof typeof colorMap] || colorMap['text-excellerate-orange'];
      return { '--primary': colors.primary, '--primary-foreground': colors.foreground } as React.CSSProperties;
  }, [activeTabInfo]);
  
  // --- CRUD HANDLERS (LOCAL STATE) ---
  const handleUpdateSite = (siteId: string, updatedData: Partial<Omit<Site, 'id'>>) => {
    setSites(prev => prev.map(s => s.id === siteId ? { ...s, ...updatedData } : s));
  };

  const handleSetMonthlyAudit = (siteId: string, date: Date, auditData: Partial<Omit<MonthlyAudit, 'id' | 'siteId' | 'month' | 'year'>>) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const docId = `${siteId}-${format(date, 'yyyy-MM')}`;
    setMonthlyAudits(prev => {
        const existing = prev.find(a => a.id === docId);
        if (existing) {
            return prev.map(a => a.id === docId ? { ...a, ...auditData } : a);
        }
        return [...prev, { id: docId, siteId, year, month, auditor: 'Unassigned', status: 'Not Booked', ...auditData } as MonthlyAudit];
    });
  };

  const handleAddSite = (siteName: string) => {
    if (siteName.trim() === '') return;
    const newSite: Site = { id: `site-${Date.now()}`, name: siteName, status: 'No Concerns', notes: '' };
    setSites(prev => [...prev, newSite]);
  };

  const handleRemoveSite = (siteId: string) => {
    setSites(prev => prev.filter(s => s.id !== siteId));
  };
  
  const handleUpdateCleaner = (cleanerId: string, updatedData: Partial<Omit<Cleaner, 'id'>>) => {
    setCleaners(prev => prev.map(c => c.id === cleanerId ? { ...c, ...updatedData } : c));
  };

  const handleAddCleaner = (cleanerName: string) => {
    if (cleanerName.trim() === '') return;
    const newCleaner: Cleaner = {
      id: `cleaner-${Date.now()}`,
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
    setCleaners(prev => [...prev, newCleaner]);
  };

  const handleRemoveCleaner = (cleanerId: string) => {
    setCleaners(prev => prev.filter(c => c.id !== cleanerId));
  };

  const handleUpdateActionPlan = (updatedPlan: ActionPlan) => {
    setActionPlans(prev => {
        const existing = prev.find(p => p.id === updatedPlan.id);
        if (existing) return prev.map(p => p.id === updatedPlan.id ? updatedPlan : p);
        return [...prev, updatedPlan];
    });
  };

  const handleRemoveActionPlan = (planId: string) => {
    setActionPlans(prev => prev.filter(p => p.id !== planId));
  };
  
  const handleAddLeave = (newLeaveData: Omit<Leave, 'id' | 'coverAssignments'>) => {
    const newEntry: Leave = { id: `leave-${Date.now()}`, ...newLeaveData, coverAssignments: [] };
    setLeave(prev => [...prev, newEntry]);
  };

  const handleUpdateLeave = (leaveId: string, updatedData: Partial<Omit<Leave, 'id'>>) => {
    setLeave(prev => prev.map(l => l.id === leaveId ? { ...l, ...updatedData } : l));
  };

  const handleDeleteLeave = (leaveToDelete: Leave) => {
    setLeave(prev => prev.filter(l => l.id !== leaveToDelete.id));
  };
  
  const handleAddScheduleEntry = (newEntry: Omit<ScheduleEntry, 'id'>) => {
    const entry: ScheduleEntry = { id: `schedule-${Date.now()}`, ...newEntry };
    setSchedule(prev => [...prev, entry]);
  };

  const handleUpdateScheduleEntry = (entryId: string, updatedEntry: Partial<Omit<ScheduleEntry, 'id'>>) => {
    setSchedule(prev => prev.map(s => s.id === entryId ? { ...s, ...updatedEntry } : s));
  };

  const handleRemoveScheduleEntry = (entryId: string) => {
    setSchedule(prev => prev.filter(s => s.id !== entryId));
  };
  
  const handleSetSupplyOrder = (siteId: string, consumableId: string, date: Date, quantity: number) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const docId = `${siteId}-${consumableId}-${format(date, 'yyyy-MM')}`;
    setSupplyOrders(prev => {
        if (quantity > 0) {
            const existing = prev.find(o => o.id === docId);
            if (existing) return prev.map(o => o.id === docId ? { ...o, quantity } : o);
            return [...prev, { id: docId, siteId, consumableId, year, month, quantity }];
        }
        return prev.filter(o => o.id !== docId);
    });
  };

  const handleAddConsumable = (siteId: string, consumableData: any) => {
    // Local blank canvas handles site-specific consumables via props in sub-components if needed
  };

  const handleAddAppointment = (newAppointment: Omit<Appointment, 'id'>) => {
    const entry: Appointment = { id: `app-${Date.now()}`, ...newAppointment };
    setAppointments(prev => [...prev, entry]);
  };

  const handleUpdateAppointment = (appointmentId: string, updatedData: Partial<Omit<Appointment, 'id'>>) => {
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, ...updatedData } : a));
  };

  const handleRemoveAppointment = (appointmentId: string) => {
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
  };
  
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const entry: Task = { id: `task-${Date.now()}`, ...newTaskData, completed: false };
    setTasks(prev => [...prev, entry]);
  };

  const handleUpdateTask = (taskId: string, updatedData: Partial<Omit<Task, 'id'>>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedData } : t));
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleAddConversationRecord = (newRecordData: Omit<ConversationRecord, 'id'>) => {
    const entry: ConversationRecord = { id: `conv-${Date.now()}`, ...newRecordData };
    setConversationRecords(prev => [...prev, entry]);
  };

  const handleUpdateConversationRecord = (recordId: string, updatedData: Partial<Omit<ConversationRecord, 'id'>>) => {
    setConversationRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...updatedData } : r));
  };

  const handleRemoveConversationRecord = (recordId: string) => {
    setConversationRecords(prev => prev.filter(r => r.id !== recordId));
  };

  const handleAddGoodNewsRecord = (newRecordData: Omit<GoodNewsRecord, 'id'>) => {
    const entry: GoodNewsRecord = { id: `gn-${Date.now()}`, ...newRecordData };
    setGoodNewsRecords(prev => [...prev, entry]);
  };

  const handleUpdateGoodNewsRecord = (recordId: string, updatedData: Partial<Omit<GoodNewsRecord, 'id'>>) => {
    setGoodNewsRecords(prev => prev.map(r => r.id === recordId ? { ...r, ...updatedData } : r));
  };

  const handleRemoveGoodNewsRecord = (recordId: string) => {
    setGoodNewsRecords(prev => prev.filter(r => r.id !== recordId));
  };

  const sortedSites = useMemo(() => [...sites].sort((a, b) => a.name.localeCompare(b.name)), [sites]);
  const sortedCleaners = useMemo(() => [...cleaners].sort((a, b) => a.name.localeCompare(b.name)), [cleaners]);
  const sortedSchedule = useMemo(() => [...schedule].sort((a, b) => a.site.localeCompare(b.site) || a.cleaner.localeCompare(b.cleaner)), [schedule]);

  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);
  
  const renderActiveTab = () => {
    switch (activeTab) {
        case 'sites':
            return (
                <Card>
                    <CardHeader><CardTitle>Site Performance</CardTitle></CardHeader>
                    <CardContent>
                        <SitesTab sites={sortedSites} onNoteChange={handleUpdateSite} onAddSite={handleAddSite} onEditSite={(id, name) => handleUpdateSite(id, { name })} onRemoveSite={handleRemoveSite} />
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
            return <LeaveCalendarTab cleaners={sortedCleaners} leave={leave} schedule={sortedSchedule} onAddLeave={handleAddLeave} onDeleteLeave={handleDeleteLeave} onUpdateLeave={handleUpdateLeave} />;
        case 'monthly-leave':
            return <MonthlyLeaveCalendar leave={leave} />;
        case 'supplies':
            return <SuppliesTab sites={sortedSites} firestore={null} supplyOrders={supplyOrders} onSetOrder={handleSetSupplyOrder} onAddConsumable={handleAddConsumable} onEditConsumable={() => {}} onRemoveConsumable={() => {}} />;
        case 'audits':
            return <AuditsTab sites={sortedSites} monthlyAudits={monthlyAudits} onSetAudit={handleSetMonthlyAudit} />;
        case 'audit-history':
            return <AuditHistoryTab sites={sortedSites} monthlyAudits={monthlyAudits} />;
        case 'risk':
            return <RiskDashboardTab sites={sortedSites} cleaners={sortedCleaners} />;
        case 'diary':
            return <DiaryTab sites={sortedSites} appointments={appointments} monthlyAudits={monthlyAudits} leave={leave} schedule={sortedSchedule} onAddAppointment={handleAddAppointment} onUpdateAppointment={handleUpdateAppointment} onRemoveAppointment={handleRemoveAppointment} />;
        case 'action-plan':
            return <ActionPlanTab sites={sortedSites} cleaners={sortedCleaners} actionPlans={actionPlans} onUpdateActionPlan={handleUpdateActionPlan} onRemoveActionPlan={handleRemoveActionPlan} />;
        case 'tasks':
            return <TasksTab tasks={tasks} sites={sortedSites} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onRemoveTask={handleRemoveTask} />;
        case 'conversation-log':
            return <ConversationLogTab cleaners={sortedCleaners} sites={sortedSites} conversationRecords={conversationRecords} onAddRecord={handleAddConversationRecord} onUpdateRecord={handleUpdateConversationRecord} onRemoveRecord={handleRemoveConversationRecord} />;
        case 'good-news-centre':
            return <GoodNewsCentreTab records={goodNewsRecords} cleaners={sortedCleaners} sites={sortedSites} onAddRecord={handleAddGoodNewsRecord} onUpdateRecord={handleUpdateGoodNewsRecord} onRemoveRecord={handleRemoveGoodNewsRecord} />;
        case 'site-portfolio':
            return <SitePortfolioTab sites={sortedSites} cleaners={sortedCleaners} schedule={sortedSchedule} actionPlans={actionPlans} monthlyAudits={monthlyAudits} tasks={tasks} appointments={appointments} onUpdateSite={handleUpdateSite} onUpdateTask={handleUpdateTask} onRemoveTask={handleRemoveTask} onAddAppointment={handleAddAppointment} onUpdateAppointment={handleUpdateAppointment} onRemoveAppointment={handleRemoveAppointment} onAddScheduleEntry={handleAddScheduleEntry} onUpdateScheduleEntry={handleUpdateScheduleEntry} onRemoveScheduleEntry={handleRemoveScheduleEntry} />;
        case 'site-map':
            return <SiteMapTab sites={sortedSites} />;
        case 'gold-standard':
            return <GoldStandardTab sites={sortedSites} cleaners={sortedCleaners} />;
        default:
            return <DailySummaryTab sites={sortedSites} cleaners={sortedCleaners} actionPlans={actionPlans} schedule={schedule} leave={leave} />;
    }
  };

  return (
    <SidebarProvider>
        <FirebaseErrorListener />
        <Sidebar collapsible={isMobile ? 'offcanvas' : 'icon'}>
            <SidebarHeader>
                <div className="flex items-center gap-3">
                    <div className="p-1 relative">
                        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">C</div>
                        {outstandingTasksCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                            {outstandingTasksCount}
                        </div>
                        )}
                    </div>
                    <div className='flex flex-col'>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">CleanFlow</h1>
                        <p className="text-xs text-muted-foreground">Lot 4. Addenbrooke’s</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                  {menuGroupsWithCounts.map((group) => (
                      <Collapsible
                          key={group.group}
                          open={openCollapsibles.includes(group.group)}
                          onOpenChange={(isOpen) =>
                              setOpenCollapsibles((prev) =>
                                  isOpen ? [...prev, group.group] : prev.filter((g) => g !== group.group)
                              )
                          }
                          className="w-full"
                      >
                          <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                  <SidebarMenuButton className="justify-between w-full">
                                      <div className={cn("flex items-center gap-2", group.color)}>
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
                                              <item.icon className={cn(activeTab === item.value && group.color)} />
                                              <span>{item.label}</span>
                                              {(item.notificationCount ?? 0) > 0 && <SidebarMenuBadge>{item.notificationCount}</SidebarMenuBadge>}
                                          </SidebarMenuButton>
                                      </SidebarMenuItem>
                                  ))}
                              </SidebarMenuSub>
                          </CollapsibleContent>
                      </Collapsible>
                  ))}
              </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger />
                    {activeTabInfo?.icon && <activeTabInfo.icon className={cn("h-5 w-5", activeTabInfo.groupColor)} />}
                    <h2 className="font-semibold text-lg">{activeTabInfo?.label}</h2>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="w-full" style={primaryColorStyle}>
                    {renderActiveTab()}
                </div>
            </main>
        </SidebarInset>
        <Toaster />
    </SidebarProvider>
  );
}
