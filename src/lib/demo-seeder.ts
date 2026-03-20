'use client';

import { Firestore, doc, collection, writeBatch, getDoc, type WriteBatch } from 'firebase/firestore';
import { format, addDays, parseISO, startOfYear, endOfYear, eachDayOfInterval } from 'date-fns';

const SITES = [
  "North Wing Clinic", "South Research Lab", "Main Reception", "Emergency Dept", 
  "Radiology Unit", "Pharmacy Central", "Staff Canteen", "Maternity Ward", 
  "Outpatients Suite", "Executive Offices"
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

export async function seedDemoData(firestore: Firestore, hubId: string, email: string) {
  const hubRef = doc(firestore, 'userProfiles', hubId);
  const hubSnap = await getDoc(hubRef);

  if (hubSnap.exists() && hubSnap.data().isDemoSeeded) {
    return;
  }

  const bm = new BatchManager(firestore);

  // 1. Initialize Hub
  await bm.set(hubRef, {
    id: hubId,
    name: "Demo Operational Hub",
    email: email,
    members: { [hubId.replace('hub-', '')]: 'owner' },
    enabledTabs: [
      'summary', 'risk', 'gold-standard', 'portfolio', 'sites', 
      'cleaners', 'action-plan', 'tasks', 'conversation-log', 
      'good-news', 'audits', 'audit-history', 'supplies', 
      'company-schedule', 'leave-calendar', 'monthly-leave', 
      'availability', 'diary', 'directions'
    ],
    isDemoSeeded: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // 2. Seed Sites
  const siteIds: string[] = [];
  SITES.forEach((name, index) => {
    const siteRef = doc(collection(firestore, 'userProfiles', hubId, 'sites'));
    siteIds.push(siteRef.id);
    bm.set(siteRef, {
      id: siteRef.id,
      name,
      siteCode: `SITE-00${index + 1}`,
      status: index === 0 ? 'Gold Star Site' : (index % 3 === 0 ? 'Client concerns' : 'No Concerns'),
      userProfileId: hubId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // 3. Seed Cleaners
  const cleanerIds: string[] = [];
  const cleanerMap: Record<string, string> = {};
  CLEANERS.forEach((c, index) => {
    const cleanerRef = doc(collection(firestore, 'userProfiles', hubId, 'cleaners'));
    cleanerIds.push(cleanerRef.id);
    cleanerMap[c.name] = cleanerRef.id;
    bm.set(cleanerRef, {
      id: cleanerRef.id,
      name: c.name,
      rating: index === 0 ? 'Gold Star Cleaner' : (index % 5 === 0 ? 'Needs retraining' : 'No Concerns'),
      notes: `Role: ${c.role}`,
      holidayAllowance: 20,
      userProfileId: hubId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // 4. Seed Audit History 2026
  siteIds.forEach(siteId => {
    for (let month = 1; month <= 12; month++) {
      const auditId = `${siteId}-2026-${month}`;
      const score = 90 + Math.floor(Math.random() * 11); // 90-100%
      bm.set(doc(firestore, 'userProfiles', hubId, 'audits', auditId), {
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
  });

  // 5. Seed Schedule
  siteIds.forEach((siteId, index) => {
    const siteName = SITES[index];
    const cleanerName = CLEANERS[index % CLEANERS.length].name;
    const scheduleRef = doc(collection(firestore, 'userProfiles', hubId, 'cleaningScheduleEntries'));
    bm.set(scheduleRef, {
      id: scheduleRef.id,
      site: siteName,
      cleaner: cleanerName,
      start: "22:00",
      finish: "06:00",
      userProfileId: hubId
    });
  });

  // 6. Seed Good News
  GOOD_NEWS.forEach((desc, index) => {
    const newsRef = doc(collection(firestore, 'userProfiles', hubId, 'goodNews'));
    bm.set(newsRef, {
      id: newsRef.id,
      personName: CLEANERS[index % CLEANERS.length].name,
      personType: 'Cleaner',
      siteName: SITES[index % SITES.length],
      date: `2026-06-10`,
      description: desc,
      acknowledged: index % 2 === 0,
      acknowledgementNotes: index % 2 === 0 ? "Thank you card sent." : ""
    });
  });

  // 7. Seed Leave & Cover (Holidays)
  for (let month = 1; month <= 12; month++) {
    const cleanerName = CLEANERS[month % CLEANERS.length].name;
    const leaveDate = `2026-${month.toString().padStart(2, '0')}-10`;
    const leaveRef = doc(collection(firestore, 'userProfiles', hubId, 'leave'));
    
    const siteToCover = SITES[month % SITES.length];
    const coverCleaner = CLEANERS[(month + 5) % CLEANERS.length].name;

    bm.set(leaveRef, {
      id: leaveRef.id,
      cleanerId: cleanerMap[cleanerName],
      cleanerName,
      type: month % 4 === 0 ? 'sick' : 'holiday',
      date: leaveDate,
      coverAssignments: [
        { site: siteToCover, coverCleanerName: coverCleaner }
      ]
    });
  }

  // 8. Seed Diary Appointments - EVERY DAY FOR ALL DIARIES
  const start2026 = startOfYear(new Date('2026-01-01'));
  const end2026 = endOfYear(new Date('2026-01-01'));
  const allDaysOf2026 = eachDayOfInterval({ start: start2026, end: end2026 });

  // A. Anchor Daily Tasks (Guarantees every day has at least one entry per role)
  const anchorTasks = [
    { title: "Daily Operational Briefing", assignee: "Manager", start: "08:30", end: "09:00" },
    { title: "Daily Team Stand-up", assignee: "Supervisor", start: "09:00", end: "09:30" },
    { title: "Vehicle & Kit Inspection", assignee: "Mobile Cleaner", start: "08:00", end: "08:30" }
  ];

  for (const task of anchorTasks) {
    const appRef = doc(collection(firestore, 'userProfiles', hubId, 'appointments'));
    bm.set(appRef, {
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

  // B. Varied Unique Tasks throughout the year (Adding ~365 * 1.5 unique appointments)
  const roles = ["Manager", "Supervisor", "Mobile Cleaner"];
  
  allDaysOf2026.forEach((day, dayIndex) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    
    // Add 1 unique varied task per day, rotating roles
    const role = roles[dayIndex % roles.length];
    const variety = VARIETY_APPOINTMENTS[dayIndex % VARIETY_APPOINTMENTS.length];
    
    const appRef = doc(collection(firestore, 'userProfiles', hubId, 'appointments'));
    bm.set(appRef, {
      id: appRef.id,
      title: variety.title,
      date: dateStr,
      assignee: role,
      site: SITES[dayIndex % SITES.length],
      startTime: "10:30",
      endTime: "12:00",
      notes: variety.notes,
      recurrence: 'none'
    });

    // Every Saturday, add an extra specific deep clean for the Mobile Cleaner
    if (day.getDay() === 6) {
      const satRef = doc(collection(firestore, 'userProfiles', hubId, 'appointments'));
      bm.set(satRef, {
        id: satRef.id,
        title: "Weekend Intensive Deep Clean",
        date: dateStr,
        assignee: "Mobile Cleaner",
        site: SITES[dayIndex % SITES.length],
        startTime: "09:00",
        endTime: "15:00",
        notes: "Full scrub and seal of high-traffic corridors.",
        recurrence: 'none'
      });
    }

    // Every Sunday, add a Manager KPI Prep session
    if (day.getDay() === 0) {
      const sunRef = doc(collection(firestore, 'userProfiles', hubId, 'appointments'));
      bm.set(sunRef, {
        id: sunRef.id,
        title: "Weekly KPI & Reporting",
        date: dateStr,
        assignee: "Manager",
        startTime: "14:00",
        endTime: "16:00",
        notes: "Compiling weekly statistics for regional management.",
        recurrence: 'none'
      });
    }
  });

  await bm.commit();
}
