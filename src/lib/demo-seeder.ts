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

  // Bumped to V5 to include Action Plans
  if (hubSnap.exists() && hubSnap.data().isDemoSeededV5) {
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
    isDemoSeededV5: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // 2. Seed Sites
  const siteIds: string[] = [];
  const sitesMap: Record<string, any> = {};
  SITES.forEach((name, index) => {
    const siteRef = doc(collection(firestore, 'userProfiles', hubId, 'sites'));
    const siteData = {
      id: siteRef.id,
      name,
      siteCode: `SITE-00${index + 1}`,
      status: index === 0 ? 'Gold Star Site' : (index % 3 === 0 ? 'Site under action plan' : 'No Concerns'),
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
  for (const siteId of siteIds) {
    for (let month = 1; month <= 12; month++) {
      const auditId = `${siteId}-2026-${month}`;
      const score = 90 + Math.floor(Math.random() * 11); // 90-100%
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
    const siteName = SITES[index];
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
    const desc = GOOD_NEWS[index];
    const newsRef = doc(collection(firestore, 'userProfiles', hubId, 'goodNews'));
    await bm.set(newsRef, {
      id: newsRef.id,
      personName: CLEANERS[index % CLEANERS.length].name,
      personType: 'Cleaner',
      siteName: SITES[index % SITES.length],
      date: `2026-06-10`,
      description: desc,
      acknowledged: index % 2 === 0,
      acknowledgementNotes: index % 2 === 0 ? "Thank you card sent." : ""
    });
  }

  // 7. Seed Leave & Cover (Holidays)
  for (let month = 1; month <= 12; month++) {
    const cleanerName = CLEANERS[month % CLEANERS.length].name;
    const leaveDate = `2026-${month.toString().padStart(2, '0')}-10`;
    const leaveRef = doc(collection(firestore, 'userProfiles', hubId, 'leave'));
    
    const siteToCover = SITES[month % SITES.length];
    const coverCleaner = CLEANERS[(month + 5) % CLEANERS.length].name;

    await bm.set(leaveRef, {
      id: leaveRef.id,
      cleanerId: cleanerMap[cleanerName].id,
      cleanerName,
      type: month % 4 === 0 ? 'sick' : 'holiday',
      date: leaveDate,
      coverAssignments: [
        { site: siteToCover, coverCleanerName: coverCleaner }
      ]
    });
  }

  // 8. Seed Action Plans
  // A Site Action Plan
  const siteActionPlanRef = doc(firestore, 'userProfiles', hubId, 'actionPlans', sitesMap["Emergency Dept"].id);
  await bm.set(siteActionPlanRef, {
    id: sitesMap["Emergency Dept"].id,
    targetName: "Emergency Dept",
    targetType: "site",
    notes: "Site standards have slipped in the waiting area. Immediate attention required.",
    tasks: [
      { id: "ap-task-1", description: "Deep clean high-frequency touch points", dueDate: format(new Date(), 'yyyy-MM-dd'), completed: false },
      { id: "ap-task-2", description: "Review and update COSHH logs", dueDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'), completed: false },
      { id: "ap-task-3", description: "Shadow new morning team for quality check", dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), completed: true }
    ]
  });

  // A Cleaner Action Plan
  const cleanerActionPlanRef = doc(firestore, 'userProfiles', hubId, 'actionPlans', cleanerMap["Fiona Gallagher"].id);
  await bm.set(cleanerActionPlanRef, {
    id: cleanerMap["Fiona Gallagher"].id,
    targetName: "Fiona Gallagher",
    targetType: "cleaner",
    notes: "Improvement plan for supervision consistency across multiple lots.",
    tasks: [
      { id: "ap-task-4", description: "Complete advanced supervision training module", dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'), completed: false },
      { id: "ap-task-5", description: "Conduct 5 joint audits with manager", dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), completed: false }
    ]
  });

  // 9. Seed Diary Appointments - EVERY DAY FOR ALL DIARIES
  const start2026 = startOfYear(new Date('2026-01-01'));
  const end2026 = endOfYear(new Date('2026-12-31'));
  const allDaysOf2026 = eachDayOfInterval({ start: start2026, end: end2026 });

  // A. Anchor Daily Tasks
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

  // B. Varied Unique Tasks throughout the year
  const roles = ["Manager", "Supervisor", "Mobile Cleaner"];
  
  for (let dayIndex = 0; dayIndex < allDaysOf2026.length; dayIndex++) {
    const day = allDaysOf2026[dayIndex];
    const dateStr = format(day, 'yyyy-MM-dd');
    
    const role = roles[dayIndex % roles.length];
    const variety = VARIETY_APPOINTMENTS[dayIndex % VARIETY_APPOINTMENTS.length];
    
    const appRef = doc(collection(firestore, 'userProfiles', hubId, 'appointments'));
    await bm.set(appRef, {
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

    if (day.getDay() === 6) {
      const satRef = doc(collection(firestore, 'userProfiles', hubId, 'appointments'));
      await bm.set(satRef, {
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

    if (day.getDay() === 0) {
      const sunRef = doc(collection(firestore, 'userProfiles', hubId, 'appointments'));
      await bm.set(sunRef, {
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
  }

  await bm.commit();
}
