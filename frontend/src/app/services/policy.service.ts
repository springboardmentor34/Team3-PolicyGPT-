import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Policy } from '../models/policy.model';

/**
 * PolicyService
 * ----------------------------------------------------------------------
 * Currently backed by static dummy data so the UI can be fully built and
 * demoed without a backend. Every method returns an Observable with the
 * exact shape a future FastAPI REST integration would return, so swapping
 * `of(DATA)` for an HttpClient call is a drop-in replacement — no
 * component changes required.
 * ----------------------------------------------------------------------
 */
@Injectable({ providedIn: 'root' })
export class PolicyService {
  private readonly MOCK_DELAY = 400;

  private readonly policies: Policy[] = [
    {
      id: 'pol-001',
      title: 'National Education Policy Framework',
      description:
        'A comprehensive policy aimed at transforming the education system through curriculum reform, digital learning, and skill development.',
      category: 'Education',
      department: 'Ministry of Education',
      state: 'All India',
      status: 'active',
      publishedDate: '2024-01-15',
      effectiveDate: '2024-04-01',
      benefits: ['Free digital learning resources', 'Skill certification support', 'Scholarship linkage'],
      eligibility: ['All students enrolled in recognized institutions'],
      requiredDocuments: ['Aadhaar Card', 'Institution ID', 'Income Certificate'],
      tags: ['education', 'reform', 'digital'],
      viewCount: 15230,
    },
    {
      id: 'pol-002',
      title: 'Rural Healthcare Infrastructure Policy',
      description:
        'Strengthens primary healthcare centers in rural areas with modern equipment, telemedicine, and trained staff.',
      category: 'Healthcare',
      department: 'Ministry of Health & Family Welfare',
      state: 'All India',
      status: 'active',
      publishedDate: '2023-11-10',
      effectiveDate: '2024-01-01',
      benefits: ['Free health checkups', 'Telemedicine access', 'Emergency ambulance services'],
      eligibility: ['Residents of rural and semi-urban areas'],
      requiredDocuments: ['Aadhaar Card', 'Residence Proof'],
      tags: ['health', 'rural', 'infrastructure'],
      viewCount: 9870,
    },
    {
      id: 'pol-003',
      title: 'Green Energy Transition Policy',
      description:
        'Promotes adoption of renewable energy sources through subsidies, tax rebates, and infrastructure support for solar and wind projects.',
      category: 'Environment',
      department: 'Ministry of New & Renewable Energy',
      state: 'All India',
      status: 'upcoming',
      publishedDate: '2024-06-01',
      effectiveDate: '2024-09-01',
      benefits: ['Subsidy on solar installation', 'Tax rebates for green industries'],
      eligibility: ['Households and businesses investing in renewable energy'],
      requiredDocuments: ['Property Documents', 'Aadhaar Card', 'Bank Details'],
      tags: ['energy', 'environment', 'sustainability'],
      viewCount: 5210,
    },
    {
      id: 'pol-004',
      title: 'Women Entrepreneurship Development Policy',
      description:
        'Provides financial and mentorship support to women-led startups and small businesses across the country.',
      category: 'Economy',
      department: 'Ministry of Skill Development & Entrepreneurship',
      state: 'All India',
      status: 'active',
      publishedDate: '2023-08-20',
      effectiveDate: '2023-10-01',
      benefits: ['Collateral-free loans', 'Mentorship programs', 'Market access support'],
      eligibility: ['Women aged 18+ starting or running a business'],
      requiredDocuments: ['Aadhaar Card', 'Business Registration', 'Bank Details'],
      tags: ['women', 'entrepreneurship', 'economy'],
      viewCount: 12040,
    },
    {
      id: 'pol-005',
      title: 'Urban Housing for All Policy',
      description:
        'Facilitates affordable housing for economically weaker sections through subsidized loans and direct construction support.',
      category: 'Housing',
      department: 'Ministry of Housing & Urban Affairs',
      state: 'All India',
      status: 'closed',
      publishedDate: '2022-03-05',
      effectiveDate: '2022-06-01',
      benefits: ['Interest subsidy on home loans', 'Direct financial assistance'],
      eligibility: ['Economically weaker & low income households'],
      requiredDocuments: ['Income Certificate', 'Aadhaar Card', 'Property Documents'],
      tags: ['housing', 'urban', 'subsidy'],
      viewCount: 20110,
    },
    {
      id: 'pol-006',
      title: 'Digital Agriculture Policy',
      description:
        'Integrates technology into farming practices through data-driven advisories, market linkage apps, and precision agriculture support.',
      category: 'Agriculture',
      department: 'Ministry of Agriculture & Farmers Welfare',
      state: 'All India',
      status: 'active',
      publishedDate: '2024-02-18',
      effectiveDate: '2024-05-01',
      benefits: ['Free crop advisory app', 'Market price alerts', 'Precision farming subsidy'],
      eligibility: ['Registered farmers and farmer producer organizations'],
      requiredDocuments: ['Land Records', 'Aadhaar Card', 'Bank Details'],
      tags: ['agriculture', 'digital', 'farmers'],
      viewCount: 7654,
    },
  ];

  getAllPolicies(): Observable<Policy[]> {
    return of(this.policies).pipe(delay(this.MOCK_DELAY));
  }

  getPolicyById(id: string): Observable<Policy | undefined> {
    return of(this.policies.find((p) => p.id === id)).pipe(delay(this.MOCK_DELAY));
  }

  getPopularCategories(): Observable<{ name: string; icon: string; count: number }[]> {
    return of([
      { name: 'Education', icon: 'school', count: 24 },
      { name: 'Healthcare', icon: 'local_hospital', count: 31 },
      { name: 'Agriculture', icon: 'agriculture', count: 18 },
      { name: 'Housing', icon: 'home_work', count: 12 },
      { name: 'Environment', icon: 'eco', count: 9 },
      { name: 'Economy', icon: 'trending_up', count: 27 },
    ]).pipe(delay(this.MOCK_DELAY));
  }

  searchPolicies(query: string): Observable<Policy[]> {
    const q = query.trim().toLowerCase();
    const results = q
      ? this.policies.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.department.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        )
      : this.policies;
    return of(results).pipe(delay(this.MOCK_DELAY));
  }
}
