'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  type Site, 
  type Cleaner, 
  type ScheduleEntry, 
  type UserProfile,
  type ActionPlan,
  type Task,
  type ConversationRecord,
  type GoodNewsRecord,
  type MonthlyAudit,
  type MonthlySupplyOrder,
  type Appointment,
  type Leave,
} from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, ClipboardList, CalendarDays, Globe, Building2, Trash2, UserPlus, LogIn, LogOut, Loader2, Settings, Plus, ChevronRight, Clock, Award, ShieldCheck, UserCog, CheckSquare, MessageSquare, Heart, ClipboardCheck, History, Package, Map, BookOpen, Layers, ShieldX } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import SitesTab from '@/components/sites-tab';
import CleanersTab from '@/components/cleaners-tab';
import CompanyScheduleTab from '@/components/schedule-tab';
import RiskDashboardTab from '@/components/risk-dashboard-tab';
import DailySummaryTab from '@/components/daily-summary-tab';
import ActionPlanTab from '@/components/action-plan-tab';
import LeaveCalendarTab from '@/components/leave-calendar-tab';
import AvailabilityTab from '@/components/availability-tab';
import GoldStandardTab from '@/components/gold-standard-tab';
import AuditsTab from '@/components/audits-tab';
import AuditHistoryTab from '@/components/audit-history-tab';
import ConversationLogTab from '@/components/conversation-log-tab';
import GoodNewsCentreTab from '@/components/good-news-centre-tab';
import SuppliesTab from '@/components/supplies-tab';
import TasksTab from '@/components/tasks-tab';
import DiaryTab from '@/components/diary-tab';
import SiteMapTab from '@/components/site-map-tab';
import SitePortfolioTab from '@/components/site-portfolio-tab';
import MonthlyLeaveCalendar from '@/components/monthly-leave-calendar';
import AccountSettingsTab from '@/components/account-settings-tab';

import { Toaster } from "@/components/ui/toaster";
import { format, parseISO } from 'date-fns';
import React from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarMenuSub, SidebarFooter } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { restoreProfessionalData } from '@/lib/restore-seeder';

const MASTER_EMAILS = ['clean@flow.com', 'clean@flow.co.uk'];
const RESTORATION_TARGET = 'owen.newton@excellerateservices.com';
const CURRENT_RESTORATION_VERSION = 6;

const ALL_AVAILABLE_TABS = [
  { id: 'summary', label: 'Daily Summary', group: 'Overview' },
  { id: 'risk', label: 'Risk Dashboard', group: 'Overview' },
  { id: 'gold-standard', label: 'Gold Standard', group: 'Overview' },
  { id: 'portfolio', label: 'Site Portfolio', group: 'Overview' },
  { id: 'sites', label: 'Sites', group: 'Management' },
  { id: 'cleaners', label: 'Cleaners', group: 'Management' },
  { id: 'action-plan', label: 'Action Plans', group: 'Management' },
  { id: 'tasks', label: 'To-Do List', group: 'Management' },
  { id: 'conversation-log', label: 'Conversation Log', group: 'Management' },
  { id: 'good-news', label: 'Good News Centre', group: 'Management' },
  { id: 'audits', label: 'Site Audits', group: 'Operations' },
  { id: 'audit-history', label: 'Audit History', group: 'Operations' },
  { id: 'supplies', label: 'Supplies', group: 'Operations' },
  { id: 'company-schedule', label: 'Schedule', group: 'Scheduling' },
  { id: 'leave-calendar', label: 'Leave & Cover', group: 'Scheduling' },
  { id: 'monthly-leave', label: 'Monthly Calendar', group: 'Scheduling' },
  { id: 'availability', label: 'Availability', group: 'Scheduling' },
  { id: 'diary', label: 'Diary', group: 'Scheduling' },
  { id: 'directions', label: 'Site Directions', group: 'Utilities' },
];

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: 'Account Created', description: 'Welcome to CleanFlow!' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: isSignUp ? 'Sign Up Failed' : 'Login Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">C</div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">CleanFlow</CardTitle>
          <CardDescription>{isSignUp ? 'Create your operational account' : 'Operation Hub Management'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full h-11 text-lg font-semibold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isSignUp ? <UserPlus className="mr-2 h-5 w-5" /> : <LogIn className="mr-2 h-5 w-5" />)}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:underline font-medium"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function TabConfigurationDialog({ hub, onUpdate }: { hub: UserProfile, onUpdate: (hubId: string, enabledTabs: string[]) => void }) {
  const [enabledTabs, setEnabledTabs] = useState<string[]>(hub.enabledTabs || ALL_AVAILABLE_TABS.map(t => t.id));

  const toggleTab = (tabId: string) => {
    setEnabledTabs(prev => 
      prev.includes(tabId) ? prev.filter(id => id !== tabId) : [...prev, tabId]
    );
  };

  const handleSave = () => {
    onUpdate(hub.id, enabledTabs);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2"><Layers className="mr-2 h-4 w-4" /> Tabs</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Features: {hub.name}</DialogTitle>
          <DialogDescription>Select which tools are visible for this hub.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-auto">
          {Object.entries(
            ALL_AVAILABLE_TABS.reduce((acc, tab) => {
              if (!acc[tab.group]) acc[tab.group] = [];
              acc[tab.group].push(tab);
              return acc;
            }, {} as Record<string, typeof ALL_AVAILABLE_TABS>)
          ).map(([group, tabs]) => (
            <div key={group} className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground border-b pb-1">{group}</h4>
              <div className="space-y-2">
                {tabs.map(tab => (
                  <div key={tab.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`tab-${hub.id}-${tab.id}`} 
                      checked={enabledTabs.includes(tab.id)} 
                      onCheckedChange={() => toggleTab(tab.id)}
                    />
                    <Label htmlFor={`tab-${hub.id}-${tab.id}`} className="text-sm font-medium leading-none cursor-pointer">{tab.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button onClick={handleSave}>Save Configuration</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MemberManagementDialog({ hub, onUpdate }: { hub: UserProfile, onUpdate: (hubId: string, members: Record<string, string>) => void }) {
  const [newUid, setNewUid] = useState('');
  const [newRole, setNewRole] = useState('owner');

  const handleAdd = () => {
    if (!newUid) return;
    onUpdate(hub.id, { ...hub.members, [newUid]: newRole });
    setNewUid('');
  };

  const handleRemove = (uid: string) => {
    const updated = { ...hub.members };
    delete updated[uid];
    onUpdate(hub.id, updated);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2"><UserCog className="mr-2 h-4 w-4" /> Members</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Members: {hub.name}</DialogTitle>
          <DialogDescription>Directly link Firebase User IDs (UIDs) to this operational hub.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label>User UID</Label>
              <Input value={newUid} onChange={e => setNewUid(e.target.value)} placeholder="e.g. sWN2W9Cbz..." />
            </div>
            <div className="w-32 space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="border rounded-md divide-y max-h-64 overflow-auto">
            {Object.entries(hub.members || {}).map(([uid, role]) => (
              <div key={uid} className="flex items-center justify-between p-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-mono text-xs text-muted-foreground">{uid}</span>
                  <span className="font-bold text-primary uppercase text-[10px]">{role}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(uid)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            {Object.keys(hub.members || {}).length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No members linked yet.</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>(['Overview', 'Management', 'Operations', 'Scheduling', 'Utilities', 'Account Settings', 'Master Control']);

  const isMasterUser = useMemo(() => user?.email && MASTER_EMAILS.includes(user.email.toLowerCase()), [user]);

  // --- Hub Orchestration ---
  const profilesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (isMasterUser) return collection(firestore, 'userProfiles');
    return query(collection(firestore, 'userProfiles'), where(`members.${user.uid}`, '!=', null));
  }, [firestore, user, isMasterUser]);

  const { data: allHubsResult, isLoading: isProfileLoading } = useCollection<UserProfile>(profilesQuery);
  const allHubs = allHubsResult || [];
  
  // Resolve active hub
  const activeProfile = useMemo(() => {
    if (allHubs.length === 0) return null;
    if (selectedHubId) return allHubs.find(h => h.id === selectedHubId) || allHubs[0];
    return allHubs[0] || null;
  }, [allHubs, selectedHubId]);

  const activeProfileId = activeProfile?.id;

  // Set default selection when data loads
  useEffect(() => {
    if (activeProfileId && !selectedHubId) {
      setSelectedHubId(activeProfileId);
    }
  }, [activeProfileId, selectedHubId]);

  // Restoration and Initial setup logic
  useEffect(() => {
    if (!isProfileLoading && user && firestore) {
      const isTargetEmail = user.email?.toLowerCase() === RESTORATION_TARGET;
      const targetHubId = allHubs.find(h => h.email?.toLowerCase() === RESTORATION_TARGET)?.id || `hub-${user.uid}`;
      const profileRef = doc(firestore, 'userProfiles', targetHubId);

      const performRestoration = async () => {
        toast({ title: 'Restoring Lot 4 Data...', description: 'Recovering professional site and cleaner data.' });
        await restoreProfessionalData(firestore, targetHubId);
        await updateDoc(profileRef, { restorationVersion: CURRENT_RESTORATION_VERSION, updatedAt: new Date().toISOString() });
        toast({ title: 'Restoration Complete', description: 'Your original Lot 4 Addenbrooke\'s data has been recovered.' });
      };

      if (allHubs.length === 0) {
        // Brand new user
        setDoc(profileRef, {
          id: targetHubId,
          name: isTargetEmail ? "Excellerate Services - Lot 4" : (isMasterUser ? "Main Enterprise Hub" : `${user.email?.split('@')[0]}'s Operations`),
          email: user.email,
          members: { [user.uid]: 'owner' },
          enabledTabs: ALL_AVAILABLE_TABS.map(t => t.id),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeactivated: false,
          restorationVersion: isTargetEmail ? CURRENT_RESTORATION_VERSION : 0
        }, { merge: true }).then(() => {
          if (isTargetEmail) performRestoration();
        });
      } else {
        // Existing user check for restoration or reactivation
        allHubs.forEach(hub => {
          if (hub.email?.toLowerCase() === user.email?.toLowerCase()) {
            // Auto-Reactivate
            if (hub.isDeactivated) {
              updateDoc(doc(firestore, 'userProfiles', hub.id), { isDeactivated: false, updatedAt: new Date().toISOString() });
              toast({ title: 'Welcome Back!', description: 'Your account has been reactivated.' });
            }
            // Ensure owner membership
            if (!hub.members || !hub.members[user.uid]) {
              updateDoc(doc(firestore, 'userProfiles', hub.id), { [`members.${user.uid}`]: 'owner', updatedAt: new Date().toISOString() });
            }
            // Professional Data Restoration check
            if (isTargetEmail && (hub.restorationVersion || 0) < CURRENT_RESTORATION_VERSION) {
              performRestoration();
            }
          }
        });
      }
    }
  }, [isProfileLoading, user, allHubs, firestore, isMasterUser, toast]);

  // --- Hub-Scoped Data Hooks ---
  const createHubRef = (sub: string) => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, sub) : null;

  const sitesRef = useMemoFirebase(() => createHubRef('sites'), [firestore, activeProfileId]);
  const cleanersRef = useMemoFirebase(() => createHubRef('cleaners'), [firestore, activeProfileId]);
  const scheduleRef = useMemoFirebase(() => createHubRef('cleaningScheduleEntries'), [firestore, activeProfileId]);
  const auditsRef = useMemoFirebase(() => createHubRef('audits'), [firestore, activeProfileId]);
  const appointmentsRef = useMemoFirebase(() => createHubRef('appointments'), [firestore, activeProfileId]);
  const tasksRef = useMemoFirebase(() => createHubRef('tasks'), [firestore, activeProfileId]);
  const conversationsRef = useMemoFirebase(() => createHubRef('conversations'), [firestore, activeProfileId]);
  const goodNewsRef = useMemoFirebase(() => createHubRef('goodNews'), [firestore, activeProfileId]);
  const supplyOrdersRef = useMemoFirebase(() => createHubRef('supplyOrders'), [firestore, activeProfileId]);
  const actionPlansRef = useMemoFirebase(() => createHubRef('actionPlans'), [firestore, activeProfileId]);
  const leaveRef = useMemoFirebase(() => createHubRef('leave'), [firestore, activeProfileId]);

  // UseCollection with fallback to empty array to prevent filtering on null
  const sites = useCollection<Site>(sitesRef).data || [];
  const cleaners = useCollection<Cleaner>(cleanersRef).data || [];
  const schedule = useCollection<ScheduleEntry>(scheduleRef).data || [];
  const audits = useCollection<MonthlyAudit>(auditsRef).data || [];
  const appointments = useCollection<Appointment>(appointmentsRef).data || [];
  const tasks = useCollection<Task>(tasksRef).data || [];
  const conversations = useCollection<ConversationRecord>(conversationsRef).data || [];
  const goodNews = useCollection<GoodNewsRecord>(goodNewsRef).data || [];
  const supplyOrders = useCollection<MonthlySupplyOrder>(supplyOrdersRef).data || [];
  const actionPlans = useCollection<ActionPlan>(actionPlansRef).data || [];
  const leave = useCollection<Leave>(leaveRef).data || [];

  // --- Navigation Mapping ---
  const menuGroups = useMemo(() => {
    const enabledTabs = activeProfile?.enabledTabs || ALL_AVAILABLE_TABS.map(t => t.id);

    const groups = [
      {
        group: 'Overview',
        icon: LayoutDashboard,
        color: 'text-excellerate-orange',
        items: [
          { value: 'summary', label: 'Daily Summary', icon: FileText },
          { value: 'risk', label: 'Risk Dashboard', icon: ShieldAlert },
          { value: 'gold-standard', label: 'Gold Standard', icon: Award },
          { value: 'portfolio', label: 'Site Portfolio', icon: BookOpen },
        ].filter(item => isMasterUser || enabledTabs.includes(item.value)),
      },
      {
        group: 'Management',
        icon: Users,
        color: 'text-excellerate-blue',
        items: [
          { value: 'sites', label: 'Sites', icon: Building2 },
          { value: 'cleaners', label: 'Cleaners', icon: Users },
          { value: 'action-plan', label: 'Action Plans', icon: ClipboardList },
          { value: 'tasks', label: 'To-Do List', icon: CheckSquare },
          { value: 'conversation-log', label: 'Conversation Log', icon: MessageSquare },
          { value: 'good-news', label: 'Good News Centre', icon: Heart },
        ].filter(item => isMasterUser || enabledTabs.includes(item.value)),
      },
      {
        group: 'Operations',
        icon: ClipboardCheck,
        color: 'text-excellerate-lime',
        items: [
          { value: 'audits', label: 'Site Audits', icon: ClipboardCheck },
          { value: 'audit-history', label: 'Audit History', icon: History },
          { value: 'supplies', label: 'Supplies', icon: Package },
        ].filter(item => isMasterUser || enabledTabs.includes(item.value)),
      },
      {
        group: 'Scheduling',
        icon: Calendar,
        color: 'text-excellerate-teal',
        items: [
          { value: 'company-schedule', label: 'Schedule', icon: Calendar },
          { value: 'leave-calendar', label: 'Leave & Cover', icon: CalendarDays },
          { value: 'monthly-leave', label: 'Monthly Calendar', icon: Calendar },
          { value: 'availability', label: 'Availability', icon: Clock },
          { value: 'diary', label: 'Diary', icon: BookOpen },
        ].filter(item => isMasterUser || enabledTabs.includes(item.value)),
      },
      {
        group: 'Utilities',
        icon: Settings,
        color: 'text-muted-foreground',
        items: [
          { value: 'directions', label: 'Site Directions', icon: Map },
        ].filter(item => isMasterUser || enabledTabs.includes(item.value)),
      },
      {
        group: 'Account Settings',
        icon: UserCog,
        color: 'text-slate-500',
        items: [
          { value: 'settings', label: 'Hub Management', icon: ShieldX },
        ],
      },
    ];

    if (isMasterUser) {
      groups.push({
        group: 'Master Control',
        icon: Settings,
        color: 'text-primary',
        items: [
          { value: 'admin', label: 'Manage Clients', icon: Globe },
        ],
      });
    }

    return groups.filter(g => g.items.length > 0);
  }, [isMasterUser, activeProfile]);

  const activeTabInfo = useMemo(() => {
      for (const group of menuGroups) {
          const item = group.items.find(i => i.value === activeTab);
          if (item) return { ...item, groupColor: group.color };
      }
      return undefined;
  }, [activeTab, menuGroups]);

  // --- Handlers (Scoped to Hub) ---
  const handleAddSite = (siteName: string) => {
    if (!sitesRef) return;
    const newDocRef = doc(sitesRef);
    setDocumentNonBlocking(newDocRef, {
      id: newDocRef.id,
      name: siteName,
      status: 'No Concerns',
      userProfileId: activeProfileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
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
    setDocumentNonBlocking(newDocRef, {
      id: newDocRef.id,
      name: cleanerName,
      rating: 'No Concerns',
      holidayAllowance: 20,
      userProfileId: activeProfileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  };

  const handleUpdateCleaner = (cleanerId: string, updatedData: Partial<Omit<Cleaner, 'id'>>) => {
    if (!cleanersRef) return;
    updateDocumentNonBlocking(doc(cleanersRef, cleanerId), { ...updatedData, updatedAt: new Date().toISOString() });
  };

  const handleRemoveCleaner = (cleanerId: string) => {
    if (!cleanersRef) return;
    deleteDocumentNonBlocking(doc(cleanersRef, cleanerId));
  };

  const handleAddActionPlan = (plan: ActionPlan) => {
    if (!actionPlansRef) return;
    setDocumentNonBlocking(doc(actionPlansRef, plan.id), plan, { merge: true });
  };

  const handleUpdateActionPlan = (plan: ActionPlan) => {
    if (!actionPlansRef) return;
    updateDocumentNonBlocking(doc(actionPlansRef, plan.id), plan);
  };

  const handleRemoveActionPlan = (planId: string) => {
    if (!actionPlansRef) return;
    deleteDocumentNonBlocking(doc(actionPlansRef, planId));
  };

  // --- Account Management Logic ---
  const handleDeactivate = async () => {
    if (!activeProfileId) return;
    await updateDoc(doc(firestore, 'userProfiles', activeProfileId), { 
      isDeactivated: true,
      updatedAt: new Date().toISOString()
    });
    signOut(auth);
  };

  const handleDeleteAllData = async () => {
    if (!activeProfileId || !firestore) return;
    const batch = writeBatch(firestore);
    
    // Collections to wipe
    const collectionsToWipe = [
      'sites', 'cleaners', 'cleaningScheduleEntries', 'audits', 'appointments', 
      'tasks', 'conversations', 'goodNews', 'supplyOrders', 'actionPlans', 'leave'
    ];

    for (const col of collectionsToWipe) {
      const colRef = collection(firestore, 'userProfiles', activeProfileId, col);
      const snapshot = await getDocs(colRef);
      snapshot.forEach(d => batch.delete(d.ref));
    }

    // Finally delete the profile
    batch.delete(doc(firestore, 'userProfiles', activeProfileId));
    
    await batch.commit();
    signOut(auth);
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Initializing CleanFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderAdminTab = () => (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary"><ShieldCheck className="h-6 w-6" /> Provision New Client Hub</CardTitle>
          <CardDescription>Enter the details below. Once created, the client can "Sign Up" with the email provided to claim their hub.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const email = formData.get('email') as string;
            if (!firestore) return;
            const hubId = `hub-${Date.now()}`;
            setDoc(doc(firestore, 'userProfiles', hubId), {
              id: hubId,
              name,
              email,
              members: {},
              enabledTabs: ALL_AVAILABLE_TABS.map(t => t.id),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDeactivated: false,
            });
            toast({ title: 'Hub Provisioned', description: `${name} created.` });
            (e.target as HTMLFormElement).reset();
          }} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label>Client/Business Name</Label>
              <Input name="name" placeholder="e.g. Acme Cleaning Services" required />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Client Email (Login ID)</Label>
              <Input name="email" type="email" placeholder="owner@client.com" required />
            </div>
            <Button type="submit" className="h-10 px-6"><Plus className="mr-2 h-4 w-4" /> Create Profile</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Client Hubs</CardTitle>
          <CardDescription>Manage existing accounts, features, and direct UID access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="border-b">
                  <th className="p-3 text-left">Hub Name</th>
                  <th className="p-3 text-left">Provisioned Email</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allHubs.map(hub => (
                  <tr key={hub.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{hub.name}</td>
                    <td className="p-3 text-muted-foreground">{hub.email}</td>
                    <td className="p-3 text-muted-foreground">{hub.createdAt ? format(parseISO(hub.createdAt), 'PP') : 'N/A'}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <TabConfigurationDialog hub={hub} onUpdate={(id, enabledTabs) => updateDoc(doc(firestore!, 'userProfiles', id), { enabledTabs })} />
                        <MemberManagementDialog hub={hub} onUpdate={(id, members) => updateDoc(doc(firestore!, 'userProfiles', id), { members })} />
                        <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setSelectedHubId(hub.id)}>Access</Button>
                        {hub.id !== activeProfileId && hub.id !== `hub-${user.uid}` && (
                          <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(firestore!, 'userProfiles', hub.id))} className="text-destructive h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveTab = () => {
    if (activeTab === 'admin' && isMasterUser) return renderAdminTab();
    switch (activeTab) {
        case 'settings':
            return <AccountSettingsTab userProfile={activeProfile!} onDeactivate={handleDeactivate} onDeleteData={handleDeleteAllData} />;
        case 'sites':
            return <SitesTab sites={sites} onNoteChange={handleUpdateSite} onAddSite={handleAddSite} onEditSite={(id, name) => handleUpdateSite(id, { name })} onRemoveSite={handleRemoveSite} />;
        case 'cleaners':
            return <CleanersTab cleaners={cleaners} onUpdateCleaner={handleUpdateCleaner} onAddCleaner={handleAddCleaner} onRemoveCleaner={handleRemoveCleaner} />;
        case 'availability':
            return <AvailabilityTab cleaners={cleaners} onUpdateCleaner={handleUpdateCleaner} />;
        case 'company-schedule':
            return <CompanyScheduleTab schedule={schedule} sites={sites} cleaners={cleaners} onAdd={(e) => setDocumentNonBlocking(doc(scheduleRef!), { ...e, id: doc(scheduleRef!).id }, { merge: true })} onUpdate={(id, data) => updateDocumentNonBlocking(doc(scheduleRef!, id), data)} onRemove={(id) => deleteDocumentNonBlocking(doc(scheduleRef!, id))} />;
        case 'leave-calendar':
            return <LeaveCalendarTab cleaners={cleaners} leave={leave} schedule={schedule} onAddLeave={(e) => setDocumentNonBlocking(doc(leaveRef!), { ...e, id: doc(leaveRef!).id, coverAssignments: [] }, { merge: true })} onDeleteLeave={(e) => deleteDocumentNonBlocking(doc(leaveRef!, e.id))} onUpdateLeave={(id, data) => updateDocumentNonBlocking(doc(leaveRef!, id), data)} />;
        case 'monthly-leave':
            return <MonthlyLeaveCalendar leave={leave} />;
        case 'risk':
            return <RiskDashboardTab sites={sites} cleaners={cleaners} />;
        case 'action-plan':
            return <ActionPlanTab sites={sites} cleaners={cleaners} actionPlans={actionPlans} onUpdateActionPlan={(p) => actionPlans.some(ap => ap.id === p.id) ? handleUpdateActionPlan(p) : handleAddActionPlan(p)} onRemoveActionPlan={handleRemoveActionPlan} />;
        case 'gold-standard':
            return <GoldStandardTab sites={sites} cleaners={cleaners} />;
        case 'audits':
            return <AuditsTab sites={sites} monthlyAudits={audits} onSetAudit={(siteId, date, data) => {
                const id = `${siteId}-${date.getFullYear()}-${date.getMonth() + 1}`;
                setDocumentNonBlocking(doc(auditsRef!), { ...data, id, siteId, year: date.getFullYear(), month: date.getMonth() + 1 }, { merge: true });
            }} />;
        case 'audit-history':
            return <AuditHistoryTab sites={sites} monthlyAudits={audits} />;
        case 'good-news':
            return <GoodNewsCentreTab records={goodNews} cleaners={cleaners} sites={sites} onAddRecord={(e) => setDocumentNonBlocking(doc(goodNewsRef!), { ...e, id: doc(goodNewsRef!).id }, { merge: true })} onUpdateRecord={(id, data) => updateDocumentNonBlocking(doc(goodNewsRef!, id), data)} onRemoveRecord={(id) => deleteDocumentNonBlocking(doc(goodNewsRef!, id))} />;
        case 'supplies':
            return <SuppliesTab sites={sites} supplyOrders={supplyOrders} firestore={firestore} activeProfileId={activeProfileId!} onSetOrder={(siteId, consumableId, date, quantity) => {
                const id = `${siteId}-${consumableId}-${date.getFullYear()}-${date.getMonth() + 1}`;
                setDocumentNonBlocking(doc(supplyOrdersRef!, id), { id, siteId, consumableId, year: date.getFullYear(), month: date.getMonth() + 1, quantity }, { merge: true });
            }} onAddConsumable={(siteId, data) => setDocumentNonBlocking(doc(collection(firestore!, 'userProfiles', activeProfileId!, 'sites', siteId, 'consumables')), { ...data, id: doc(collection(firestore!, 'userProfiles', activeProfileId!, 'sites', siteId, 'consumables')).id }, { merge: true })} onEditConsumable={(siteId, consumableId, data) => updateDocumentNonBlocking(doc(firestore!, 'userProfiles', activeProfileId!, 'sites', siteId, 'consumables', consumableId), data)} onRemoveConsumable={(siteId, consumableId) => deleteDocumentNonBlocking(doc(firestore!, 'userProfiles', activeProfileId!, 'sites', siteId, 'consumables', consumableId))} />;
        case 'tasks':
            return <TasksTab tasks={tasks} sites={sites} onAddTask={(e) => setDocumentNonBlocking(doc(tasksRef!), { ...e, id: doc(tasksRef!).id, completed: false }, { merge: true })} onUpdateTask={(id, data) => updateDocumentNonBlocking(doc(tasksRef!, id), data)} onRemoveTask={(id) => deleteDocumentNonBlocking(doc(tasksRef!, id))} />;
        case 'diary':
            return <DiaryTab sites={sites} appointments={appointments} monthlyAudits={audits} leave={leave} schedule={schedule} onAddAppointment={(e) => setDocumentNonBlocking(doc(appointmentsRef!), { ...e, id: doc(appointmentsRef!).id, title: e.title || '', date: e.date || '', assignee: e.assignee || '', site: e.site || null, startTime: e.startTime || null, endTime: e.endTime || null, notes: e.notes || null, recurrence: e.recurrence || 'none', recurrenceEndDate: e.recurrenceEndDate || null }, { merge: true })} onUpdateAppointment={(id, data) => updateDocumentNonBlocking(doc(appointmentsRef!, id), data)} onRemoveAppointment={(id) => deleteDocumentNonBlocking(doc(appointmentsRef!, id))} />;
        case 'directions':
            return <SiteMapTab sites={sites} />;
        case 'portfolio':
            return <SitePortfolioTab sites={sites} cleaners={cleaners} schedule={schedule} actionPlans={actionPlans} monthlyAudits={audits} tasks={tasks} appointments={appointments} onUpdateSite={handleUpdateSite} onUpdateTask={(id, d) => updateDocumentNonBlocking(doc(tasksRef!, id), d)} onRemoveTask={(id) => deleteDocumentNonBlocking(doc(tasksRef!, id))} onAddAppointment={(e) => setDocumentNonBlocking(doc(appointmentsRef!), { ...e, id: doc(appointmentsRef!).id, title: e.title || '', date: e.date || '', assignee: e.assignee || '', site: e.site || null, startTime: e.startTime || null, endTime: e.endTime || null, notes: e.notes || null, recurrence: e.recurrence || 'none', recurrenceEndDate: e.recurrenceEndDate || null }, { merge: true })} onUpdateAppointment={(id, d) => updateDocumentNonBlocking(doc(appointmentsRef!, id), d)} onRemoveAppointment={(id) => deleteDocumentNonBlocking(doc(appointmentsRef!, id))} onAddScheduleEntry={(e) => setDocumentNonBlocking(doc(scheduleRef!), { ...e, id: doc(scheduleRef!).id }, { merge: true })} onUpdateScheduleEntry={(id, d) => updateDocumentNonBlocking(doc(scheduleRef!, id), d)} onRemoveScheduleEntry={(id) => deleteDocumentNonBlocking(doc(scheduleRef!, id))} />;
        default:
            return <DailySummaryTab sites={sites} cleaners={cleaners} actionPlans={actionPlans} schedule={schedule} leave={leave} />;
    }
  };

  return (
    <SidebarProvider>
        <FirebaseErrorListener />
        <Sidebar collapsible={isMobile ? 'offcanvas' : 'icon'}>
            <SidebarHeader className="border-b pb-4">
                <div className="flex items-center gap-3 p-2">
                    <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-md">C</div>
                    <div className='flex flex-col overflow-hidden'>
                        <h1 className="text-lg font-bold tracking-tight text-foreground leading-none mb-1">CleanFlow</h1>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest">Enterprise v1.0</span>
                    </div>
                </div>
                {isMasterUser && allHubs.length > 0 && (
                  <div className="px-2 mt-2">
                    <Select value={selectedHubId || ''} onValueChange={setSelectedHubId}>
                      <SelectTrigger className="h-8 text-xs bg-muted/50 border-none">
                        <Building2 className="mr-2 h-3 w-3" />
                        <SelectValue placeholder="Select Hub" />
                      </SelectTrigger>
                      <SelectContent>
                        {allHubs.map(hub => (
                          <SelectItem key={hub.id} value={hub.id} className="text-xs">{hub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu className="px-2 mt-4">
                  {menuGroups.map((group) => (
                      <Collapsible
                          key={group.group}
                          open={openCollapsibles.includes(group.group)}
                          onOpenChange={(isOpen) =>
                              setOpenCollapsibles((prev) =>
                                  isOpen ? [...prev, group.group] : prev.filter((g) => g !== group.group)
                              )
                          }
                          className="w-full mb-2"
                      >
                          <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                  <SidebarMenuButton className="justify-between w-full hover:bg-muted/50">
                                      <div className={cn("flex items-center gap-2 font-semibold", group.color)}>
                                          <group.icon className="h-4 w-4" />
                                          <span>{group.group}</span>
                                      </div>
                                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" style={{ transform: openCollapsibles.includes(group.group) ? 'rotate(90deg)' : 'none' }}/>
                                  </SidebarMenuButton>
                              </CollapsibleTrigger>
                          </SidebarMenuItem>
                          <CollapsibleContent>
                              <SidebarMenuSub className="ml-4 border-l border-primary/10">
                                  {group.items.map((item) => (
                                      <SidebarMenuItem key={item.value}>
                                          <SidebarMenuButton
                                              onClick={() => setActiveTab(item.value)}
                                              isActive={activeTab === item.value}
                                              className="justify-start w-full"
                                              tooltip={item.label}
                                          >
                                              <item.icon className={cn("h-4 w-4", activeTab === item.value && group.color)} />
                                              <span className={cn(activeTab === item.value && "font-bold")}>{item.label}</span>
                                          </SidebarMenuButton>
                                      </SidebarMenuItem>
                                  ))}
                              </SidebarMenuSub>
                          </CollapsibleContent>
                      </Collapsible>
                  ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t bg-muted/20">
                <div className="mb-4 px-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">User Account</p>
                  <p className="text-xs font-medium truncate">{user.email}</p>
                </div>
                <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20" onClick={() => signOut(auth)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="sm:hidden" />
                    <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">{activeProfile?.name || 'Loading Hub...'}</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    {activeTabInfo?.icon && <activeTabInfo.icon className={cn("h-5 w-5", activeTabInfo.groupColor)} />}
                    <h2 className="font-bold text-lg tracking-tight">{activeTabInfo?.label}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {isMasterUser && <div className="hidden md:flex bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-tighter">Master Key Active</div>}
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/5">
                <div className="w-full max-w-7xl mx-auto">
                    {activeProfile ? renderActiveTab() : (
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    )}
                </div>
            </main>
        </SidebarInset>
        <Toaster />
    </SidebarProvider>
  );
}
