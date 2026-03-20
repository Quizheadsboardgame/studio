export type SiteStatus =
  | 'Gold Star Site'
  | 'Client happy'
  | 'No Concerns'
  | 'Client concerns'
  | 'Site requires action plan'
  | 'Site under action plan';

export const siteStatuses: SiteStatus[] = [
  'Gold Star Site',
  'Client happy',
  'No Concerns',
  'Client concerns',
  'Site requires action plan',
  'Site under action plan',
];

export type AuditStatus = 'Not Booked' | 'Emailed Client' | 'Booked' | 'Completed';
export const auditStatuses: AuditStatus[] = ['Not Booked', 'Emailed Client', 'Booked', 'Completed'];

export type AdditionalCleaner = {
  name: string;
  role: 'Trained' | 'Previously Cleaned';
}

export type Site = {
  id: string;
  name: string;
  siteCode?: string;
  status: SiteStatus;
  notes?: string;
  additionalCleaners?: AdditionalCleaner[];
  userProfileId?: string; // Multi-tenant link
  members?: Record<string, string>; // Denormalized for security rules
};

export const initialSites: Omit<Site, 'id'>[] = [];

export type CleanerPerformance =
  | 'No Concerns'
  | 'Gold Star Cleaner'
  | 'Site satisfied'
  | 'Slight improvement needed'
  | 'Needs retraining'
  | 'Under action plan'
  | 'Operational concerns';

export const cleanerPerformances: CleanerPerformance[] = [
  'No Concerns',
  'Gold Star Cleaner',
  'Site satisfied',
  'Slight improvement needed',
  'Needs retraining',
  'Under action plan',
  'Operational concerns',
];

export type AvailabilityStatus = 'Available' | 'Unavailable' | 'Available for Specific Lots';
export const availabilityStatuses: AvailabilityStatus[] = ['Available', 'Unavailable', 'Available for Specific Lots'];

export type Cleaner = {
  id: string;
  name: string;
  rating: CleanerPerformance;
  notes?: string;
  holidayAllowance: number;
  holidayTaken?: number;
  sickDaysTaken?: number;
  availabilityStatus?: AvailabilityStatus;
  availableLots?: number[];
  availabilityNotes?: string;
  userProfileId?: string; // Multi-tenant link
  members?: Record<string, string>; // Denormalized for security rules
};

export const initialCleaners: Omit<Cleaner, 'id'>[] = [];

export type ScheduleEntry = {
  id: string;
  site: string;
  cleaner: string;
  start: string;
  finish: string;
  userProfileId?: string; // Multi-tenant link
  members?: Record<string, string>; // Denormalized for security rules
};

export const initialSchedule: Omit<ScheduleEntry, 'id'>[] = [];

export type ActionPlanTask = {
  id: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
};

export type ActionPlan = {
  id: string; // site.id or cleaner.id
  targetName: string;
  targetType: 'site' | 'cleaner';
  tasks: ActionPlanTask[];
  notes?: string;
};

export type CoverAssignment = {
  site: string;
  coverCleanerName: string;
};

export type Leave = {
    id: string;
    cleanerId: string;
    cleanerName: string;
    type: 'holiday' | 'sick';
    date: string; // YYYY-MM-DD
    coverAssignments: CoverAssignment[];
}

export const initialLeave: Omit<Leave, 'id' | 'coverAssignments' | 'cleanerId'>[] = [];

export type Consumable = {
  id: string;
  name: string;
  orderingCode: string;
};

export type MonthlySupplyOrder = {
  id: string; // Composite key: {siteId}-{consumableId}-{yyyy-MM}
  siteId: string;
  consumableId: string;
  month: number;
  year: number;
  quantity: number;
};

export type MonthlyAudit = {
  id:string; // Composite key: {siteId}-{yyyy-MM}
  siteId: string;
  month: number;
  year: number;
  status: AuditStatus;
  score?: number | null;
  bookedDate?: string | null;
  bookedTime?: string;
  auditor: string;
};

export type Appointment = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  assignee: string;
  site?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceEndDate?: string; // YYYY-MM-DD
};

export type Task = {
  id: string;
  description: string;
  dueDate?: string | null; // YYYY-MM-DD
  completed: boolean;
  assignee?: string;
  site?: string;
};

export type ConversationRecord = {
  id: string;
  cleanerId: string;
  cleanerName: string;
  siteId?: string;
  siteName?: string;
  date: string; // YYYY-MM-DD
  issue: string;
  notes?: string;
  followUpRequired: boolean;
};

export type GoodNewsRecord = {
  id: string;
  personName: string;
  personType: 'Cleaner' | 'Client';
  siteName?: string;
  date: string; // YYYY-MM-DD
  description: string;
  acknowledged: boolean;
  acknowledgementNotes?: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  members: Record<string, string>; // uid -> role
  enabledTabs?: string[]; // List of tab IDs enabled for this hub
  isDeactivated?: boolean; // New field for temporary deactivation
};
