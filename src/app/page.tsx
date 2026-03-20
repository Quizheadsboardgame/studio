
'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  type Site, 
  type Cleaner, 
  type ScheduleEntry, 
  type UserProfile
} from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutDashboard, Users, Calendar, ShieldAlert, FileText, ClipboardList, CalendarDays, Globe, Building2, Trash2, UserPlus, LogIn, LogOut, Loader2, Settings, Plus, ChevronRight, Clock, Award, ShieldCheck, UserCog } from 'lucide-react';
import SitesTab from '@/components/sites-tab';
import CleanersTab from '@/components/cleaners-tab';
import CompanyScheduleTab from '@/components/schedule-tab';
import RiskDashboardTab from '@/components/risk-dashboard-tab';
import DailySummaryTab from '@/components/daily-summary-tab';
import ActionPlanTab from '@/components/action-plan-tab';
import LeaveCalendarTab from '@/components/leave-calendar-tab';
import AvailabilityTab from '@/components/availability-tab';
import GoldStandardTab from '@/components/gold-standard-tab';
import { Toaster } from "@/components/ui/toaster";
import { format, parseISO } from 'date-fns';
import React from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarMenuSub, SidebarFooter } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';

const MASTER_EMAILS = ['clean@flow.com', 'clean@flow.co.uk'];

function LoginPage() {
  const [email, setEmail] = useState(MASTER_EMAILS[0]);
  const [password, setPassword] = useState('cleanflow');
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
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
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>(['Overview', 'Master Control']);

  const isMasterUser = useMemo(() => user?.email && MASTER_EMAILS.includes(user.email.toLowerCase()), [user]);

  // --- Hub Orchestration ---
  const profilesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (isMasterUser) return collection(firestore, 'userProfiles');
    return query(collection(firestore, 'userProfiles'), where(`members.${user.uid}`, '!=', null));
  }, [firestore, user, isMasterUser]);

  const { data: allHubs, isLoading: isProfileLoading } = useCollection<UserProfile>(profilesQuery);
  
  // Resolve active hub
  const activeProfile = useMemo(() => {
    if (!allHubs || allHubs.length === 0) return null;
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

  // Initial setup for new users (Auto-create first hub if none exist, or check for pre-provisioned ones)
  useEffect(() => {
    if (!isProfileLoading && user && (!allHubs || allHubs.length === 0)) {
      // Check if a Hub already exists for this email (Pre-provisioned by Master)
      const existingHubQuery = query(collection(firestore, 'userProfiles'), where('email', '==', user.email));
      // Since we can't easily wait for a one-time fetch inside useEffect without async, 
      // we'll rely on the subscription to handle it, but for the "No Hub Found" case:
      
      const newProfileId = `hub-${user.uid}`;
      const profileRef = doc(firestore, 'userProfiles', newProfileId);
      setDoc(profileRef, {
        id: newProfileId,
        name: isMasterUser ? "Main Enterprise Hub" : `${user.email?.split('@')[0]}'s Operations`,
        email: user.email,
        members: { [user.uid]: 'owner' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } else if (!isProfileLoading && user && allHubs && allHubs.length > 0) {
      // Auto-associate UID if user logs in but isn't explicitly in the members map yet (matched by email)
      allHubs.forEach(hub => {
        if (hub.email === user.email && !hub.members[user.uid]) {
          updateDoc(doc(firestore, 'userProfiles', hub.id), {
            [`members.${user.uid}`]: 'owner',
            updatedAt: new Date().toISOString()
          });
        }
      });
    }
  }, [isProfileLoading, user, allHubs, firestore, isMasterUser]);

  // --- Scoped Data Fetching ---
  const sitesRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'sites') : null, [firestore, activeProfileId]);
  const cleanersRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'cleaners') : null, [firestore, activeProfileId]);
  const scheduleRef = useMemoFirebase(() => activeProfileId ? collection(firestore, 'userProfiles', activeProfileId, 'cleaningScheduleEntries') : null, [firestore, activeProfileId]);
  
  const { data: sites = [] } = useCollection<Site>(sitesRef);
  const { data: cleaners = [] } = useCollection<Cleaner>(cleanersRef);
  const { data: schedule = [] } = useCollection<ScheduleEntry>(scheduleRef);

  // --- Hub Management Action ---
  const handleCreateHub = (name: string, ownerEmail: string) => {
    if (!firestore) return;
    const hubId = `hub-${Date.now()}`;
    const hubRef = doc(firestore, 'userProfiles', hubId);
    setDoc(hubRef, {
      id: hubId,
      name,
      email: ownerEmail,
      members: {}, // Client will be auto-added when they sign up with this email
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    toast({ title: 'Hub Provisioned', description: `${name} created. The client can now Sign Up with ${ownerEmail} to access it.` });
  };

  const handleUpdateHubMembers = (hubId: string, members: Record<string, string>) => {
    if (!firestore) return;
    updateDoc(doc(firestore, 'userProfiles', hubId), { members, updatedAt: new Date().toISOString() });
    toast({ title: 'Membership Updated' });
  };

  const handleDeleteHub = (hubId: string) => {
    if (!firestore || hubId === activeProfileId) return;
    deleteDoc(doc(firestore, 'userProfiles', hubId));
    toast({ title: 'Hub Removed' });
  };

  // --- Navigation Mapping ---
  const menuGroups = useMemo(() => {
    const groups = [
      {
        group: 'Overview',
        icon: LayoutDashboard,
        color: 'text-excellerate-orange',
        items: [
          { value: 'summary', label: 'Daily Summary', icon: FileText },
          { value: 'risk', label: 'Risk Dashboard', icon: ShieldAlert },
          { value: 'gold-standard', label: 'Gold Standard', icon: Award },
        ],
      },
      {
        group: 'Management',
        icon: Users,
        color: 'text-excellerate-blue',
        items: [
          { value: 'sites', label: 'Sites', icon: Building2 },
          { value: 'cleaners', label: 'Cleaners', icon: Users },
          { value: 'action-plan', label: 'Action Plans', icon: ClipboardList },
        ],
      },
      {
        group: 'Scheduling',
        icon: Calendar,
        color: 'text-excellerate-teal',
        items: [
          { value: 'company-schedule', label: 'Schedule', icon: Calendar },
          { value: 'leave-calendar', label: 'Leave & Cover', icon: CalendarDays },
          { value: 'availability', label: 'Availability', icon: Clock },
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

    return groups;
  }, [isMasterUser]);

  const activeTabInfo = useMemo(() => {
      for (const group of menuGroups) {
          const item = group.items.find(i => i.value === activeTab);
          if (item) return { ...item, groupColor: group.color };
      }
      return undefined;
  }, [activeTab, menuGroups]);

  // --- Firestore Handlers (Scoped to Hub) ---
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
    });
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
            handleCreateHub(formData.get('name') as string, formData.get('email') as string);
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
          <CardDescription>Manage existing accounts and direct UID access.</CardDescription>
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
                {allHubs?.map(hub => (
                  <tr key={hub.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{hub.name}</td>
                    <td className="p-3 text-muted-foreground">{hub.email}</td>
                    <td className="p-3 text-muted-foreground">{hub.createdAt ? format(parseISO(hub.createdAt), 'PP') : 'N/A'}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <MemberManagementDialog hub={hub} onUpdate={handleUpdateHubMembers} />
                        <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setSelectedHubId(hub.id)}>Access</Button>
                        {hub.id !== activeProfileId && hub.id !== `hub-${user.uid}` && (
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteHub(hub.id)} className="text-destructive h-8 w-8">
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
                        <CompanyScheduleTab schedule={schedule || []} sites={sites || []} cleaners={cleaners || []} onAdd={handleAddScheduleEntry} onUpdate={(id, data) => updateDocumentNonBlocking(doc(scheduleRef!, id), data)} onRemove={(id) => deleteDocumentNonBlocking(doc(scheduleRef!, id))} />
                    </CardContent>
                </Card>
            );
        case 'leave-calendar':
            return <LeaveCalendarTab cleaners={cleaners || []} leave={[]} schedule={schedule || []} onAddLeave={() => {}} onDeleteLeave={() => {}} onUpdateLeave={() => {}} />;
        case 'risk':
            return <RiskDashboardTab sites={sites || []} cleaners={cleaners || []} />;
        case 'action-plan':
            return <ActionPlanTab sites={sites || []} cleaners={cleaners || []} actionPlans={[]} onUpdateActionPlan={() => {}} onRemoveActionPlan={() => {}} />;
        case 'gold-standard':
            return <GoldStandardTab sites={sites || []} cleaners={cleaners || []} />;
        default:
            return <DailySummaryTab sites={sites || []} cleaners={cleaners || []} actionPlans={[]} schedule={schedule || []} leave={[]} />;
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
                {isMasterUser && allHubs && allHubs.length > 0 && (
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
