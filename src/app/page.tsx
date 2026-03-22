'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, ClipboardList, CalendarDays, Globe, Building2, Trash2, UserPlus, LogIn, LogOut, Loader2, Settings, Plus, ChevronRight, Clock, Award, ShieldCheck, UserCog, CheckSquare, MessageSquare, Heart, ClipboardCheck, History as LucideHistory, Package, Map as LucideMap, BookOpen, Layers, ShieldX, Zap, Rocket } from 'lucide-react';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const MASTER_EMAILS = ['clean@flow.com', 'clean@flow.co.uk'];
const RESTORATION_TARGETS = ['owen@newton.com', 'owen.newton@excellerateservices.com'];
const CURRENT_RESTORATION_VERSION = 8;

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
  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: 'Account Created', description: 'Welcome to Managers Matrix!' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: isSignUp ? 'Sign Up Failed' : 'Login Failed',
        description: error.message,
      });
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    signInWithEmailAndPassword(auth, 'owen@newton.com', 'password123')
      .catch((error: any) => {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          createUserWithEmailAndPassword(auth, 'owen@newton.com', 'password123')
            .catch((createError: any) => {
              setLoading(false);
              toast({ variant: 'destructive', title: 'Demo Failed', description: createError.message });
            });
        } else {
          setLoading(false);
          toast({ variant: 'destructive', title: 'Demo Failed', description: error.message });
        }
      });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#020617] p-4 gap-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1),transparent_50%)] pointer-events-none" />
      
      <Button 
        variant="outline" 
        className="w-full max-w-[400px] border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 h-12 text-xs font-black tracking-[0.2em] uppercase z-10"
        onClick={handleDemoLogin}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="mr-2 h-4 w-4" />
        )}
        Launch Demo Account
      </Button>

      <Card className="w-full max-w-[400px] border-none bg-white/5 backdrop-blur-xl shadow-2xl p-8 rounded-2xl relative z-10 border border-white/10">
        <div className="flex flex-col items-center gap-8">
          {logo ? (
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500 opacity-50" />
              <Image 
                src={logo.imageUrl} 
                alt="Managers Matrix Logo" 
                width={240} 
                height={240} 
                className="object-contain mb-2 relative"
                data-ai-hint={logo.imageHint}
              />
            </div>
          ) : (
            <div className="h-32 w-32 flex items-center justify-center text-primary font-black text-7xl bg-primary/10 rounded-3xl">
              M
            </div>
          )}
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tighter text-white uppercase italic">Managers Matrix</h1>
            <p className="text-[10px] text-primary font-black tracking-[0.25em] uppercase opacity-80">POWERED BY HARLEY: WORK SMARTER</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black text-muted-foreground/60 ml-1 uppercase tracking-widest">Access Point ID</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder="name@matrix.ai" 
                  className="bg-black/40 border-white/5 focus:border-primary/50 h-12 rounded-xl focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black text-muted-foreground/60 ml-1 uppercase tracking-widest">Encryption Key</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="bg-black/40 border-white/5 focus:border-primary/50 h-12 rounded-xl focus:ring-primary/20"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 bg-primary text-black hover:bg-primary/90 font-black tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-5 w-5" />
              )}
              {isSignUp ? 'Initialize' : 'Sign In'}
            </Button>
          </form>

          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] text-primary hover:text-primary/80 font-black tracking-widest uppercase"
          >
            {isSignUp ? "Existing Terminal? Link Here" : "New Terminal? Provision Here"}
          </button>
        </div>
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
      <DialogContent className="max-w-2xl bg-[#0f172a] border-white/10">
        <DialogHeader>
          <DialogTitle>Configure Matrix Nodes: {hub.name}</DialogTitle>
          <DialogDescription>Select which processing nodes are visible for this terminal.</DialogDescription>
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
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-primary border-b border-white/5 pb-1">{group}</h4>
              <div className="space-y-2">
                {tabs.map(tab => (
                  <div key={tab.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`tab-${hub.id}-${tab.id}`} 
                      checked={enabledTabs.includes(tab.id)} 
                      onCheckedChange={() => toggleTab(tab.id)}
                    />
                    <Label htmlFor={`tab-${hub.id}-${tab.id}`} className="text-xs font-bold leading-none cursor-pointer uppercase tracking-tight">{tab.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button onClick={handleSave} className="bg-primary text-black font-black uppercase text-xs">Commit Configuration</Button></DialogClose>
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
        <Button variant="ghost" size="sm" className="h-8 px-2"><UserCog className="mr-2 h-4 w-4" /> Access</Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0f172a] border-white/10">
        <DialogHeader>
          <DialogTitle>Terminal Authorization: {hub.name}</DialogTitle>
          <DialogDescription>Link Firebase Access Tokens to this processing hub.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-[10px] uppercase font-black">User UID</Label>
              <Input value={newUid} onChange={e => setNewUid(e.target.value)} placeholder="e.g. sWN2W9Cbz..." className="bg-black/40" />
            </div>
            <div className="w-32 space-y-2">
              <Label className="text-[10px] uppercase font-black">Clearance</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-black/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} size="icon" className="bg-primary text-black"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="border border-white/10 rounded-xl divide-y divide-white/5 max-h-64 overflow-auto bg-black/20">
            {Object.entries(hub.members || {}).map(([uid, role]) => (
              <div key={uid} className="flex items-center justify-between p-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-muted-foreground">{uid}</span>
                  <span className="font-black text-primary uppercase text-[9px] tracking-widest">{role}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(uid)} className="text-destructive/70 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            {Object.keys(hub.members || {}).length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-[10px] uppercase font-black tracking-widest">No terminal links active.</div>
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
  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');
  const restorationStarted = useRef(false);

  const isMasterUser = useMemo(() => user?.email && MASTER_EMAILS.includes(user.email.toLowerCase()), [user]);

  // --- Hub Orchestration ---
  const profilesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (isMasterUser) return collection(firestore, 'userProfiles');
    return query(collection(firestore, 'userProfiles'), where(`members.${user.uid}`, '!=', null));
  }, [firestore, user, isMasterUser]);

  const { data: allHubsResult, isLoading: isProfileLoading } = useCollection<UserProfile>(profilesQuery);
  const allHubs = allHubsResult || [];
  
  const activeProfile = useMemo(() => {
    if (allHubs.length === 0) return null;
    if (selectedHubId) return allHubs.find(h => h.id === selectedHubId) || allHubs[0];
    return allHubs[0] || null;
  }, [allHubs, selectedHubId]);

  const activeProfileId = activeProfile?.id;

  useEffect(() => {
    if (activeProfileId && !selectedHubId) {
      setSelectedHubId(activeProfileId);
    }
  }, [activeProfileId, selectedHubId]);

  useEffect(() => {
    if (!isProfileLoading && user && firestore) {
      const email = user.email?.toLowerCase();
      const isTargetEmail = email && RESTORATION_TARGETS.includes(email);
      const targetHubId = allHubs.find(h => h.email?.toLowerCase() === email)?.id || `hub-${user.uid}`;
      const profileRef = doc(firestore, 'userProfiles', targetHubId);

      const performRestoration = async () => {
        toast({ title: 'Initializing AI Matrix Recovery...', description: 'Synching Lot 4 dataset for March 2026. Stand by.' });
        try {
          await restoreProfessionalData(firestore, targetHubId);
          await updateDoc(profileRef, { restorationVersion: CURRENT_RESTORATION_VERSION, updatedAt: new Date().toISOString() });
          toast({ title: 'Matrix Synched', description: 'Lot 4 environment recovery complete.' });
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: profileRef.path,
              operation: 'update',
              requestResourceData: { restorationVersion: CURRENT_RESTORATION_VERSION, updatedAt: new Date().toISOString() }
            }));
          }
        }
      };

      const existingHub = allHubs.find(h => h.id === targetHubId);

      if (!existingHub) {
        const newProfileData = {
          id: targetHubId,
          name: isTargetEmail ? "EXCELLERATE AI - LOT 4" : (isMasterUser ? "ENTERPRISE CORE MATRIX" : `${user.email?.split('@')[0].toUpperCase()}'S MATRIX`),
          email: user.email,
          members: { [user.uid]: 'owner' },
          enabledTabs: ALL_AVAILABLE_TABS.map(t => t.id),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeactivated: false,
          restorationVersion: isTargetEmail ? CURRENT_RESTORATION_VERSION : 0
        };
        setDoc(profileRef, newProfileData, { merge: true }).then(() => {
          if (isTargetEmail) performRestoration();
        }).catch((error: any) => {
          if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: profileRef.path,
              operation: 'create',
              requestResourceData: newProfileData
            }));
          }
        });
      } else {
        if (isTargetEmail && !restorationStarted.current && (existingHub.restorationVersion || 0) < CURRENT_RESTORATION_VERSION) {
          restorationStarted.current = true;
          performRestoration();
        }
        if (existingHub.isDeactivated) {
          updateDoc(profileRef, { isDeactivated: false, updatedAt: new Date().toISOString() }).then(() => {
            toast({ title: 'Terminal Online', description: 'Matrix core reactivated.' });
          });
        }
        if (!existingHub.members || !existingHub.members[user.uid]) {
          updateDoc(profileRef, { [`members.${user.uid}`]: 'owner', updatedAt: new Date().toISOString() });
        }
      }
    }
  }, [isProfileLoading, user, allHubs, firestore, isMasterUser, toast]);

  // --- Hub-Scoped Data Hooks ---
  const sitesRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'sites') : null, [firestore, activeProfileId]);
  const cleanersRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'cleaners') : null, [firestore, activeProfileId]);
  const scheduleRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'cleaningScheduleEntries') : null, [firestore, activeProfileId]);
  const auditsRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'audits') : null, [firestore, activeProfileId]);
  const appointmentsRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'appointments') : null, [firestore, activeProfileId]);
  const tasksRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'tasks') : null, [firestore, activeProfileId]);
  const conversationsRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'conversations') : null, [firestore, activeProfileId]);
  const goodNewsRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'goodNews') : null, [firestore, activeProfileId]);
  const supplyOrdersRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'supplyOrders') : null, [firestore, activeProfileId]);
  const actionPlansRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'actionPlans') : null, [firestore, activeProfileId]);
  const leaveRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'leave') : null, [firestore, activeProfileId]);

  const rawSites = useCollection<Site>(sitesRef).data || [];
  const rawCleaners = useCollection<Cleaner>(cleanersRef).data || [];
  
  const sites = useMemo(() => {
    const unique = new globalThis.Map<string, Site>();
    rawSites.forEach(s => {
      const key = s.name.toLowerCase().trim();
      if (!unique.has(key)) unique.set(key, s);
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rawSites]);

  const cleaners = useMemo(() => {
    const unique = new globalThis.Map<string, Cleaner>();
    rawCleaners.forEach(c => {
      const key = c.name.toLowerCase().trim();
      if (!unique.has(key)) unique.set(key, c);
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rawCleaners]);

  const schedule = useCollection<ScheduleEntry>(scheduleRef).data || [];
  const audits = useCollection<MonthlyAudit>(auditsRef).data || [];
  const appointments = useCollection<Appointment>(appointmentsRef).data || [];
  const tasks = useCollection<Task>(tasksRef).data || [];
  const conversations = useCollection<ConversationRecord>(conversationsRef).data || [];
  const goodNews = useCollection<GoodNewsRecord>(goodNewsRef).data || [];
  const supplyOrders = useCollection<MonthlySupplyOrder>(supplyOrdersRef).data || [];
  const actionPlans = useCollection<ActionPlan>(actionPlansRef).data || [];
  const leave = useCollection<Leave>(leaveRef).data || [];

  // --- Handlers ---
  const handleAddSite = useCallback((siteName: string) => {
    if (!sitesRef || !activeProfileId) return;
    const newDocRef = doc(sitesRef);
    setDocumentNonBlocking(newDocRef, {
      id: newDocRef.id,
      name: siteName,
      status: 'No Concerns',
      userProfileId: activeProfileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }, [sitesRef, activeProfileId]);

  const handleUpdateSite = useCallback((siteId: string, updatedData: Partial<Omit<Site, 'id'>>) => {
    if (!sitesRef) return;
    updateDocumentNonBlocking(doc(sitesRef, siteId), { ...updatedData, updatedAt: new Date().toISOString() });
  }, [sitesRef]);

  const handleRemoveSite = useCallback((siteId: string) => {
    if (!sitesRef) return;
    deleteDocumentNonBlocking(doc(sitesRef, siteId));
  }, [sitesRef]);

  const handleAddCleaner = useCallback((cleanerName: string) => {
    if (!cleanersRef || !activeProfileId) return;
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
  }, [cleanersRef, activeProfileId]);

  const handleUpdateCleaner = useCallback((cleanerId: string, updatedData: Partial<Omit<Cleaner, 'id'>>) => {
    if (!cleanersRef) return;
    updateDocumentNonBlocking(doc(cleanersRef, cleanerId), { ...updatedData, updatedAt: new Date().toISOString() });
  }, [cleanersRef]);

  const handleRemoveCleaner = useCallback((cleanerId: string) => {
    if (!cleanersRef) return;
    deleteDocumentNonBlocking(doc(cleanersRef, cleanerId));
  }, [cleanersRef]);

  const handleAddActionPlan = useCallback((plan: ActionPlan) => {
    if (!actionPlansRef) return;
    setDocumentNonBlocking(doc(actionPlansRef, plan.id), plan, { merge: true });
  }, [actionPlansRef]);

  const handleUpdateActionPlan = useCallback((plan: ActionPlan) => {
    if (!actionPlansRef) return;
    updateDocumentNonBlocking(doc(actionPlansRef, plan.id), plan);
  }, [actionPlansRef]);

  const handleRemoveActionPlan = useCallback((planId: string) => {
    if (!actionPlansRef) return;
    deleteDocumentNonBlocking(doc(actionPlansRef, planId));
  }, [actionPlansRef]);

  const handleDeactivate = async () => {
    if (!activeProfileId) return;
    const updateData = { isDeactivated: true, updatedAt: new Date().toISOString() };
    const profileRef = doc(firestore!, 'userProfiles', activeProfileId);
    try {
      await updateDoc(profileRef, updateData);
      signOut(auth);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: profileRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      }
    }
  };

  const handleDeleteAllData = async () => {
    if (!activeProfileId || !firestore) return;
    const batch = writeBatch(firestore);
    const collectionsToWipe = ['sites', 'cleaners', 'cleaningScheduleEntries', 'audits', 'appointments', 'tasks', 'conversations', 'goodNews', 'supplyOrders', 'actionPlans', 'leave'];

    try {
      for (const col of collectionsToWipe) {
        const colRef = collection(firestore, 'userProfiles', activeProfileId, col);
        const snapshot = await getDocs(colRef);
        snapshot.forEach(d => batch.delete(d.ref));
      }
      const profileRef = doc(firestore, 'userProfiles', activeProfileId);
      batch.delete(profileRef);
      await batch.commit();
      signOut(auth);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    }
  };

  // --- Navigation ---
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
          { value: 'audit-history', label: 'Audit History', icon: LucideHistory },
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
          { value: 'directions', label: 'Site Directions', icon: LucideMap },
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

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin text-primary relative" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-white font-black tracking-widest uppercase text-xs animate-pulse">Initializing Matrix Core</p>
            <p className="text-primary/60 font-bold uppercase text-[8px] tracking-[0.3em]">Harley AI Verification Active</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderAdminTab = () => (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary uppercase font-black tracking-tighter"><ShieldCheck className="h-6 w-6" /> Provision Matrix Node</CardTitle>
          <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">Authorize new client terminal for deployment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const email = formData.get('email') as string;
            if (!firestore) return;
            const hubId = `hub-${Date.now()}`;
            const newHubData = {
              id: hubId,
              name,
              email,
              members: {},
              enabledTabs: ALL_AVAILABLE_TABS.map(t => t.id),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDeactivated: false,
            };
            const hubRef = doc(firestore, 'userProfiles', hubId);
            setDoc(hubRef, newHubData).catch((error: any) => {
              if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                  path: hubRef.path,
                  operation: 'create',
                  requestResourceData: newHubData
                }));
              }
            });
            toast({ title: 'Hub Provisioned', description: `${name} matrix node active.` });
            (e.target as HTMLFormElement).reset();
          }} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label className="text-[10px] uppercase font-black">Business Entity</Label>
              <Input name="name" placeholder="e.g. CORE ANALYTICS" className="bg-black/40 h-11" required />
            </div>
            <div className="space-y-2 flex-1">
              <Label className="text-[10px] uppercase font-black">Authorized Email</Label>
              <Input name="email" type="email" placeholder="admin@matrix.ai" className="bg-black/40 h-11" required />
            </div>
            <Button type="submit" className="h-11 px-8 bg-primary text-black font-black uppercase text-xs tracking-widest"><Plus className="mr-2 h-4 w-4" /> Provision</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="uppercase font-black tracking-tighter">Active Matrix Hubs</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Manage neural links and terminal nodes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
            <table className="w-full text-sm">
              <thead className="bg-white/5 uppercase text-[9px] font-black tracking-[0.2em] text-muted-foreground">
                <tr className="border-b border-white/5">
                  <th className="p-4 text-left">Entity Name</th>
                  <th className="p-4 text-left">Access Link</th>
                  <th className="p-4 text-left">Deployment</th>
                  <th className="p-4 text-right">Core Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allHubs.map(hub => (
                  <tr key={hub.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-black uppercase text-xs tracking-tight">{hub.name}</td>
                    <td className="p-4 text-xs font-mono text-muted-foreground">{hub.email}</td>
                    <td className="p-4 text-[10px] font-bold text-muted-foreground">{hub.createdAt ? format(parseISO(hub.createdAt), 'PP') : 'N/A'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <TabConfigurationDialog hub={hub} onUpdate={(id, enabledTabs) => {
                          const ref = doc(firestore!, 'userProfiles', id);
                          updateDoc(ref, { enabledTabs }).catch(e => {
                            if (e.code === 'permission-denied') {
                              errorEmitter.emit('permission-error', new FirestorePermissionError({
                                path: ref.path,
                                operation: 'update',
                                requestResourceData: { enabledTabs }
                              }));
                            }
                          });
                        }} />
                        <MemberManagementDialog hub={hub} onUpdate={(id, members) => {
                          const ref = doc(firestore!, 'userProfiles', id);
                          updateDoc(ref, { members }).catch(e => {
                            if (e.code === 'permission-denied') {
                              errorEmitter.emit('permission-error', new FirestorePermissionError({
                                path: ref.path,
                                operation: 'update',
                                requestResourceData: { members }
                              }));
                            }
                          });
                        }} />
                        <Button variant="outline" size="sm" className="h-8 px-4 text-[10px] font-black uppercase border-primary/20 hover:bg-primary/10" onClick={() => setSelectedHubId(hub.id)}>Synch</Button>
                        {hub.id !== activeProfileId && hub.id !== `hub-${user.uid}` && (
                          <Button variant="ghost" size="icon" onClick={() => {
                            const ref = doc(firestore!, 'userProfiles', hub.id);
                            deleteDoc(ref).catch(e => {
                              if (e.code === 'permission-denied') {
                                errorEmitter.emit('permission-error', new FirestorePermissionError({
                                  path: ref.path,
                                  operation: 'delete'
                                }));
                              }
                            });
                          }} className="text-destructive/60 hover:text-destructive h-8 w-8">
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
            return <SitePortfolioTab sites={sites} cleaners={cleaners} schedule={schedule} actionPlans={actionPlans} monthlyAudits={audits} tasks={tasks} appointments={appointments} onUpdateSite={handleUpdateSite} onAddTask={(e) => setDocumentNonBlocking(doc(tasksRef!), { ...e, id: doc(tasksRef!).id, completed: false }, { merge: true })} onUpdateTask={(id, d) => updateDocumentNonBlocking(doc(tasksRef!, id), d)} onRemoveTask={(id) => deleteDocumentNonBlocking(doc(tasksRef!, id))} onAddAppointment={(e) => setDocumentNonBlocking(doc(appointmentsRef!), { ...e, id: doc(appointmentsRef!).id, title: e.title || '', date: e.date || '', assignee: e.assignee || '', site: e.site || null, startTime: e.startTime || null, endTime: e.endTime || null, notes: e.notes || null, recurrence: e.recurrence || 'none', recurrenceEndDate: e.recurrenceEndDate || null }, { merge: true })} onUpdateAppointment={(id, d) => updateDocumentNonBlocking(doc(appointmentsRef!, id), d)} onRemoveAppointment={(id) => deleteDocumentNonBlocking(doc(appointmentsRef!, id))} onAddScheduleEntry={(e) => setDocumentNonBlocking(doc(scheduleRef!), { ...e, id: doc(scheduleRef!).id }, { merge: true })} onUpdateScheduleEntry={(id, d) => updateDocumentNonBlocking(doc(scheduleRef!, id), d)} onRemoveScheduleEntry={(id) => deleteDocumentNonBlocking(doc(scheduleRef!, id))} />;
        default:
            return <DailySummaryTab sites={sites} cleaners={cleaners} actionPlans={actionPlans} schedule={schedule} leave={leave} />;
    }
  };

  return (
    <SidebarProvider>
        <FirebaseErrorListener />
        <Sidebar collapsible={isMobile ? 'offcanvas' : 'icon'} className="border-r border-white/5">
            <SidebarHeader className="border-b border-white/5 pb-6">
                <div className="flex items-center gap-4 p-2">
                    {logo ? (
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/10 blur-lg rounded-full" />
                        <Image 
                          src={logo.imageUrl} 
                          alt="Managers Matrix Logo" 
                          width={72} 
                          height={72} 
                          className="object-contain relative"
                          data-ai-hint={logo.imageHint}
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 flex items-center justify-center text-primary font-black text-4xl bg-primary/10 rounded-xl">M</div>
                    )}
                    <div className='flex flex-col overflow-hidden'>
                        <h1 className="text-sm font-black tracking-tight text-white leading-none mb-1 uppercase italic">Managers Matrix</h1>
                        <span className="text-[7px] uppercase font-black text-primary tracking-[0.2em] leading-tight opacity-80">POWERED BY HARLEY</span>
                    </div>
                </div>
                {isMasterUser && allHubs.length > 0 && (
                  <div className="px-2 mt-2">
                    <Select value={selectedHubId || ''} onValueChange={setSelectedHubId}>
                      <SelectTrigger className="h-9 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10 rounded-lg">
                        <Building2 className="mr-2 h-3.5 w-3.5 text-primary" />
                        <SelectValue placeholder="Neural Node" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0f172a] border-white/10">
                        {allHubs.map(hub => (
                          <SelectItem key={hub.id} value={hub.id} className="text-[10px] font-bold uppercase tracking-tight">{hub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
            </SidebarHeader>
            <SidebarContent className="bg-black/20">
              <SidebarMenu className="px-3 mt-6">
                  {menuGroups.map((group) => (
                      <Collapsible
                          key={group.group}
                          open={openCollapsibles.includes(group.group)}
                          onOpenChange={(isOpen) =>
                              setOpenCollapsibles((prev) =>
                                  isOpen ? [...prev, group.group] : prev.filter((g) => g !== group.group)
                              )
                          }
                          className="w-full mb-3"
                      >
                          <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                  <SidebarMenuButton className="justify-between w-full hover:bg-white/5 rounded-xl px-3 h-10">
                                      <div className={cn("flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.15em]", group.color)}>
                                          <group.icon className="h-4 w-4" />
                                          <span>{group.group}</span>
                                      </div>
                                      <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 opacity-40" style={{ transform: openCollapsibles.includes(group.group) ? 'rotate(90deg)' : 'none' }}/>
                                  </SidebarMenuButton>
                              </CollapsibleTrigger>
                          </SidebarMenuItem>
                          <CollapsibleContent className="transition-all">
                              <SidebarMenuSub className="ml-4 mt-1 border-l-2 border-white/5 pl-2 space-y-1">
                                  {group.items.map((item) => (
                                      <SidebarMenuItem key={item.value}>
                                          <SidebarMenuButton
                                              onClick={() => setActiveTab(item.value)}
                                              isActive={activeTab === item.value}
                                              className="justify-start w-full rounded-lg h-9 px-3 text-[11px] font-bold tracking-tight uppercase transition-all duration-200 hover:pl-4"
                                              tooltip={item.label}
                                          >
                                              <item.icon className={cn("h-3.5 w-3.5", activeTab === item.value ? group.color : "opacity-40")} />
                                              <span className={cn(activeTab === item.value ? "text-white opacity-100" : "text-muted-foreground/60")}>{item.label}</span>
                                          </SidebarMenuButton>
                                      </SidebarMenuItem>
                                  ))}
                              </SidebarMenuSub>
                          </CollapsibleContent>
                      </Collapsible>
                  ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-white/5 bg-black/40">
                <div className="mb-4 px-2">
                  <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-1">Terminal Active</p>
                  <p className="text-[10px] font-bold text-white/60 truncate uppercase tracking-tight">{user.email}</p>
                </div>
                <Button variant="outline" className="w-full h-10 justify-start text-[10px] font-black uppercase tracking-widest text-muted-foreground border-white/5 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 rounded-xl" onClick={() => signOut(auth)}>
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Terminate
                </Button>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset className="tech-gradient">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-background/60 backdrop-blur-xl px-6 sm:px-10">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="sm:hidden" />
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.1em] text-white/80">{activeProfile?.name || 'Synching Hub...'}</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-30" />
                    </div>
                    <div className="flex items-center gap-2.5">
                      {activeTabInfo?.icon && <activeTabInfo.icon className={cn("h-5 w-5", activeTabInfo.groupColor)} />}
                      <h2 className="font-black text-lg tracking-tight uppercase italic">{activeTabInfo?.label}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Matrix Node Active</span>
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.1em]">POWERED BY HARLEY AI</span>
                  </div>
                  {isMasterUser && <div className="hidden lg:flex bg-primary text-black text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-lg shadow-primary/20">System Key</div>}
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-6 p-6 md:gap-10 md:p-10">
                <div className="w-full max-w-7xl mx-auto">
                    {activeProfile ? renderActiveTab() : (
                      <div className="flex flex-col items-center justify-center h-96 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                        <span className="text-[10px] font-black tracking-[0.3em] text-primary/40 uppercase">Mapping Neural Links</span>
                      </div>
                    )}
                </div>
            </main>
        </SidebarInset>
        <Toaster />
    </SidebarProvider>
  );
}
