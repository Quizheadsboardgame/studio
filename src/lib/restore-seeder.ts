'use client';

import { Firestore, collection, doc, writeBatch, getDocs } from 'firebase/firestore';

const PROFESSIONAL_SITES = [
  'CLINICAL SCHOOLS',
  'ISLAND RESEARCH BUILDING - IRB',
  'CLIFFORD ALLBUTT BUILDING - CAB',
  'GRANTCHESTER HOUSE',
  'JEFFREY CHEAH (CAPELLA)',
  'BARTON HOUSE',
  'COTON HOUSE',
  'IMS LEVELS 4&5',
  'MRC EPIDEMIOLOGY LEVEL 3',
  'ACCI LEVEL 6',
  'OBS',
  'OLD IMS - LAB BLOCK 4',
  'MEDICINE LEVEL 5',
  'NEURO SPACE',
  'PAEDIATRICS LEVEL 8',
  'P&A - PSYCHIATRY & ANAESTHETICS LEVEL 4',
  'SURGERY & RHEUMATOLOGY LEVEL 6 HUB',
  'SURGERY LEVEL 9',
  'X RAY BLOCK RADIOLOGY LEVEL 5',
  'CEDAR',
  'TMS F&G LEVEL 2',
  'WBIC RPU BASEMENT',
  'WOLFSON BRAIN',
  'HERSCHEL SMITH BUILDING - HSB',
  'EAST FORVIE',
  'JOHN VAN GEEST - JVG',
  'WEST FORVIE',
  'STRAGEWAYS (SLR)',
  'HLRI',
  'ANNE MCLAREN',
  'BAY 13',
  'E7 BUILDING',
  'POST DOC BUILDING'
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

  // 2. Re-import Sites (Lot 4 Specific)
  for (const siteName of PROFESSIONAL_SITES) {
    const siteRef = doc(collection(db, 'userProfiles', hubId, 'sites'));
    await bm.add(siteRef, {
      id: siteRef.id,
      name: siteName,
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
