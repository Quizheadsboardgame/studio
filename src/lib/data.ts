export type SiteStatus =
  | 'N/A'
  | 'Client happy'
  | 'Operations request'
  | 'Client concerns'
  | 'Under control'
  | 'Site under action plan'
  | 'Site requires action plan';

export type Site = {
  id: string;
  name: string;
  status: SiteStatus;
  notes?: string;
};

export const siteStatuses: SiteStatus[] = [
  'N/A',
  'Client happy',
  'Operations request',
  'Client concerns',
  'Under control',
  'Site under action plan',
  'Site requires action plan',
];

export const initialSites: Omit<Site, 'id'>[] = [
    "ACCI LEVEL 6", "ANNE MCLAREN", "BARTON HOUSE", "BAY 13", "BIO-RESIPISHORY LAB LEVEL 1",
    "BONE RESEARCH/RADIOLOGY LEVEL 4", "CEDAR", "CLINICAL SCHOOLS", "CLIFFORD ALLBUTT BUILDING - CAB",
    "COTON HOUSE", "E7", "EAST FORVIE (IPH - INSTITUTE OF PUBLIC HELATH)", "GRANTCHESTER HOUSE",
    "HERSCHEL SMITH BUILDING - HSB", "HLRI - HEART & LUNG BUILDING / VICTOR PHILLIP DAHDAL",
    "IMS LEVELS 4&5", "ISLAND RESEARCH BUILDING - IRB", "JEFFREY CHEAH (CAPELLA) OFFICE",
    "JOHN VAN GEEST - JVG", "MEDICAL GENETICS LEVEL 6", "MEDICINE LEVEL 5", "MRC EPIDEMIOLOGY LEVEL 3",
    "MRC WATERBEACH SAMPLE STORAGE", "NERO SPACE", "NEURO SPACE", "OBS", "OLD IMS - LAB BLOCK 4",
    "P&A - PSYCHIATRY & ANAESTHETICS LEVEL 4", "PAEDIATRICS LEVEL 8", "POST DOC", "STRAGEWAYS (SLR)",
    "SURGERY & RHEUMATOLOGY LEVEL 6 HUB", "SURGERY LEVEL 9", "TMS F&G LEVEL 2 OFFICE SPACE",
    "WBIC RPU BASEMENT", "WEST FORVIE", "WOLFSON BRAIN MAIN WBIC & ANNEX ON CORNER",
    "X RAY BLOCK RADIOLOGY LEVEL 5"
].map(name => ({ name, status: 'N/A', notes: '' }));


export type CleanerPerformance =
  | 'N/A'
  | 'Excellent feedback'
  | 'Site satisfied'
  | 'Slight improvement needed'
  | 'Needs retraining'
  | 'Under action plan'
  | 'Operational concerns';

export const cleanerPerformances: CleanerPerformance[] = [
  'N/A',
  'Excellent feedback',
  'Site satisfied',
  'Slight improvement needed',
  'Needs retraining',
  'Under action plan',
  'Operational concerns',
];

export type Cleaner = {
  id: string;
  name: string;
  rating: CleanerPerformance;
  notes?: string;
};

export const initialCleaners: Omit<Cleaner, 'id'>[] = [
  "Alasdair Strachan", "Almerio Fernandes", "Anna Bajor", "Arkadiusz Lotko", "Armindo Da Silva",
  "Ben Heron", "Bozena Pluskota", "Cornelia Rotaru", "Courtney Kendell", "Damiao Gusmao", "David Gibson",
  "Emilia Martins", "Ewa Kozlowska", "Felicia Kwabea", "Fernando Correia", "Garry Kerr", "Grzegorz Pluskota",
  "Ioana Boltasiu", "Joyce Howard", "Ludegardo Cabral", "Manuel Mendonca", "Mircalla Bond", "Nolasco De Sousa",
  "Piotr Skrzypczyk", "Rhyse Howard", "Rosana Da Silva", "Salvador Da Costa", "Sergio Dos Reis", "Shakila Soloman",
  "Thomas Boltasiu", "Veronica Smintina", "Zbigniew Bajor"
].map(name => ({ name, rating: 'N/A', notes: '' }));


export type ScheduleEntry = {
  id: string;
  site: string;
  cleaner: string;
  start: string;
  finish: string;
};

export const schedule: ScheduleEntry[] = [
  ["Coton House","Alasdair Strachan","23:30","01:45"], ["Medicine Level 5","Alasdair Strachan","17:00","19:00"],
  ["Obs & Gynae","Alasdair Strachan","19:00","20:30"], ["Strangeways","Almerio Fernandes","17:30","19:30"],
  ["HLRI","Almerio Fernandes","06:00","08:30"], ["Capella","Anna Bajor","04:30","08:30"],
  ["HSB","Arkadiusz Lotko","21:15","23:15"], ["West Forvie","Arkadiusz Lotko","19:00","21:15"],
  ["CAB","Dania Guterres","16:30","19:00"], ["Barton House","David Gibson","22:30","00:30"],
  ["Island Research","Emilia Martins","17:00","19:00"], ["Strangeways","Ewa Kozlowska","18:00","21:00"],
  ["IMS","Grzegorz Pluskota","14:30","20:15"], ["Anne Mclaren","Joyce Howard","06:00","10:00"],
  ["Clinical Schools","Mircalla Bond","15:00","18:00"], ["IPH","Nolasco De Sousa","17:30","22:00"],
  ["CAB","Piotr Skrzypczyk","15:00","19:00"], ["Radiology","Rosana Da Silva","15:00","17:00"],
  ["IMS","Thomas Boltasiu","19:00","00:00"]
].map(([site, cleaner, start, finish], index) => ({ id: `schedule-${index+1}`, site, cleaner, start, finish }));

export type SiteHistoryEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  sites: Site[];
};

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
