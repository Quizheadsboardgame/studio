'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  type Site, 
  type Cleaner, 
  type ActionPlan, 
  type Leave, 
  type ScheduleEntry, 
  type MonthlySupplyOrder, 
  type MonthlyAudit, 
  type Appointment, 
  type Task, 
  type ConversationRecord, 
  type GoodNewsRecord,
  type UserProfile
} from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, ClipboardList, CalendarDays, FileCheck, FileClock, Package, BookOpenCheck, ListTodo, MessageSquare, Clock, Map as MapIcon, Award, Briefcase, ChevronRight, ThumbsUp, LogIn, LogOut, Loader2 } from 'lucide-react';
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
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarMenuSub, SidebarMenuBadge, SidebarFooter } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

function LoginPage() {
  const [email, setEmail] = useState('clean@flow.com');
  const [password, setPassword] = useState('cleanflow');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">CleanFlow Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('summary');
  const isMobile = useIsMobile();
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>(['Overview']);

  // --- Hub Orchestration ---
  const profilesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'userProfiles'), where(`members.${user.uid}`, '!=', null), limit(1));
  }, [firestore, user]);

  const { data: userProfiles, isLoading: isProfileLoading } = useCollection<UserProfile>(profilesQuery);
  const activeProfile = userProfiles?.[0] || null;
  const activeProfileId = activeProfile?.id;

  // Create default profile if none exists
  useEffect(() => {
    if (!isProfileLoading && user && !activeProfile) {
      const newProfileId = `profile-${user.uid}`;
      const profileRef = doc(firestore, 'userProfiles', newProfileId);
      setDoc(profileRef, {
        id: newProfileId,
        name: `${user.email?.split('@')[0]}'s Hub`,
        email: user.email,
        members: { [user.uid]: 'owner' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  }, [isProfileLoading, user, activeProfile, firestore]);

  // --- Scoped Data Fetching ---
  const sitesRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'sites') : null, [firestore, activeProfileId]);
  const cleanersRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'cleaners') : null, [firestore, activeProfileId]);
  const scheduleRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'cleaningScheduleEntries') : null, [firestore, activeProfileId]);
  
  // Note: For a true blank canvas, we'll start with these. Other subcollections can be added as needed.
  const { data: sites = [] } = useCollection<Site>(sitesRef);
  const { data: cleaners = [] } = useCollection<Cleaner>(cleanersRef);
  const { data: schedule = [] } = useCollection<ScheduleEntry>(scheduleRef);

  // Fallback to local state for others to keep the UI from crashing if they aren't fully migrated to subcollections yet
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [leave, setLeave] = useState<Leave[]>([]);
  const [supplyOrders, setSupplyOrders] = useState<MonthlySupplyOrder[]>([]);
  const [monthlyAudits, setMonthlyAudits] = useState<MonthlyAudit[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [conversationRecords, setConversationRecords] = useState<ConversationRecord[]>([]);
  const [goodNewsRecords, setGoodNewsRecords] = useState<GoodNewsRecord[]>([]);

  // --- Calculations ---
  const outstandingTasksCount = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);

  const uncoveredShiftsCount = useMemo(() => {
    if (!leave || !schedule) return 0;
    const todaysAbsences = leave.filter(l => isToday(parseISO(l.date)));
    const todaysShiftsToCover = todaysAbsences.flatMap(absence => {
        const cleanerSchedule = (schedule || []).filter(s => s.cleaner === absence.cleanerName);
        return cleanerSchedule.map(shift => {
            const coverAssignment = absence.coverAssignments?.find(a => a.site === shift.site);
            return { isCovered: !!coverAssignment };
        });
    });
    return todaysShiftsToCover.filter(shift => !shift.isCovered).length;
  }, [leave, schedule]);

  const menuGroupsWithCounts = useMemo(() => {
    const groups = [
      {
        group: 'Overview',
        icon: LayoutDashboard,
        color: 'text-excellerate-orange',
        items: [
          { value: 'summary', label: 'Daily Summary', icon: FileText, countKey: 'uncoveredShifts' },
          { value: 'risk', label: 'Site Risk Dashboard', icon: ShieldAlert },
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
          { value: 'action-plan', label: 'Action Plans', icon: ClipboardList },
        ],
      },
      {
        group: 'Scheduling',
        icon: Calendar,
        color: 'text-excellerate-teal',
        items: [
          { value: 'company-schedule', label: 'Company Schedule', icon: Calendar },
          { value: 'leave-calendar', label: 'Leave Calendar', icon: CalendarDays },
          { value: 'availability', label: 'Cleaner Availability', icon: Clock },
          { value: 'tasks', label: 'Tasks', icon: ListTodo, countKey: 'outstandingTasks' },
        ],
      },
    ];

    return groups.map(group => ({
      ...group,
      items: group.items.map(item => {
        let count = 0;
        if (item.countKey === 'uncoveredShifts') count = uncoveredShiftsCount;
        if (item.countKey === 'outstandingTasks') count = outstandingTasksCount;
        return { ...item, notificationCount: count };
      })
    }));
  }, [uncoveredShiftsCount, outstandingTasksCount]);

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
      };
      const colors = colorMap[activeTabInfo.groupColor as keyof typeof colorMap] || colorMap['text-excellerate-orange'];
      return { '--primary': colors.primary, '--primary-foreground': colors.foreground } as React.CSSProperties;
  }, [activeTabInfo]);
  
  // --- Firestore Handlers ---
  const handleAddSite = (siteName: string) => {
    if (!sitesRef) return;
    const newDocRef = doc(sitesRef);
    setDoc(newDocRef, {
      id: newDocRef.id,
      name: siteName,
      status: 'No Concerns',
      userProfileId: activeProfileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: activeProfile?.members || {}
    });
  };

  const handleUpdateSite = (siteId: string, updatedData: Partial<Omit<Site, 'id'>>) => {
    if (!sitesRef) return;
    updateDocumentNonBlocking(doc(sitesRef, siteId), { ...updatedData, updatedAt: new Date().toISOString() });
  };

  const handleRemoveSite = (siteId: string) => {
    if (!sitesRef) return;
    deleteDocumentNonBlocking(doc(sitesRef, siteId));
  };

  const handleAddCleaner = (cleanerName: string) => {
    if (!cleanersRef) return;
    const newDocRef = doc(cleanersRef);
    setDoc(newDocRef, {
      id: newDocRef.id,
      name: cleanerName,
      rating: 'No Concerns',
      holidayAllowance: 20,
      userProfileId: activeProfileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: activeProfile?.members || {}
    });
  };

  const handleUpdateCleaner = (cleanerId: string, updatedData: Partial<Omit<Cleaner, 'id'>>) => {
    if (!cleanersRef) return;
    updateDocumentNonBlocking(doc(cleanersRef, cleanerId), { ...updatedData, updatedAt: new Date().toISOString() });
  };

  const handleRemoveCleaner = (cleanerId: string) => {
    if (!cleanersRef) return;
    deleteDocumentNonBlocking(doc(cleanersRef, cleanerId));
  };

  const handleAddScheduleEntry = (newEntry: Omit<ScheduleEntry, 'id'>) => {
    if (!scheduleRef) return;
    const newDocRef = doc(scheduleRef);
    setDoc(newDocRef, {
      id: newDocRef.id,
      ...newEntry,
      userProfileId: activeProfileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: activeProfile?.members || {}
    });
  };

  const handleUpdateScheduleEntry = (entryId: string, updatedEntry: Partial<Omit<ScheduleEntry, 'id'>>) => {
    if (!scheduleRef) return;
    updateDocumentNonBlocking(doc(scheduleRef, entryId), { ...updatedEntry, updatedAt: new Date().toISOString() });
  };

  const handleRemoveScheduleEntry = (entryId: string) => {
    if (!scheduleRef) return;
    deleteDocumentNonBlocking(doc(scheduleRef, entryId));
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
        case 'sites':
            return (
                <Card>
                    <CardHeader><CardTitle>Site Performance</CardTitle></CardHeader>
                    <CardContent>
                        <SitesTab sites={sites || []} onNoteChange={handleUpdateSite} onAddSite={handleAddSite} onEditSite={(id, name) => handleUpdateSite(id, { name })} onRemoveSite={handleRemoveSite} />
                    </CardContent>
                </Card>
            );
        case 'cleaners':
            return (
                <Card>
                    <CardHeader><CardTitle>Cleaner Performance</CardTitle></CardHeader>
                    <CardContent>
                        <CleanersTab cleaners={cleaners || []} onUpdateCleaner={handleUpdateCleaner} onAddCleaner={handleAddCleaner} onRemoveCleaner={handleRemoveCleaner} />
                    </CardContent>
                </Card>
            );
        case 'availability':
            return <AvailabilityTab cleaners={cleaners || []} onUpdateCleaner={handleUpdateCleaner} />;
        case 'company-schedule':
            return (
                <Card>
                    <CardHeader><CardTitle>Company Schedule</CardTitle></CardHeader>
                    <CardContent>
                        <CompanyScheduleTab schedule={schedule || []} sites={sites || []} cleaners={cleaners || []} onAdd={handleAddScheduleEntry} onUpdate={handleUpdateScheduleEntry} onRemove={handleRemoveScheduleEntry} />
                    </CardContent>
                </Card>
            );
        case 'leave-calendar':
            return <LeaveCalendarTab cleaners={cleaners || []} leave={leave} schedule={schedule || []} onAddLeave={() => {}} onDeleteLeave={() => {}} onUpdateLeave={() => {}} />;
        case 'risk':
            return <RiskDashboardTab sites={sites || []} cleaners={cleaners || []} />;
        case 'action-plan':
            return <ActionPlanTab sites={sites || []} cleaners={cleaners || []} actionPlans={actionPlans} onUpdateActionPlan={() => {}} onRemoveActionPlan={() => {}} />;
        case 'tasks':
            return <TasksTab tasks={tasks} sites={sites || []} onAddTask={() => {}} onUpdateTask={() => {}} onRemoveTask={() => {}} />;
        case 'gold-standard':
            return <GoldStandardTab sites={sites || []} cleaners={cleaners || []} />;
        default:
            return <DailySummaryTab sites={sites || []} cleaners={cleaners || []} actionPlans={actionPlans} schedule={schedule || []} leave={leave} />;
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
                    </div>
                    <div className='flex flex-col'>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">CleanFlow</h1>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{activeProfile?.name}</span>
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
                                          <group.icon className="h-4 w-4" />
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
                                              <item.icon className={cn("h-4 w-4", activeTab === item.value && group.color)} />
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
            <SidebarFooter className="p-4 border-t">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => signOut(auth)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </SidebarFooter>
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
