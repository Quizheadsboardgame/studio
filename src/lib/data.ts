

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

export type Contact = {
  name: string;
  phone?: string;
  email?: string;
};

export type Site = {
  id: string;
  name: string;
  siteCode?: string;
  status: SiteStatus;
  notes?: string;
  contacts?: Contact[];
};

const clientData: { [key: string]: { siteCode: string; contacts: Contact[] } } = {
  "ACCI LEVEL 6": { siteCode: "UOC117", contacts: [{ name: "RHODA KUC", phone: "62564", email: "rek22@medschl.cam.ac.uk" }] },
  "ANNE MCLAREN": { siteCode: "UOC1", contacts: [{ name: "SALLY-ANNE THOMAS", phone: "01223 336762", email: "sat55@cam.ac.uk" }] },
  "BARTON HOUSE": { siteCode: "UOC119", contacts: [{ name: "CHLOE CALEY LIGHT", phone: "", email: "Chloe.caley-Light@bioresource.nihr.ac.uk" }] },
  "BAY 13": { siteCode: "UOC5", contacts: [{ name: "DENISE FAULKNER", phone: "30977", email: "Denise.Faulkner@admin.cam.ac.uk" }] },
  "BIO-RESIPISHORY LAB LEVEL 1": { siteCode: "UOC3", contacts: [{ name: "NATALIA WLADYSLAWA PIASZCZYK", phone: "1222 (7)61423", email: "Natalia.Piaszczyk@mrc-epid.cam.ac.uk" }] },
  "BONE RESEARCH/RADIOLOGY LEVEL 4": { siteCode: "UOC122", contacts: [{ name: "JAMES BARRETT", phone: "36891", email: "jwab3@medschl.cam.ac.uk" }, { name: "JOYCE VIVEROS COBOS", phone: "01223 336890", email: "jvc31@cam.ac.uk" }] },
  "CEDAR": { siteCode: "UOC3", contacts: [{ name: "ANDRE NURMSALU", phone: "", email: "Andre.Nurmsalu@mrc-epid.cam.ac.uk" }] },
  "CLIFFORD ALLBUTT BUILDING - CAB": { siteCode: "UOC4", contacts: [{ name: "JAKE PORTCH", phone: "", email: "jgp26@medschl.cam.ac.uk" }] },
  "CLINICAL SCHOOLS": { siteCode: "UOC6", contacts: [{ name: "CHRIS CAMPBELL", phone: "01223 336176", email: "cc2022@medschl.cam.ac.uk" }] },
  "COTON HOUSE": { siteCode: "UOC120", contacts: [{ name: "CHLOE CALEY LIGHT", phone: "", email: "Chloe.caley-Light@bioresource.nihr.ac.uk" }] },
  "E7": { siteCode: "", contacts: [{ name: "UNOCCUPIED", phone: "", email: "" }] },
  "EAST FORVIE (IPH - INSTITUTE OF PUBLIC HELATH)": { siteCode: "UOC9", contacts: [{ name: "JEREMY MARTIN", phone: "30300", email: "jcm209@medschl.cam.ac.uk" }, { name: "STEPHEN CLARKE", phone: "01223 748635", email: "sjc313@medschl.cam.ac.uk" }] },
  "GRANTCHESTER HOUSE": { siteCode: "UOC104", contacts: [{ name: "CHRIS CAMPBELL", phone: "01224 336176", email: "cc2022@medschl.cam.ac.uk" }] },
  "HERSCHEL SMITH BUILDING - HSB": { siteCode: "UOC8", contacts: [{ name: "BETTY RAJ", phone: "01223 337106", email: "HSB@medschl.cam.ac.uk" }] },
  "HLRI - HEART & LUNG BUILDING / VICTOR PHILLIP DAHDAL": { siteCode: "UOC15", contacts: [{ name: "SPYRIDONAS TSIRONIS", phone: "7426829685", email: "st726@cam.ac.uk" }] },
  "IMS LEVELS 4&5": { siteCode: "UOC105", contacts: [{ name: "JONATHAN FORT", phone: "36424", email: "jf277@medschl.cam.ac.uk" }, { name: "VERITY KEW", phone: "", email: "vgk20@medschl.cam.ac.uk" }] },
  "ISLAND RESEARCH BUILDING - IRB": { siteCode: "UOC10", contacts: [{ name: "JAKE PORTCH", phone: "", email: "jgp26@medschl.cam.ac.uk" }] },
  "JEFFREY CHEAH (CAPELLA) OFFICE": { siteCode: "UOC11", contacts: [{ name: "JAMES MACKENZIE", phone: "01223 767801", email: "James.Mackenzie@admin.cam.ac.uk" }] },
  "JOHN VAN GEEST - JVG": { siteCode: "UOC12", contacts: [{ name: "BEATA ORLOS", phone: "", email: "bwo22@medschl.cam.ac.uk" }, { name: "DAMION BOX", phone: "", email: "dmsb2@cam.ac.uk" }] },
  "MEDICINE LEVEL 5": { siteCode: "UOC108", contacts: [{ name: "JOHN O BRIEN", phone: "01224 762604", email: "jao47@cam.ac.uk" }] },
  "MEDICAL GENETICS LEVEL 6": { siteCode: "UOC107", contacts: [{ name: "JAMES BARRETT", phone: "36891", email: "jwab3@medschl.cam.ac.uk" }, { name: "JOYCE VIVEROS COBOS", phone: "01223 336890", email: "jvc31@cam.ac.uk" }] },
  "MRC EPIDEMIOLOGY LEVEL 3": { siteCode: "UOC109", contacts: [{ name: "ANDRE NURMSALU", phone: "", email: "Andre.Nurmsalu@mrc-epid.cam.ac.uk" }] },
  "MRC WATERBEACH SAMPLE STORAGE": { siteCode: "UOC118", contacts: [{ name: "STEVEN KNIGHTON", phone: "01223 862777", email: "Steven.Knighton@mrc-epid.cam.ac.uk" }] },
  "NEURO SPACE": { siteCode: "UOC126", contacts: [{ name: "JONATHAN HALL", phone: "01223 336942", email: "jdh79@medschl.cam.ac.uk" }, { name: "SUE SHAW-HAWKINS", phone: "", email: "ss2921@medschl.cam.ac.uk" }] },
  "OBS": { siteCode: "UOC110", contacts: [{ name: "JAMES BARRETT", phone: "36891", email: "jwab3@medschl.cam.ac.uk" }, { name: "JOYCE VIVEROS COBOS", phone: "01223 336890", email: "jvc31@cam.ac.uk" }] },
  "OLD IMS - LAB BLOCK 4": { siteCode: "UOC106", contacts: [{ name: "JONATHAN FORT", phone: "36424", email: "jf277@medschl.cam.ac.uk" }, { name: "VERITY KEW", phone: "", email: "vgk20@medschl.cam.ac.uk" }] },
  "P&A - PSYCHIATRY & ANAESTHETICS LEVEL 4": { siteCode: "UOC111", contacts: [{ name: "KAREN MITCHELL", phone: "01223 217889", email: "PACEAdministration@medschl.cam.ac.uk" }] },
  "PAEDIATRICS LEVEL 8": { siteCode: "UOC123", contacts: [{ name: "JAMES BARRETT", phone: "36891", email: "jwab3@medschl.cam.ac.uk" }, { name: "JOYCE VIVEROS COBOS", phone: "01223 336890", email: "jvc31@cam.ac.uk" }] },
  "POST DOC": { siteCode: "?", contacts: [{ name: "SHAUN BALLISAT", phone: "", email: "centres.opda@admin.cam.ac.uk" }, { name: "ELLIE BURGESS-WILSON", phone: "", email: "centres.opda@admin.cam.ac.uk" }] },
  "STRAGEWAYS (SLR)": { siteCode: "UOC14", contacts: [{ name: "JEREMY MARTIN", phone: "948619", email: "jcm209@medschl.cam.ac.uk" }, { name: "STEPHEN CLARKE", phone: "01223 748635", email: "sjc313@medschl.cam.ac.uk" }] },
  "SURGERY & RHEUMATOLOGY LEVEL 6 HUB": { siteCode: "UOC124", contacts: [{ name: "JAMES BARRETT", phone: "36891", email: "jwab3@medschl.cam.ac.uk" }, { name: "JOYCE VIVEROS COBOS", phone: "01223 336890", email: "jvc31@cam.ac.uk" }] },
  "SURGERY LEVEL 9": { siteCode: "UOC121", contacts: [{ name: "JAMES BARRETT", phone: "36891", email: "jwab3@medschl.cam.ac.uk" }, { name: "JOYCE VIVEROS COBOS", phone: "01223 336890", email: "jvc31@cam.ac.uk" }] },
  "TMS F&G LEVEL 2 OFFICE SPACE": { siteCode: "UOC3", contacts: [{ name: "SUE SHAW-HAWKINS", phone: "", email: "ss2921@medschl.cam.ac.uk" }] },
  "WBIC RPU BASEMENT": { siteCode: "UOC125", contacts: [{ name: "ANIRUDDHA DOKE", phone: "", email: "akd44@cam.ac.uk" }] },
  "WEST FORVIE": { siteCode: "UOC16", contacts: [{ name: "DENISE FAULKNER", phone: "30977", email: "Denise.Faulkner@admin.cam.ac.uk" }] },
  "WOLFSON BRAIN MAIN WBIC & ANNEX ON CORNER": { siteCode: "UOC112", contacts: [{ name: "MONIKA FITZJOHN", phone: "01223 331823", email: "ml818@cam.ac.uk" }, { name: "VICKY LUPSON", phone: "31825", email: "vcl21@cam.ac.uk" }] },
  "X RAY BLOCK RADIOLOGY LEVEL 5": { siteCode: "UOC113", contacts: [{ name: "JAMES BARRETT", phone: "36891", email: "jwab3@medschl.cam.ac.uk" }, { name: "JOYCE VIVEROS COBOS", phone: "01223 336890", email: "jvc31@cam.ac.uk" }] },
};


const allSiteNames = [
    "ACCI LEVEL 6", "ANNE MCLAREN", "BARTON HOUSE", "BAY 13", "BIO-RESIPISHORY LAB LEVEL 1",
    "BONE RESEARCH/RADIOLOGY LEVEL 4", "CEDAR", "CLIFFORD ALLBUTT BUILDING - CAB",
    "CLINICAL SCHOOLS", "COTON HOUSE", "E7", "EAST FORVIE (IPH - INSTITUTE OF PUBLIC HELATH)",
    "GRANTCHESTER HOUSE", "HERSCHEL SMITH BUILDING - HSB", "HLRI - HEART & LUNG BUILDING / VICTOR PHILLIP DAHDAL",
    "IMS LEVELS 4&5", "ISLAND RESEARCH BUILDING - IRB", "JEFFREY CHEAH (CAPELLA) OFFICE",
    "JOHN VAN GEEST - JVG", "MEDICINE LEVEL 5", "MRC EPIDEMIOLOGY LEVEL 3", "MRC WATERBEACH SAMPLE STORAGE",
    "NEURO SPACE", "OBS", "OLD IMS - LAB BLOCK 4", "P&A - PSYCHIATRY & ANAESTHETICS LEVEL 4",
    "PAEDIATRICS LEVEL 8", "POST DOC", "STRAGEWAYS (SLR)", "SURGERY & RHEUMATOLOGY LEVEL 6 HUB",
    "SURGERY LEVEL 9", "TMS F&G LEVEL 2 OFFICE SPACE", "WBIC RPU BASEMENT", "WEST FORVIE",
    "WOLFSON BRAIN MAIN WBIC & ANNEX ON CORNER", "X RAY BLOCK RADIOLOGY LEVEL 5"
];

export const initialSites: Omit<Site, 'id'>[] = [...new Set(allSiteNames)]
    .sort((a, b) => a.localeCompare(b))
    .map(name => {
        const details = clientData[name];
        return {
            name,
            siteCode: details?.siteCode || '',
            status: 'N/A' as SiteStatus,
            notes: '',
            contacts: details?.contacts || [],
        };
    });

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

const rawScheduleData: [string, string, string, string][] = [
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
];

// Deduplicate the initial schedule data to prevent issues from copy-paste errors.
const scheduleKeys = new Set<string>();
const uniqueRawSchedule = rawScheduleData.filter(entry => {
    const key = entry.join('|').toLowerCase();
    if (scheduleKeys.has(key)) {
        return false; // Found a duplicate, so filter it out
    }
    scheduleKeys.add(key);
    return true; // Keep this unique entry
});

export const initialSchedule: Omit<ScheduleEntry, 'id'>[] = uniqueRawSchedule.map(([site, cleaner, start, finish]) => ({ site, cleaner, start, finish }));


export type ActionPlanTask = {
  id: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  beforeImageUrl?: string;
  afterImageUrl?: string;
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

export const initialLeave: Omit<Leave, 'id' | 'coverAssignments' | 'cleanerId'>[] = [
  // July 2024
  { cleanerName: 'Courtney Kendell', type: 'holiday', date: '2024-07-29' },
  { cleanerName: 'Courtney Kendell', type: 'holiday', date: '2024-07-30' },
  { cleanerName: 'Courtney Kendell', type: 'holiday', date: '2024-07-31' },
  { cleanerName: 'Ben Heron', type: 'holiday', date: '2024-07-29' },
  { cleanerName: 'Ben Heron', type: 'holiday', date: '2024-07-30' },
  { cleanerName: 'Ben Heron', type: 'holiday', date: '2024-07-31' },
  { cleanerName: 'David Gibson', type: 'holiday', date: '2024-07-29' },
  { cleanerName: 'David Gibson', type: 'holiday', date: '2024-07-30' },
  { cleanerName: 'David Gibson', type: 'holiday', date: '2024-07-31' },
  { cleanerName: 'Joyce Howard', type: 'holiday', date: '2024-07-29' },
  { cleanerName: 'Joyce Howard', type: 'holiday', date: '2024-07-30' },
  { cleanerName: 'Joyce Howard', type: 'holiday', date: '2024-07-31' },
  { cleanerName: 'Thomas Boltasiu', type: 'holiday', date: '2024-07-29' },
  { cleanerName: 'Thomas Boltasiu', type: 'holiday', date: '2024-07-30' },
  { cleanerName: 'Thomas Boltasiu', type: 'holiday', date: '2024-07-31' },
  { cleanerName: 'Veronica Smintina', type: 'holiday', date: '2024-07-29' },
  { cleanerName: 'Veronica Smintina', type: 'holiday', date: '2024-07-30' },
  { cleanerName: 'Veronica Smintina', type: 'holiday', date: '2024-07-31' },
  { cleanerName: 'Shakila Soloman', type: 'holiday', date: '2024-07-29' },
  { cleanerName: 'Shakila Soloman', type: 'holiday', date: '2024-07-30' },
  { cleanerName: 'Shakila Soloman', type: 'holiday', date: '2024-07-31' },

  // August 2024
  { cleanerName: 'Bozena Pluskota', type: 'holiday', date: '2024-08-01' },
  { cleanerName: 'Bozena Pluskota', type: 'holiday', date: '2024-08-02' },
  { cleanerName: 'Grzegorz Pluskota', type: 'holiday', date: '2024-08-01' },
  { cleanerName: 'Grzegorz Pluskota', type: 'holiday', date: '2024-08-02' },
  { cleanerName: 'Piotr Skrzypczyk', type: 'holiday', date: '2024-08-05' },
  { cleanerName: 'Piotr Skrzypczyk', type: 'holiday', date: '2024-08-06' },
  { cleanerName: 'Piotr Skrzypczyk', type: 'holiday', date: '2024-08-07' },
  { cleanerName: 'Piotr Skrzypczyk', type: 'holiday', date: '2024-08-08' },
  { cleanerName: 'Piotr Skrzypczyk', type: 'holiday', date: '2024-08-09' },
  { cleanerName: 'Alasdair Strachan', type: 'holiday', date: '2024-08-05' },
  { cleanerName: 'Alasdair Strachan', type: 'holiday', date: '2024-08-06' },
  { cleanerName: 'Alasdair Strachan', type: 'holiday', date: '2024-08-07' },
  { cleanerName: 'Alasdair Strachan', type: 'holiday', date: '2024-08-08' },
  { cleanerName: 'Alasdair Strachan', type: 'holiday', date: '2024-08-09' },
  { cleanerName: 'Arkadiusz Lotko', type: 'holiday', date: '2024-08-12' },
  { cleanerName: 'Arkadiusz Lotko', type: 'holiday', date: '2024-08-13' },
  { cleanerName: 'Arkadiusz Lotko', type: 'holiday', date: '2024-08-14' },
  { cleanerName: 'Arkadiusz Lotko', type: 'holiday', date: '2024-08-15' },
  { cleanerName: 'Arkadiusz Lotko', type: 'holiday', date: '2024-08-16' },
  { cleanerName: 'Ewa Kozlowska', type: 'holiday', date: '2024-08-12' },
  { cleanerName: 'Ewa Kozlowska', type: 'holiday', date: '2024-08-13' },
  { cleanerName: 'Ewa Kozlowska', type: 'holiday', date: '2024-08-14' },
  { cleanerName: 'Ewa Kozlowska', type: 'holiday', date: '2024-08-15' },
  { cleanerName: 'Ewa Kozlowska', type: 'holiday', date: '2024-08-16' },
  { cleanerName: 'Felisberto Mendonca', type: 'holiday', date: '2024-08-12' },
  { cleanerName: 'Felisberto Mendonca', type: 'holiday', date: '2024-08-13' },
  { cleanerName: 'Felisberto Mendonca', type: 'holiday', date: '2024-08-14' },
  { cleanerName: 'Felisberto Mendonca', type: 'holiday', date: '2024-08-15' },
  { cleanerName: 'Felisberto Mendonca', type: 'holiday', date: '2024-08-16' },
  { cleanerName: 'Salvador Da Costa', type: 'holiday', date: '2024-08-19' },
  { cleanerName: 'Salvador Da Costa', type: 'holiday', date: '2024-08-20' },
  { cleanerName: 'Salvador Da Costa', type: 'holiday', date: '2024-08-21' },
  { cleanerName: 'Salvador Da Costa', type: 'holiday', date: '2024-08-22' },
  { cleanerName: 'Salvador Da Costa', type: 'holiday', date: '2024-08-23' },
  { cleanerName: 'Anna Bajor', type: 'holiday', date: '2024-08-19' },
  { cleanerName: 'Anna Bajor', type: 'holiday', date: '2024-08-20' },
  { cleanerName: 'Anna Bajor', type: 'holiday', date: '2024-08-21' },
  { cleanerName: 'Anna Bajor', type: 'holiday', date: '2024-08-22' },
  { cleanerName: 'Anna Bajor', type: 'holiday', date: '2024-08-23' },
  { cleanerName: 'Zbigniew Bajor', type: 'holiday', date: '2024-08-19' },
  { cleanerName: 'Zbigniew Bajor', type: 'holiday', date: '2024-08-20' },
  { cleanerName: 'Zbigniew Bajor', type: 'holiday', date: '2024-08-21' },
  { cleanerName: 'Zbigniew Bajor', type: 'holiday', date: '2024-08-22' },
  { cleanerName: 'Zbigniew Bajor', type: 'holiday', date: '2024-08-23' },
  { cleanerName: 'Miled Nsib', type: 'holiday', date: '2024-08-27' },
  { cleanerName: 'Miled Nsib', type: 'holiday', date: '2024-08-28' },
  { cleanerName: 'Miled Nsib', type: 'holiday', date: '2024-08-29' },
  { cleanerName: 'Miled Nsib', type: 'holiday', date: '2024-08-30' },
  { cleanerName: 'Susana Correia', type: 'holiday', date: '2024-08-27' },
  { cleanerName: 'Susana Correia', type: 'holiday', date: '2024-08-28' },
  { cleanerName: 'Susana Correia', type: 'holiday', date: '2024-08-29' },
  { cleanerName: 'Susana Correia', type: 'holiday', date: '2024-08-30' },

  // September 2024
  { cleanerName: 'Nelson Damasu Do rego', type: 'holiday', date: '2024-09-02' },
  { cleanerName: 'Nelson Damasu Do rego', type: 'holiday', date: '2024-09-03' },
  { cleanerName: 'Nelson Damasu Do rego', type: 'holiday', date: '2024-09-04' },
  { cleanerName: 'Nelson Damasu Do rego', type: 'holiday', date: '2024-09-05' },
  { cleanerName: 'Nelson Damasu Do rego', type: 'holiday', date: '2024-09-06' },
  { cleanerName: 'Januario Correia', type: 'holiday', date: '2024-09-09' },
  { cleanerName: 'Januario Correia', type: 'holiday', date: '2024-09-10' },
  { cleanerName: 'Januario Correia', type: 'holiday', date: '2024-09-11' },
  { cleanerName: 'Januario Correia', type: 'holiday', date: '2024-09-12' },
  { cleanerName: 'Januario Correia', type: 'holiday', date: '2024-09-13' },
  { cleanerName: 'Placido Da Costa', type: 'holiday', date: '2024-09-16' },
  { cleanerName: 'Placido Da Costa', type: 'holiday', date: '2024-09-17' },
  { cleanerName: 'Placido Da Costa', type: 'holiday', date: '2024-09-18' },
  { cleanerName: 'Placido Da Costa', type: 'holiday', date: '2024-09-19' },
  { cleanerName: 'Placido Da Costa', type: 'holiday', date: '2024-09-20' },
  { cleanerName: 'Ubaldo Soares Vital', type: 'holiday', date: '2024-09-23' },
  { cleanerName: 'Ubaldo Soares Vital', type: 'holiday', date: '2024-09-24' },
  { cleanerName: 'Ubaldo Soares Vital', type: 'holiday', date: '2024-09-25' },
  { cleanerName: 'Ubaldo Soares Vital', type: 'holiday', date: '2024-09-26' },
  { cleanerName: 'Ubaldo Soares Vital', type: 'holiday', date: '2024-09-27' },
  { cleanerName: 'Sergio Dos Reis', type: 'holiday', date: '2024-09-23' },
  { cleanerName: 'Sergio Dos Reis', type: 'holiday', date: '2024-09-24' },
  { cleanerName: 'Sergio Dos Reis', type: 'holiday', date: '2024-09-25' },
  { cleanerName: 'Sergio Dos Reis', type: 'holiday', date: '2024-09-26' },
  { cleanerName: 'Sergio Dos Reis', type: 'holiday', date: '2024-09-27' },
  { cleanerName: 'Leonardi Figundo', type: 'holiday', date: '2024-09-23' },
  { cleanerName: 'Leonardi Figundo', type: 'holiday', date: '2024-09-24' },
  { cleanerName: 'Leonardi Figundo', type: 'holiday', date: '2024-09-25' },
  { cleanerName: 'Leonardi Figundo', type: 'holiday', date: '2024-09-26' },
  { cleanerName: 'Leonardi Figundo', type: 'holiday', date: '2024-09-27' },

  // October 2024
  { cleanerName: 'Emilia Martins', type: 'holiday', date: '2024-10-01' },
  { cleanerName: 'Emilia Martins', type: 'holiday', date: '2024-10-02' },
  { cleanerName: 'Emilia Martins', type: 'holiday', date: '2024-10-03' },
  { cleanerName: 'Emilia Martins', type: 'holiday', date: '2024-10-04' },
  { cleanerName: 'Auxiliadora Plomita Martins De Fatima', type: 'holiday', date: '2024-10-01' },
  { cleanerName: 'Auxiliadora Plomita Martins De Fatima', type: 'holiday', date: '2024-10-02' },
  { cleanerName: 'Auxiliadora Plomita Martins De Fatima', type: 'holiday', date: '2024-10-03' },
  { cleanerName: 'Auxiliadora Plomita Martins De Fatima', type: 'holiday', date: '2024-10-04' },
  { cleanerName: 'Manuel Mendonca', type: 'holiday', date: '2024-10-07' },
  { cleanerName: 'Manuel Mendonca', type: 'holiday', date: '2024-10-08' },
  { cleanerName: 'Manuel Mendonca', type: 'holiday', date: '2024-10-09' },
  { cleanerName: 'Manuel Mendonca', type: 'holiday', date: '2024-10-10' },
  { cleanerName: 'Manuel Mendonca', type: 'holiday', date: '2024-10-11' },
  { cleanerName: 'Armindo Da Silva', type: 'holiday', date: '2024-10-14' },
  { cleanerName: 'Armindo Da Silva', type: 'holiday', date: '2024-10-15' },
  { cleanerName: 'Armindo Da Silva', type: 'holiday', date: '2024-10-16' },
  { cleanerName: 'Armindo Da Silva', type: 'holiday', date: '2024-10-17' },
  { cleanerName: 'Armindo Da Silva', type: 'holiday', date: '2024-10-18' },
  { cleanerName: 'Dania Guterres', type: 'holiday', date: '2024-10-21' },
  { cleanerName: 'Dania Guterres', type: 'holiday', date: '2024-10-22' },
  { cleanerName: 'Dania Guterres', type: 'holiday', date: '2024-10-23' },
  { cleanerName: 'Dania Guterres', type: 'holiday', date: '2024-10-24' },
  { cleanerName: 'Dania Guterres', type: 'holiday', date: '2024-10-25' },
  { cleanerName: 'Ludegardo Cabral', type: 'holiday', date: '2024-10-28' },
  { cleanerName: 'Ludegardo Cabral', type: 'holiday', date: '2024-10-29' },
  { cleanerName: 'Ludegardo Cabral', type: 'holiday', date: '2024-10-30' },
  { cleanerName: 'Ludegardo Cabral', type: 'holiday', date: '2024-10-31' },

  // November 2024
  { cleanerName: 'Ludegardo Cabral', type: 'holiday', date: '2024-11-01' },
  { cleanerName: 'Felicia Kwabea', type: 'holiday', date: '2024-11-04' },
  { cleanerName: 'Felicia Kwabea', type: 'holiday', date: '2024-11-05' },
  { cleanerName: 'Felicia Kwabea', type: 'holiday', date: '2024-11-06' },
  { cleanerName: 'Felicia Kwabea', type: 'holiday', date: '2024-11-07' },
  { cleanerName: 'Felicia Kwabea', type: 'holiday', date: '2024-11-08' },
  { cleanerName: 'Rosana Da Silva', type: 'holiday', date: '2024-11-11' },
  { cleanerName: 'Rosana Da Silva', type: 'holiday', date: '2024-11-12' },
  { cleanerName: 'Rosana Da Silva', type: 'holiday', date: '2024-11-13' },
  { cleanerName: 'Rosana Da Silva', type: 'holiday', date: '2024-11-14' },
  { cleanerName: 'Rosana Da Silva', type: 'holiday', date: '2024-11-15' },
  { cleanerName: 'Emerenciana Correia', type: 'holiday', date: '2024-11-18' },
  { cleanerName: 'Emerenciana Correia', type: 'holiday', date: '2024-11-19' },
  { cleanerName: 'Emerenciana Correia', type: 'holiday', date: '2024-11-20' },
  { cleanerName: 'Emerenciana Correia', type: 'holiday', date: '2024-11-21' },
  { cleanerName: 'Emerenciana Correia', type: 'holiday', date: '2024-11-22' },
  { cleanerName: 'Almerio Fernandes', type: 'holiday', date: '2024-11-25' },
  { cleanerName: 'Almerio Fernandes', type: 'holiday', date: '2024-11-26' },
  { cleanerName: 'Almerio Fernandes', type: 'holiday', date: '2024-11-27' },
  { cleanerName: 'Almerio Fernandes', type: 'holiday', date: '2024-11-28' },
  { cleanerName: 'Almerio Fernandes', type: 'holiday', date: '2024-11-29' },

  // December 2024
  { cleanerName: 'Chepkorir Caren Sambai (Karen)', type: 'holiday', date: '2024-12-02' },
  { cleanerName: 'Chepkorir Caren Sambai (Karen)', type: 'holiday', date: '2024-12-03' },
  { cleanerName: 'Chepkorir Caren Sambai (Karen)', type: 'holiday', date: '2024-12-04' },
  { cleanerName: 'Chepkorir Caren Sambai (Karen)', type: 'holiday', date: '2024-12-05' },
  { cleanerName: 'Chepkorir Caren Sambai (Karen)', type: 'holiday', date: '2024-12-06' },
  { cleanerName: 'Ioana Boltasiu', type: 'holiday', date: '2024-12-09' },
  { cleanerName: 'Ioana Boltasiu', type: 'holiday', date: '2024-12-10' },
  { cleanerName: 'Ioana Boltasiu', type: 'holiday', date: '2024-12-11' },
  { cleanerName: 'Ioana Boltasiu', type: 'holiday', date: '2024-12-12' },
  { cleanerName: 'Ioana Boltasiu', type: 'holiday', date: '2024-12-13' },
  { cleanerName: 'Daniel Pluska', type: 'holiday', date: '2024-12-16' },
  { cleanerName: 'Daniel Pluska', type: 'holiday', date: '2024-12-17' },
  { cleanerName: 'Daniel Pluska', type: 'holiday', date: '2024-12-18' },
  { cleanerName: 'Daniel Pluska', type: 'holiday', date: '2024-12-19' },
  { cleanerName: 'Daniel Pluska', type: 'holiday', date: '2024-12-20' },
  { cleanerName: 'Damiao Gusmao (Supervisor)', type: 'holiday', date: '2024-12-23' },
  { cleanerName: 'Damiao Gusmao (Supervisor)', type: 'holiday', date: '2024-12-24' },
  { cleanerName: 'Damiao Gusmao (Supervisor)', type: 'holiday', date: '2024-12-27' },
  { cleanerName: 'Damiao Gusmao (Supervisor)', type: 'holiday', date: '2024-12-30' },
  { cleanerName: 'Damiao Gusmao (Supervisor)', type: 'holiday', date: '2024-12-31' },
  { cleanerName: 'Rhyse Howard', type: 'holiday', date: '2024-12-23' },
  { cleanerName: 'Rhyse Howard', type: 'holiday', date: '2024-12-24' },
  { cleanerName: 'Rhyse Howard', type: 'holiday', date: '2024-12-27' },
  { cleanerName: 'Rhyse Howard', type: 'holiday', date: '2024-12-30' },
  { cleanerName: 'Rhyse Howard', type: 'holiday', date: '2024-12-31' },
  { cleanerName: 'Garry Kerr', type: 'holiday', date: '2024-12-23' },
  { cleanerName: 'Garry Kerr', type: 'holiday', date: '2024-12-24' },
  { cleanerName: 'Garry Kerr', type: 'holiday', date: '2024-12-27' },
  { cleanerName: 'Garry Kerr', type: 'holiday', date: '2024-12-30' },
  { cleanerName: 'Garry Kerr', type: 'holiday', date: '2024-12-31' },
  { cleanerName: 'Natalino Mendonca', type: 'holiday', date: '2024-12-23' },
  { cleanerName: 'Natalino Mendonca', type: 'holiday', date: '2024-12-24' },
  { cleanerName: 'Natalino Mendonca', type: 'holiday', date: '2024-12-27' },
  { cleanerName: 'Natalino Mendonca', type: 'holiday', date: '2024-12-30' },
  { cleanerName: 'Natalino Mendonca', type: 'holiday', date: '2024-12-31' },
  { cleanerName: 'Nolasco De Sousa', type: 'holiday', date: '2024-12-23' },
  { cleanerName: 'Nolasco De Sousa', type: 'holiday', date: '2024-12-24' },
  { cleanerName: 'Nolasco De Sousa', type: 'holiday', date: '2024-12-27' },
  { cleanerName: 'Nolasco De Sousa', type: 'holiday', date: '2024-12-30' },
  { cleanerName: 'Nolasco De Sousa', type: 'holiday', date: '2024-12-31' },
  { cleanerName: 'Fernando Correia', type: 'holiday', date: '2024-12-23' },
  { cleanerName: 'Fernando Correia', type: 'holiday', date: '2024-12-24' },
  { cleanerName: 'Fernando Correia', type: 'holiday', date: '2024-12-27' },
  { cleanerName: 'Fernando Correia', type: 'holiday', date: '2024-12-30' },
  { cleanerName: 'Fernando Correia', type: 'holiday', date: '2024-12-31' },
];


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




