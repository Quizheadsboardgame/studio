'use client';

import { Firestore, collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const PROFESSIONAL_SITES = [
  { name: 'CLINICAL SCHOOLS', code: '1' },
  { name: 'ISLAND RESEARCH BUILDING - IRB', code: '2' },
  { name: 'BAY 13', code: '2' },
  { name: 'CLIFFORD ALLBUTT BUILDING - CAB', code: '4' },
  { name: 'GRANTCHESTER HOUSE', code: '4' },
  { name: 'JEFFREY CHEAH (CAPELLA)', code: '5' },
  { name: 'BARTON HOUSE', code: '6' },
  { name: 'COTON HOUSE', code: '6' },
  { name: 'IMS LEVELS 4&5', code: '7' },
  { name: 'MRC EPIDEMIOLOGY LEVEL 3', code: '7' },
  { name: 'ACCI LEVEL 6', code: '8' },
  { name: 'OBS', code: '9' },
  { name: 'OLD IMS - LAB BLOCK 4', code: '10' },
  { name: 'MEDICINE LEVEL 5', code: '10' },
  { name: 'NEURO SPACE', code: '10' },
  { name: 'PAEDIATRICS LEVEL 8', code: '10' },
  { name: 'P&A - PSYCHIATRY & ANAESTHETICS LEVEL 4', code: '10' },
  { name: 'SURGERY & RHEUMATOLOGY LEVEL 6 HUB', code: '10' },
  { name: 'SURGERY LEVEL 9', code: '10' },
  { name: 'X RAY BLOCK RADIOLOGY LEVEL 5', code: '11' },
  { name: 'CEDAR', code: '12' },
  { name: 'TMS F&G LEVEL 2', code: '12' },
  { name: 'WBIC RPU BASEMENT', code: '13' },
  { name: 'WOLFSON BRAIN', code: '13' },
  { name: 'HERSCHEL SMITH BUILDING - HSB', code: '14' },
  { name: 'EAST FORVIE', code: '14' },
  { name: 'JOHN VAN GEEST - JVG', code: '14' },
  { name: 'WEST FORVIE', code: '14' },
  { name: 'STRAGEWAYS (SLR)', code: '15' },
  { name: 'HLRI', code: '17' },
  { name: 'ANNE MCLAREN', code: 'Not on map' },
  { name: 'E7 BUILDING', code: 'Not on map' },
  { name: 'POST DOC BUILDING', code: 'Not on map' }
];

const PROFESSIONAL_CLEANERS = [
  'Petros Karas',
  'Vania Silva',
  'Maria Santos',
  'John O’Shea',
  'Elena Popa',
  'Ahmed Hassan',
  'Sonia Gupta',
  'Ricardo Gomes',
  'Tatiana Volkov',
  'Liam Murphy',
  'Sarah Jenkins',
  'Kofi Mensah',
  'Fatima Zahra',
  'Andrzej Nowak',
  'Chen Wei',
  'Aisha Bello',
  'Dimitris Papadopoulos',
  'Ingrid Nielsen',
  'Miguel Fernandez',
  'Yuki Tanaka'
];

class BatchManager {
  private batch: any;
  private count = 0;
  private currentPath: string = '';

  constructor(private db: Firestore, private hubId: string) {
    this.batch = writeBatch(this.db);
  }

  async add(ref: any, data: any) {
    this.currentPath = ref.path;
    this.batch.set(ref, data, { merge: true });
    this.count++;
    if (this.count >= 400) {
      await this.commit();
    }
  }

  async delete(ref: any) {
    this.currentPath = ref.path;
    this.batch.delete(ref);
    this.count++;
    if (this.count >= 400) {
      await this.commit();
    }
  }

  async commit() {
    if (this.count > 0) {
      try {
        await this.batch.commit();
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: this.currentPath || `/userProfiles/${this.hubId}`,
            operation: 'write',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        }
        throw error;
      }
      this.batch = writeBatch(this.db);
      this.count = 0;
    }
  }
}

export async function restoreProfessionalData(db: Firestore, hubId: string) {
  const bm = new BatchManager(db, hubId);

  // 0. Comprehensive Wipe
  const subCollections = [
    'sites', 'cleaners', 'cleaningScheduleEntries', 'audits', 'appointments', 
    'tasks', 'conversations', 'goodNews', 'supplyOrders', 'actionPlans', 'leave'
  ];

  for (const sub of subCollections) {
    const colRef = collection(db, 'userProfiles', hubId, sub);
    let snapshot;
    try {
      snapshot = await getDocs(colRef);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: colRef.path,
          operation: 'list',
        } satisfies SecurityRuleContext));
        continue;
      }
      throw error;
    }

    for (const d of snapshot.docs) {
      if (sub === 'sites') {
        const consumablesRef = collection(db, 'userProfiles', hubId, 'sites', d.id, 'consumables');
        let consumablesSnapshot;
        try {
          consumablesSnapshot = await getDocs(consumablesRef);
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: consumablesRef.path,
              operation: 'list',
            } satisfies SecurityRuleContext));
            continue;
          }
          throw error;
        }
        for (const cd of consumablesSnapshot.docs) {
          await bm.delete(cd.ref);
        }
      }
      await bm.delete(d.ref);
    }
  }
  await bm.commit();

  // 1. Seed Professional Sites
  const siteMap = new Map<string, string>();
  for (const siteInfo of PROFESSIONAL_SITES) {
    const siteRef = doc(collection(db, 'userProfiles', hubId, 'sites'));
    siteMap.set(siteInfo.name, siteRef.id);
    await bm.add(siteRef, {
      id: siteRef.id,
      name: siteInfo.name,
      siteCode: siteInfo.code,
      status: siteInfo.name === 'BAY 13' ? 'Client concerns' : 'No Concerns',
      userProfileId: hubId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // 2. Seed Professional Cleaners
  for (const cleanerName of PROFESSIONAL_CLEANERS) {
    const cleanerRef = doc(collection(db, 'userProfiles', hubId, 'cleaners'));
    await bm.add(cleanerRef, {
      id: cleanerRef.id,
      name: cleanerName,
      rating: cleanerName === 'Petros Karas' ? 'Gold Star Cleaner' : 'No Concerns',
      holidayAllowance: 20,
      userProfileId: hubId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // 3. Seed Schedule Baseline
  const shifts = [
    { site: 'CLINICAL SCHOOLS', cleaner: 'Petros Karas', start: '06:00', finish: '09:00' },
    { site: 'ISLAND RESEARCH BUILDING - IRB', cleaner: 'Vania Silva', start: '17:00', finish: '20:00' },
    { site: 'BAY 13', cleaner: 'Maria Santos', start: '18:00', finish: '21:00' },
    { site: 'CLIFFORD ALLBUTT BUILDING - CAB', cleaner: 'John O’Shea', start: '05:30', finish: '08:30' },
    { site: 'JEFFREY CHEAH (CAPELLA)', cleaner: 'Elena Popa', start: '17:30', finish: '20:30' },
  ];

  for (const shift of shifts) {
    const scheduleRef = doc(collection(db, 'userProfiles', hubId, 'cleaningScheduleEntries'));
    await bm.add(scheduleRef, {
      id: scheduleRef.id,
      ...shift,
      userProfileId: hubId,
    });
  }

  // 4. Seed Historical Audits for March 2026
  const audits = [
    { site: 'CLINICAL SCHOOLS', score: 98, date: '2026-03-15' },
    { site: 'BAY 13', score: 85, date: '2026-03-12' },
    { site: 'CLIFFORD ALLBUTT BUILDING - CAB', score: 100, date: '2026-03-18' },
  ];

  for (const audit of audits) {
    const siteId = siteMap.get(audit.site);
    if (!siteId) continue;
    const auditDate = parseISO(audit.date);
    const auditId = `${siteId}-${auditDate.getFullYear()}-${auditDate.getMonth() + 1}`;
    const auditRef = doc(db, 'userProfiles', hubId, 'audits', auditId);
    await bm.add(auditRef, {
      id: auditId,
      siteId,
      year: auditDate.getFullYear(),
      month: auditDate.getMonth() + 1,
      status: 'Completed',
      score: audit.score,
      bookedDate: audit.date,
      bookedTime: '10:00',
      auditor: 'Manager',
    });
  }

  // 5. Seed March 19th, 2026 Dataset (Appointments & Tasks)
  const appointments = [
    { title: 'Urgent Site Inspection', date: '2026-03-19', site: 'BAY 13', assignee: 'Manager', startTime: '09:00', endTime: '10:30' },
    { title: 'Lot 4 Monthly Sync', date: '2026-03-19', assignee: 'Supervisor', startTime: '14:00', endTime: '15:30' },
    { title: 'New Starter Induction: Yuki Tanaka', date: '2026-03-20', site: 'CLINICAL SCHOOLS', assignee: 'Manager', startTime: '11:00', endTime: '12:00' },
  ];

  for (const app of appointments) {
    const appRef = doc(collection(db, 'userProfiles', hubId, 'appointments'));
    await bm.add(appRef, {
      id: appRef.id,
      ...app,
      recurrence: 'none',
      recurrenceEndDate: null,
      notes: 'Standard Lot 4 operational sync.',
    });
  }

  const tasks = [
    { description: 'Review Bay 13 cleaning standards', dueDate: '2026-03-19', site: 'BAY 13', assignee: 'Manager', completed: false },
    { description: 'Verify inventory at CAB', dueDate: '2026-03-19', site: 'CLIFFORD ALLBUTT BUILDING - CAB', assignee: 'Supervisor', completed: false },
    { description: 'Order floor polish for IRB', dueDate: '2026-03-21', site: 'ISLAND RESEARCH BUILDING - IRB', assignee: 'Supervisor', completed: false },
  ];

  for (const task of tasks) {
    const taskRef = doc(collection(db, 'userProfiles', hubId, 'tasks'));
    await bm.add(taskRef, {
      id: taskRef.id,
      ...task,
    });
  }

  await bm.commit();
}

function parseISO(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}