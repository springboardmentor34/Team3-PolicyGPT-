import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Scheme } from '../models/scheme.model';

@Injectable({ providedIn: 'root' })
export class SchemeService {
  private readonly MOCK_DELAY = 400;

  private readonly schemes: Scheme[] = [
    {
      id: 'sch-001',
      name: 'PM Kisan Samman Nidhi',
      description: 'Direct income support of ₹6,000 per year to eligible farmer families across the country.',
      category: 'Agriculture',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      state: 'All India',
      status: 'active',
      launchDate: '2019-02-24',
      applicationDeadline: undefined,
      benefits: ['₹6,000/year in three installments', 'Direct bank transfer'],
      eligibility: ['Small and marginal landholding farmer families'],
      requiredDocuments: ['Aadhaar Card', 'Land Records', 'Bank Passbook'],
      applicationProcess: ['Register on PM-Kisan portal', 'Submit land & bank details', 'Verification by state officials'],
      beneficiaries: 110000000,
      budget: '₹60,000 Cr',
    },
    {
      id: 'sch-002',
      name: 'Ayushman Bharat – PMJAY',
      description: 'Health insurance cover of ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
      category: 'Healthcare',
      ministry: 'Ministry of Health & Family Welfare',
      state: 'All India',
      status: 'active',
      launchDate: '2018-09-23',
      benefits: ['₹5,00,000 health cover per family', 'Cashless treatment at empaneled hospitals'],
      eligibility: ['Families identified under SECC 2011 database'],
      requiredDocuments: ['Aadhaar Card', 'Ration Card', 'Income Certificate'],
      applicationProcess: ['Check eligibility on PMJAY portal', 'Visit nearest Ayushman center', 'Generate e-card'],
      beneficiaries: 550000000,
      budget: '₹7,200 Cr',
    },
    {
      id: 'sch-003',
      name: 'Beti Bachao Beti Padhao',
      description: 'A national campaign to improve the child sex ratio and promote education for girl children.',
      category: 'Women & Child',
      ministry: 'Ministry of Women & Child Development',
      state: 'All India',
      status: 'active',
      launchDate: '2015-01-22',
      benefits: ['Awareness & advocacy support', 'Scholarship linkage for girl child education'],
      eligibility: ['Families with girl child below 18 years'],
      requiredDocuments: ['Birth Certificate', 'Aadhaar Card'],
      applicationProcess: ['Register through Anganwadi center', 'Submit birth documents'],
      beneficiaries: 30000000,
      budget: '₹848 Cr',
    },
    {
      id: 'sch-004',
      name: 'Stand-Up India Scheme',
      description: 'Facilitates bank loans between ₹10 lakh and ₹1 crore to SC/ST and women entrepreneurs.',
      category: 'Economy',
      ministry: 'Ministry of Finance',
      state: 'All India',
      status: 'active',
      launchDate: '2016-04-05',
      applicationDeadline: '2026-12-31',
      benefits: ['Bank loans from ₹10 lakh to ₹1 crore', 'Handholding support'],
      eligibility: ['SC/ST and/or women entrepreneurs above 18 years'],
      requiredDocuments: ['Aadhaar Card', 'Caste Certificate (if applicable)', 'Business Plan'],
      applicationProcess: ['Apply via Stand-Up India portal', 'Bank appraisal', 'Loan sanction & disbursement'],
      beneficiaries: 210000,
      budget: '₹5,000 Cr',
    },
    {
      id: 'sch-005',
      name: 'PM Awas Yojana (Urban)',
      description: 'Provides affordable pucca housing to eligible urban poor and economically weaker sections.',
      category: 'Housing',
      ministry: 'Ministry of Housing & Urban Affairs',
      state: 'All India',
      status: 'upcoming',
      launchDate: '2024-08-01',
      applicationDeadline: '2026-03-31',
      benefits: ['Interest subsidy up to ₹2.67 lakh', 'Direct construction assistance'],
      eligibility: ['EWS/LIG families without a pucca house'],
      requiredDocuments: ['Income Certificate', 'Aadhaar Card', 'Property Documents'],
      applicationProcess: ['Apply online via PMAY-U portal', 'Document verification', 'Sanction & fund release'],
      beneficiaries: 12000000,
      budget: '₹48,000 Cr',
    },
  ];

  getAllSchemes(): Observable<Scheme[]> {
    return of(this.schemes).pipe(delay(this.MOCK_DELAY));
  }

  getSchemeById(id: string): Observable<Scheme | undefined> {
    return of(this.schemes.find((s) => s.id === id)).pipe(delay(this.MOCK_DELAY));
  }

  getLatestSchemes(limit = 4): Observable<Scheme[]> {
    return of([...this.schemes].reverse().slice(0, limit)).pipe(delay(this.MOCK_DELAY));
  }
}
