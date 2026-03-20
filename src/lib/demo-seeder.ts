'use client';

import { Firestore, doc, collection, writeBatch, getDoc } from 'firebase/firestore';
import { format, addDays, parseISO } from 'date-fns';

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

const APPOINTMENTS = [
  { title: "Monthly Site Audit", assignee: "Manager", notes: "Reviewing standards with client." },
  { title: "Staff Induction", assignee: "Supervisor", notes: "Training new starter on H&S." },
  { title: "Emergency Deep Clean", assignee: "Mobile Cleaner", notes: "A&E overflow area." },
  { title: "Equipment Maintenance", assignee: "Mobile Cleaner", notes: "Service floor buffers." },
  { title: "KPI Review Meeting", assignee: "Manager", notes: "Discussing quarterly performance." },
  { title: "Safety Inspection", assignee: "Supervisor", notes: "Checking COSHH cupboards." }
];

export async function seedDemoData(firestore: Firestore, hubId: string, email: string) {
  const hubRef = doc(firestore, 'userProfiles', hubId);
  const hubSnap = await getDoc(hubRef);

  if (hubSnap.exists() && hubSnap.data().isDemoSeeded) {
    return;
  }

  const batch = writeBatch(firestore);

  // 1. Initialize Hub
  batch.set(hubRef, {
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
    batch.set(siteRef, {
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
    batch.set(cleanerRef, {
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
      batch.set(doc(firestore, 'userProfiles', hubId, 'audits', auditId), {
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
    batch.set(scheduleRef, {
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
    batch.set(newsRef, {
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
    
    // Assign some cover for these shifts
    const siteToCover = SITES[month % SITES.length];
    const coverCleaner = CLEANERS[(month + 5) % CLEANERS.length].name;

    batch.set(leaveRef, {
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

  // 8. Seed Diary Appointments for Roles
  for (let i = 1; i <= 12; i++) {
    APPOINTMENTS.forEach((app, idx) => {
      const appRef = doc(collection(firestore, 'userProfiles', hubId, 'appointments'));
      const dateStr = `2026-${i.toString().padStart(2, '0')}-${(idx + 5).toString().padStart(2, '0')}`;
      batch.set(appRef, {
        id: appRef.id,
        title: app.title,
        date: dateStr,
        assignee: app.assignee,
        site: SITES[idx % SITES.length],
        startTime: "09:00",
        endTime: "11:00",
        notes: app.notes,
        recurrence: 'none'
      });
    });
  }

  await batch.commit();
}
