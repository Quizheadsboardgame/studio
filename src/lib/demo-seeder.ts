'use client';

import { Firestore, doc, collection, writeBatch, getDoc, type WriteBatch } from 'firebase/firestore';
import { format, addDays, parseISO, startOfYear, endOfYear, eachDayOfInterval } from 'date-fns';

const SITES = [
  "North Wing Clinic", "South Research Lab", "Main Reception", "Emergency Dept", 
  "Radiology Unit", "Pharmacy Central", "Staff Canteen", "Maternity Ward", 
  "Outpatients Suite", "Executive Offices"
];

const ADDENBROOKES_SITES = [
  "CLINICAL SCHOOLS",
  "ISLAND RESEARCH BUILDING - IRB",
  "BAY 13",
  "CLIFFORD ALLBUTT BUILDING - CAB",
  "GRANTCHESTER HOUSE",
  "JEFFREY CHEAH (CAPELLA) OFFICE",
  "BARTON HOUSE",
  "COTON HOUSE",
  "IMS LEVELS 4&5",
  "MRC EPIDEMIOLOGY LEVEL 3",
  "ACCI LEVEL 6",
  "OBS",
  "OLD IMS - LAB BLOCK 4",
  "MEDICINE LEVEL 5",
  "NEURO SPACE",
  "PAEDIATRICS LEVEL 8",
  "P&A - PSYCHIATRY & ANAESTHETICS LEVEL 4",
  "SURGERY & RHEUMATOLOGY LEVEL 6 HUB",
  "SURGERY LEVEL 9",
  "X RAY BLOCK RADIOLOGY LEVEL 5",
  "CEDAR",
  "TMS F&G LEVEL 2 OFFICE SPACE",
  "WBIC RPU BASEMENT",
  "WOLFSON BRAIN MAIN WBIC & ANNEX ON CORNER",
  "HERSCHEL SMITH BUILDING - HSB",
  "EAST FORVIE (IPH - INSTITUTE OF PUBLIC HELATH)",
  "JOHN VAN GEEST - JVG",
  "WEST FORVIE",
  "STRAGEWAYS (SLR)",
  "HLRI - HEART & LUNG BUILDING / VICTOR PHILLIP DAHDAL",
  "ANNE MCLAREN",
  "BIO-RESIPISHORY LAB LEVEL 1",
  "BONE RESEARCH/RADIOLOGY LEVEL 4",
  "E7",
  "POST DOC"
];

const CLEANERS = [
  { name: "Alice Thompson", role: "Supervisor" },
  { name: "Bob Richards", role: "Mobile Cleaner" },
  { name: "Charlie Davis", role: "Cleaner" },
  { name: "Diana Prince", role: "Cleaner" },
  { name: "Edward Norton", role: "Cleaner" },
  { name: "Fiona Gallagher", role: "Supervisor" },
  { name: "George Miller", role: "Mobile Cleaner" },
  { name: "Hannah Abbott", role: "Cleaner" },
  { name: "Ian Wright", role: "Cleaner" },
  { name: "Jenny Slate", role: "Cleaner" },
  { name: "Kevin Hart", role: "Cleaner" },
  { name: "Laura Palmer", role: "Cleaner" },
  { name: "Mike Wazowski", role: "Mobile Cleaner" },
  { name: "Nina Simone", role: "Cleaner" },
  { name: "Oscar Isaac", role: "Cleaner" },
  { name: "Paul Rudd", role: "Cleaner" },
  { name: "Quinn Fabray", role: "Cleaner" },
  { name: "Riley Reid", role: "Cleaner" },
  { name: "Steve Carell", role: "Supervisor" },
  { name: "Tina Fey", role: "Cleaner" }
];

const GOOD_NEWS = [
  "Excellent feedback from the Radiology manager regarding the floor waxing.",
  "Alice went above and beyond to cover an emergency spill in A&E.",
  "Client reported the main reception has never looked better.",
  "Successful deep clean of the surgical theaters completed ahead of schedule.",
  "Bob identified a safety hazard and reported it immediately."
];

const VARIETY_APPOINTMENTS = [
  { title: "Monthly Site Audit", notes: "Reviewing standards with client." },
  { title: "Staff Induction", notes: "Training new starter on H&S." },
  { title: "Emergency Deep Clean", notes: "A&E overflow area." },
  { title: "Equipment Maintenance", notes: "Service floor buffers." },
  { title: "KPI Review Meeting", notes: "Discussing quarterly performance." },
  { title: "Safety Inspection", notes: "Checking COSHH cupboards." },
  { title: "Consumables Inventory", notes: "Checking stock levels in stores." },
  { title: "Client Coffee Morning", notes: "Building relationship with site leads." },
  { title: "On-site Training Session", notes: "Bio-hazard spill response training." }
];

/**
 * Helper to manage multiple batches to avoid the 500 operation limit
 */
class BatchManager {
  private count = 0;
  private batch: WriteBatch;
  constructor(private firestore: Firestore) {
    this.batch = writeBatch(this.firestore);
  }

  async set(ref: any, data: any, options?: any) {
    this.batch.set(ref, data, options);
    this.count++;
    if (this.count >= 450) {
      await this.commit();
    }
  }

  async commit() {
    if (this.count > 0) {
      await this.batch.commit();
      this.batch = writeBatch(this.firestore);
      this.count = 0;
    }
  }
}

export async function seedDemoData(firestore: Firestore, hubId: string, email: string, isAddenbrookes = false) {
  const hubRef = doc(firestore, 'userProfiles', hubId);
  const hubSnap = await getDoc(hubRef);

  // Bumped to V6 to include Addenbrookes Lot 4 data
  const versionFlag = isAddenbrookes ? 'isAddenbrookesSeededV6' : 'isDemoSeededV6';
  if (hubSnap.exists() && hubSnap.data()[versionFlag]) {
    return;
  }

  const bm = new BatchManager(firestore);
  const activeSites = isAddenbrookes ? ADDENBROOKES_SITES : SITES;

  // 1. Initialize Hub
  await bm.set(hubRef, {
    id: hubId,
    name: isAddenbrookes ? "Excellerate Services - Addenbrooke's Lot 4" : "Demo Operational Hub",
    email: email,
    members: { [hubId.replace('hub-', '')]: 'owner' },
    enabledTabs: [
      'summary', 'risk', 'gold-standard', 'portfolio', 'sites', 
      'cleaners', 'action-plan', 'tasks', 'conversation-log', 
      'good-news', 'audits', 'audit-history', 'supplies', 
      'company-schedule', 'leave-calendar', 'monthly-leave', 
      'availability', 'diary', 'directions'
    ],
    [versionFlag]: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // 2. Seed Sites
  const siteIds: string[] = [];
  const sitesMap: Record<string, any> = {};
  activeSites.forEach((name, index) => {
    const siteRef = doc(collection(firestore, 'userProfiles', hubId, 'sites'));
    const siteData = {
      id: siteRef.id,
      name,
      siteCode: `ABC-${index + 100}`,
      status: index === 0 ? 'Gold Star Site' : (index % 4 === 0 ? 'Site under action plan' : 'No Concerns'),
      userProfileId: hubId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    siteIds.push(siteRef.id);
    sitesMap[name] = siteData;
    bm.set(siteRef, siteData);
  });

  // 3. Seed Cleaners
  const cleanerIds: string[] = [];
  const cleanerMap: Record<string, any> = {};
  CLEANERS.forEach((c, index) => {
    const cleanerRef = doc(collection(firestore, 'userProfiles', hubId, 'cleaners'));
    const cleanerData = {
      id: cleanerRef.id,
      name: c.name,
      rating: index === 0 ? 'Gold Star Cleaner' : (index % 5 === 0 ? 'Under action plan' : 'No Concerns'),
      notes: `Role: ${c.role}`,
      holidayAllowance: 20,
      userProfileId: hubId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    cleanerIds.push(cleanerRef.id);
    cleanerMap[c.name] = cleanerData;
    bm.set(cleanerRef, cleanerData);
  });

  // 4. Seed Audit History 2026
  for (const siteId of siteIds.slice(0, 10)) { // Limit to first 10 sites for audit history to save tokens/time
    for (let month = 1; month <= 12; month++) {
      const auditId = `${siteId}-2026-${month}`;
      const score = 92 + Math.floor(Math.random() * 9); // 92-100%
      await bm.set(doc(firestore, 'userProfiles', hubId, 'audits', auditId), {
        id: auditId,
        siteId,
        month,
        year: 2026,
        status: 'Completed',
        score,
        auditor: month % 3 === 0 ? 'Supervisor' : 'Manager',
        bookedDate: `2026-${month.toString().padStart(2, '0')}-15`,
        bookedTime: '10:00'
      });
    }
  }

  // 5. Seed Schedule
  for (let index = 0; index < siteIds.length; index++) {
    const siteName = activeSites[index];
    const cleanerName = CLEANERS[index % CLEANERS.length].name;
    const scheduleRef = doc(collection(firestore, 'userProfiles', hubId, 'cleaningScheduleEntries'));
    await bm.set(scheduleRef, {
      id: scheduleRef.id,
      site: siteName,
      cleaner: cleanerName,
      start: "22:00",
      finish: "06:00",
      userProfileId: hubId
    });
  }

  // 6. Seed Good News
  for (let index = 0; index < GOOD_NEWS.length; index++) {
    const newsRef = doc(collection(firestore, 'userProfiles', hubId, 'goodNews'));
    await bm.set(newsRef, {
      id: newsRef.id,
      personName: CLEANERS[index % CLEANERS.length].name,
      personType: 'Cleaner',
      siteName: activeSites[index % activeSites.length],
      date: `2026-06-10`,
      description: GOOD_NEWS[index],
      acknowledged: index % 2 === 0,
      acknowledgementNotes: index % 2 === 0 ? "Thank you card sent." : ""
    });
  }

  // 7. Seed Diary Appointments - 2026
  const anchorTasks = [
    { title: "Daily Operational Briefing", assignee: "Manager", start: "08:30", end: "09:00" },
    { title: "Daily Team Stand-up", assignee: "Supervisor", start: "09:00", end: "09:30" },
    { title: "Vehicle & Kit Inspection", assignee: "Mobile Cleaner", start: "08:00", end: "08:30" }
  ];

  for (const task of anchorTasks) {
    const appRef = doc(collection(firestore, 'userProfiles', hubId, 'appointments'));
    await bm.set(appRef, {
      id: appRef.id,
      title: task.title,
      date: "2026-01-01",
      assignee: task.assignee,
      startTime: task.start,
      endTime: task.end,
      notes: "Daily standard operating procedure.",
      recurrence: 'daily',
      recurrenceEndDate: "2026-12-31"
    });
  }

  await bm.commit();
}
