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

export const initialSites: Site[] = [
  "Anne Mclaren", "Cedar", "MRC Epidemiology Level 3", "WBIC RPU Basement", "John Van Geest",
  "Herschel Smith Building", "Barton House", "Coton House", "Clinical Schools", "Grantchester House",
  "Bay 13", "West Forvie", "Clifford Allbutt Building", "Island Research Building", "Obs",
  "Paediatrics Level 8", "Surgery Level 9", "Radiology"
].map((name, index) => ({ id: `site-${index + 1}`, name, status: 'N/A', notes: '' }));


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

export const initialCleaners: Cleaner[] = [
  "Alasdair Strachan", "Almerio Fernandes", "Anna Bajor", "Arkadiusz Lotko", "Armindo Da Silva",
  "Ben Heron", "Bozena Pluskota", "Cornelia Rotaru", "Courtney Kendell", "Damiao Gusmao", "David Gibson",
  "Emilia Martins", "Ewa Kozlowska", "Felicia Kwabea", "Fernando Correia", "Garry Kerr", "Grzegorz Pluskota",
  "Ioana Boltasiu", "Joyce Howard", "Ludegardo Cabral", "Manuel Mendonca", "Mircalla Bond", "Nolasco De Sousa",
  "Piotr Skrzypczyk", "Rhyse Howard", "Rosana Da Silva", "Salvador Da Costa", "Sergio Dos Reis", "Shakila Soloman",
  "Thomas Boltasiu", "Veronica Smintina", "Zbigniew Bajor"
].map((name, index) => ({ id: `cleaner-${index + 1}`, name, rating: 'N/A', notes: '' }));


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
  date: string; // YYYY-MM-DD
  sites: Site[];
};

export const initialHistory: SiteHistoryEntry[] = [
  {
    date: '2024-07-15',
    sites: [
      { id: 'site-1', name: 'Anne Mclaren', status: 'Client happy', notes: '' },
      { id: 'site-2', name: 'Cedar', status: 'Under control', notes: '' },
      { id: 'site-3', name: 'MRC Epidemiology Level 3', status: 'Site requires action plan', notes: '' },
      { id: 'site-4', name: 'WBIC RPU Basement', status: 'Client happy', notes: '' },
      { id: 'site-5', name: 'John Van Geest', status: 'Client concerns', notes: '' },
      { id: 'site-6', name: 'Herschel Smith Building', status: 'Operations request', notes: '' },
    ]
  },
  {
    date: '2024-07-16',
    sites: [
      { id: 'site-1', name: 'Anne Mclaren', status: 'Client happy', notes: '' },
      { id: 'site-2', name: 'Cedar', status: 'Client happy', notes: '' },
      { id: 'site-3', name: 'MRC Epidemiology Level 3', status: 'Site under action plan', notes: '' },
      { id: 'site-4', name: 'WBIC RPU Basement', status: 'Client happy', notes: '' },
      { id: 'site-5', name: 'John Van Geest', status: 'Under control', notes: '' },
      { id: 'site-6', name: 'Herschel Smith Building', status: 'Under control', notes: '' },
    ]
  },
    {
    date: '2024-07-17',
    sites: [
      { id: 'site-1', name: 'Anne Mclaren', status: 'Client happy', notes: '' },
      { id: 'site-2', name: 'Cedar', status: 'Client happy', notes: '' },
      { id: 'site-3', name: 'MRC Epidemiology Level 3', status: 'Under control', notes: '' },
      { id: 'site-4', name: 'WBIC RPU Basement', status: 'Client happy', notes: '' },
      { id: 'site-5', name: 'John Van Geest', status: 'Client happy', notes: '' },
      { id: 'site-6', name: 'Herschel Smith Building', status: 'Client happy', notes: '' },
    ]
  }
];
