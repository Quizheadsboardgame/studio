'use client';

import { Firestore, collection, doc, writeBatch, getDocs } from 'firebase/firestore';

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

  constructor(private db: Firestore) {
    this.batch = writeBatch(this.db);
  }

  async add(ref: any, data: any) {
    this.batch.set(ref, data, { merge: true });
    this.count++;
    if (this.count >= 400) {
      await this.commit();
    }
  }

  async delete(ref: any) {
    this.batch.delete(ref);
    this.count++;
    if (this.count >= 400) {
      await this.commit();
    }
  }

  async commit() {
    if (this.count > 0) {
      await this.batch.commit();
      this.batch = writeBatch(this.db);
      this.count = 0;
    }
  }
}

/**
 * Restores the account to the strictly professional state
 * by removing all demo data and re-importing the Lot 4 roster.
 */
export async function restoreProfessionalData(db: Firestore, hubId: string) {
  const bm = new BatchManager(db);

  // 1. Wipe ALL existing operational collections to ensure a clean slate
  const subCollections = [
    'sites', 'cleaners', 'cleaningScheduleEntries', 'audits', 'appointments', 
    'tasks', 'conversations', 'goodNews', 'supplyOrders', 'actionPlans', 'leave'
  ];

  for (const sub of subCollections) {
    const colRef = collection(db, 'userProfiles', hubId, sub);
    const snapshot = await getDocs(colRef);
    for (const d of snapshot.docs) {
      await bm.delete(d.ref);
    }
  }
  await bm.commit();

  // 2. Re-import Sites (Lot 4 Specific with codes)
  for (const siteInfo of PROFESSIONAL_SITES) {
    const siteRef = doc(collection(db, 'userProfiles', hubId, 'sites'));
    await bm.add(siteRef, {
      id: siteRef.id,
      name: siteInfo.name,
      siteCode: siteInfo.code,
      status: 'No Concerns',
      userProfileId: hubId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // 3. Re-import Cleaners (Lot 4 Specific)
  for (const cleanerName of PROFESSIONAL_CLEANERS) {
    const cleanerRef = doc(collection(db, 'userProfiles', hubId, 'cleaners'));
    await bm.add(cleanerRef, {
      id: cleanerRef.id,
      name: cleanerName,
      rating: 'No Concerns',
      holidayAllowance: 20,
      userProfileId: hubId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  await bm.commit();
}
