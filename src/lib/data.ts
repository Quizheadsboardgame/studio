

export type SiteStatus =
  | 'N/A'
  | 'Client happy'
  | 'Operations request'
  | 'Client concerns'
  | 'Under control'
  | 'Site under action plan'
  | 'Site requires action plan';

export const siteStatuses: SiteStatus[] = [
  'N/A',
  'Client happy',
  'Operations request',
  'Client concerns',
  'Under control',
  'Site under action plan',
  'Site requires action plan',
];

export type AuditStatus = 'Not Booked' | 'Emailed Client' | 'Booked' | 'Completed';
export const auditStatuses: AuditStatus[] = ['Not Booked', 'Emailed Client', 'Booked', 'Completed'];

export type Site = {
  id: string;
  name: string;
  status: SiteStatus;
  notes?: string;
};


export const initialSites: Omit<Site, 'id'>[] = [
    "ACCI LEVEL 6",
    "ANNE MCLAREN",
    "BARTON HOUSE",
    "BAY 13",
    "BIO-RESIPISHORY LAB LEVEL 1",
    "BONE RESEARCH/RADIOLOGY LEVEL 4",
    "CEDAR",
    "CLIFFORD ALLBUTT BUILDING - CAB",
    "CLINICAL SCHOOLS",
    "COTON HOUSE",
    "E7",
    "EAST FORVIE (IPH - INSTITUTE OF PUBLIC HELATH)",
    "GRANTCHESTER HOUSE",
    "HERSCHEL SMITH BUILDING - HSB",
    "HLRI - HEART & LUNG BUILDING / VICTOR PHILLIP DAHDAL",
    "IMS LEVELS 4&5",
    "ISLAND RESEARCH BUILDING - IRB",
    "JEFFREY CHEAH (CAPELLA) OFFICE",
    "JOHN VAN GEEST - JVG",
    "MEDICINE LEVEL 5",
    "MRC EPIDEMIOLOGY LEVEL 3",
    "MRC WATERBEACH SAMPLE STORAGE",
    "NERO SPACE",
    "NEURO SPACE",
    "OBS",
    "OLD IMS - LAB BLOCK 4",
    "P&A - PSYCHIATRY & ANAESTHETICS LEVEL 4",
    "PAEDIATRICS LEVEL 8",
    "POST DOC",
    "STRAGEWAYS (SLR)",
    "SURGERY & RHEUMATOLOGY LEVEL 6 HUB",
    "SURGERY LEVEL 9",
    "TMS F&G LEVEL 2 OFFICE SPACE",
    "WBIC RPU BASEMENT",
    "WEST FORVIE",
    "WOLFSON BRAIN MAIN WBIC & ANNEX ON CORNER",
    "X RAY BLOCK RADIOLOGY LEVEL 5"
].sort((a, b) => a.localeCompare(b)).map(name => ({ name, status: 'N/A' as SiteStatus, notes: '' }));


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
  holidayAllowance: number;
  holidayTaken: number;
  sickDaysTaken: number;
};

export const initialCleaners: Omit<Cleaner, 'id'>[] = [
  "Alasdair Strachan", "Almerio Fernandes", "Anna Bajor", "Arkadiusz Lotko", "Armindo Da Silva",
  "Auxiliadora Plomita Martins De Fatima", "Ben Heron", "Bozena Pluskota", "Chepkorir Caren Sambai (Karen)",
  "Cornelia Rotaru", "Courtney Kendell", "Damiao Gusmao (Supervisor)", "Dania Guterres", "Daniel Pluska",
  "David Gibson", "Emerenciana Correia", "Emilia Martins", "Ewa Kozlowska", "Felicia Kwabea",
  "Felisberto Mendonca", "Fernando Correia", "Garry Kerr", "Grzegorz Pluskota", "Ioana Boltasiu",
  "Januario Correia", "Joyce Howard", "Leonardi Figundo", "Ludegardo Cabral", "Manuel Mendonca",
  "Miled Nsib", "Mircalla Bond (Carla)", "Natalino Mendonca", "Nelson Damasu Do rego", "Nolasco De Sousa",
  "Owen Newton", "Piotr Skrzypczyk", "Placido Da Costa", "Rhyse Howard", "Rosana Da Silva",
  "Salvador Da Costa", "Sergio Dos Reis", "Shakila Soloman", "Susana Correia", "Thomas Boltasiu",
  "Ubaldo Soares Vital", "Vacant", "Veronica Smintina", "Zbigniew Bajor"
].sort((a, b) => a.localeCompare(b)).map(name => ({ name, rating: 'N/A' as CleanerPerformance, notes: '', holidayAllowance: 20, holidayTaken: 0, sickDaysTaken: 0 }));


export type ScheduleEntry = {
  id: string;
  site: string;
  cleaner: string;
  start: string;
  finish: string;
};

export const initialSchedule: Omit<ScheduleEntry, 'id'>[] = [
  ["Coton House Level 5 NIHR Resources", "Alasdair Strachan", "11:30pm", "1.45am"],
  ["Medicine Level 5, E Spur", "Alasdair Strachan", "5pm", "7pm"],
  ["Medicine Level 5, E Spur", "Alasdair Strachan", "8.30pm", "11.30pm"],
  ["Obs & Gynae", "Alasdair Strachan", "7.00pm", "8.30pm"],
  ["Strangeways (SRL)", "Almerio Fernandes", "5.30pm", "7.30pm"],
  ["Heart & Lung Research Institute (HLRI)", "Almerio Fernandes (Supervisor)", "6am", "8.30am"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Anna Bajor", "4.30am", "8.30am"],
  ["Herschel Smith Building (HSB)", "Arkadiusz Lotko", "9.15pm", "11.15pm"],
  ["West Forvie Building", "Arkadiusz Lotko", "7pm", "9.15pm"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Armindo Da Silva", "4.30am", "8.30am"],
  ["Heart & Lung Research Institute (HLRI)", "Auxiliadora Plomita Martins De Fatima", "6am", "8.30am"],
  ["Clinical Schools", "Ben Heron", "", ""],
  ["MRC Epidemiology, ATC Level 3", "Bozena Pluskota", "6pm", "11.30pm"],
  ["Lab Block Level 4 (IMS)", "Chepkorir Caren Sambai (Karen)", "7pm", "9pm"],
  ["Bay 13 LMB Cluster Building including PostDoc", "Cornelia Rotaru", "7am", "10.30am"],
  ["Grantchester House (6 Weekly Deep Clean)", "Cornelia Rotaru", "Additional Ancillary work", ""],
  ["Grantchester House (Weekly clean only)", "Cornelia Rotaru", "2pm", "5pm"],
  ["Strangeways (SRL)", "Cornelia Rotaru", "5.30pm", "8.30pm"],
  ["Clinical School Building Library 3rd Floor", "Courtney Kendell", "3pm", "6pm"],
  ["Herschel Smith Building (HSB)", "Courtney Kendell", "6pm", "8.30pm"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Damiao Gusmao (Supervisor)", "4.30am", "8.30am"],
  ["Clifford Albutt Building (CAB)", "Dania Guterres", "4.30pm", "7pm"],
  ["John van Geest Centre for Brain Repair", "Daniel Pluska", "7am", "8am"],
  ["Psychiatry & Anaesthetics, Level 4, E Spur", "Daniel Pluska", "6am", "7am"],
  ["Barton House", "David Gibson", "10.30pm", "12.30am"],
  ["Institute of Public Health (IPH)", "David Gibson", "5.30pm", "8pm"],
  ["Medicine Level 5, E Spur", "David Gibson", "3pm", "5.30pm"],
  ["Medicine Level 5, E Spur", "David Gibson", "8pm", "10.30pm"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Emerenciana Correia", "4.30am", "8.30am"],
  ["Heart & Lung Research Institute (HLRI)", "Emilia Martins", "6am", "8.30am"],
  ["Island Research Building (IRB)", "Emilia Martins", "5pm", "7pm"],
  ["Psychiatry & Anaesthetics, Level 4, E Spur", "Emilia Martins", "4pm", "5pm"],
  ["Clifford Albutt Building (CAB)", "Ewa Kozlowska", "4pm", "6pm"],
  ["Strangeways (SRL)", "Ewa Kozlowska", "6pm", "9pm"],
  ["Island Research Building (IRB)", "Felicia Kwabea", "6.30pm", "9.30pm"],
  ["Neuro Space level 3,4,5 & 6", "Felicia Kwabea", "5pm", "6.30pm"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Felisberto Mendonca", "4.30am", "8.30am"],
  ["Heart & Lung Research Institute (HLRI)", "Fernando Correia", "6am", "8.30am"],
  ["Strangeways (SRL)", "Garry Kerr", "5am", "7am"],
  ["Institute of Metabolic Sciences (IMS)", "Grzegorz Pluskota", "2.30pm", "8.15pm"],
  ["Medical Genetics, ATC Level 6", "Grzegorz Pluskota", "10.15pm", "11.30pm"],
  ["MRC Epidemiology, ATC Level 3", "Grzegorz Pluskota", "8.15pm", "10.15pm"],
  ["John van Geest Centre for Brain Repair", "Ioana  Boltasiu", "7pm", "9pm"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Januario Correia", "4.30am", "8.30am"],
  ["Anne Mclaren", "Joyce Howard", "6am", "10am"],
  ["Heart & Lung Research Institute (HLRI)", "Leonardi Figundo", "6am", "8.30am"],
  ["Addenbrooke's Centre for ACCI Level 6 investigation", "Ludegardo Cabral", "7pm", "8pm"],
  ["Clifford Albutt Building (CAB)", "Ludegardo Cabral", "8pm", "9pm"],
  ["F&G Ward & Cedar Level 2", "Ludegardo Cabral", "5.30pm", "7pm"],
  ["Paediatrics Level 8, E Spur", "Ludegardo Cabral", "4pm", "5.30pm"],
  ["Surgery & Rheumatology Level 6, E spur", "Ludegardo Cabral - Friday", "5.30pm", "6.30pm"],
  ["Surgery & Rheumatology Level 6, E spur", "Ludegardo Cabral - Monday", "5.30pm", "6pm"],
  ["Surgery & Rheumatology Level 6, E spur", "Ludegardo Cabral - Wednesday", "5.30pm", "6.30pm"],
  ["Strangeways (SRL)", "Manuel Mendonca", "5.30pm", "8.30pm"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Manuel Mendonca", "4.30am", "8.30am"],
  ["Clinical Schools Building - Level 2", "Miled Nsib", "5.30pm", "7.30pm"],
  ["Clinical Schools Building - Level 4", "Miled Nsib", "3.30pm", "5.30pm"],
  ["Clinical Schools (Site Cover/Site Supervisor)", "Mircalla Bond (Carla)", "3pm", "6pm"],
  ["Heart & Lung Research Institute (HLRI)", "Natalino Mendonca", "6am", "8.30am"],
  ["Clifford Albutt Building (CAB)", "Nelson Damasu Do rego", "3pm", "5pm"],
  ["John van Geest Centre for Brain Repair", "Nelson Damasu Do rego", "5pm", "7pm"],
  ["Institute of Public Health (IPH)", "Nolasco De Sousa", "5.30pm", "10pm"],
  ["Clinical Schools", "Owen Newton", "", ""],
  ["Clifford Albutt Building (CAB)", "Piotr Skrzypczyk", "3pm", "7pm"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Placido Da Costa", "4.30am", "8.30am"],
  ["Clinical Schools Building - Level 4 Office side", "Rhyse Howard", "4.30pm", "7.30pm"],
  ["Clinical Schools Building Basement toilets", "Rhyse Howard", "3pm", "4.30pm"],
  ["MRC Waterbeach Email job an finsh (once a week)", "Rhyse Howard", "8.30am", "11.30am"],
  ["Heart & Lung Research Institute (HLRI)", "Rhyse Howard (Day Janitar)", "12pm", "3pm"],
  ["Bone Research", "Rosana Da Silva", "5pm", "6pm"],
  ["Surgery Level 9, E Spur", "Rosana Da Silva", "6pm", "7.30pm"],
  ["X Ray Block, Radiology", "Rosana Da Silva", "3pm", "5pm"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Salvador Da Costa", "4.30am", "8.30am"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Salvador Da Costa (Day Janitar)", "1pm", "4pm"],
  ["Heart & Lung Research Institute (HLRI)", "Sergio Dos Reis", "6am", "8.30am"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Sergio Dos Reis (Day Janitar)", "11am", "1pm"],
  ["WBIC Annex", "Shakila Soloman", "4pm", "6pm"],
  ["Wolfson Brian Imaging Centre", "Shakila Soloman", "6pm", "8pm"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Susana Correia", "4.30am", "8.30am"],
  ["Institute of Metabolic Sciences (IMS)", "Thomas Boltasiu", "7pm", "12am"],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Ubaldo Soares Vital", "4.30am", "8.30am"],
  ["Heart & Lung Research Institute (HLRI)", "Vacant", "6am", "8.30am"],
  ["Herschel Smith Building (HSB)", "Vacant", "", ""],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Vacant", "4.30am", "8.30am"],
  ["Bay 13 LMB Cluster Building including PostDoc", "Veronica Smintina", "7am", "10am"],
  ["Clinical School Lunchtime toilet Attendant", "Veronica Smintina", "10am", "11am"],
  ["Clinical Schools Building - I.T", "Veronica Smintina", "6pm", "7pm"],
  ["Clinical Schools Building - Level 2 & 3", "Veronica Smintina", "3pm", "6pm"],
  ["Grantchester House (6 Weekly Deep Clean)", "Veronica Smintina", "Additional Ancillary work", ""],
  ["UoC - Capella Building /Jeffrey Cheah Biomedical Centre (JCBC)", "Zbigniew Bajor", "4.30am", "8.30am"]
].map(([site, cleaner, start, finish]) => ({ site, cleaner, start, finish }));

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
  id: string; // Composite key: {siteId}-{yyyy-MM}
  siteId: string;
  month: number;
  year: number;
  status: AuditStatus;
  score?: number | null;
  bookedDate?: string | null;
  bookedTime?: string;
  notes?: string;
};

    