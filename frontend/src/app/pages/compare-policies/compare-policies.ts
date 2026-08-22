import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { ComparisonService } from '../../services/comparison.service';
import { SchemeService } from '../../services/scheme.service';
import { PolicyService } from '../../services/policy.service';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './compare-policies.html',
  styleUrls: ['./compare-policies.scss']
})
export class CompareComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ================= USER =================

  userName = 'Sri';

  // ================= SEARCH =================

  search = '';

  // ================= COMPARE MODE =================

  compareMode: 'policy' | 'scheme' = 'scheme';

  // ================= OPTION LISTS =================
  // Loaded from the real database instead of being hardcoded, so the
  // dropdowns always reflect what's actually in the policies/schemes
  // tables.

  policyOptions: { id: number; name: string }[] = [];

  schemeOptions: { id: number; name: string }[] = [];

  get policies(): { id: number; name: string }[] {
    return this.compareMode === 'policy' ? this.policyOptions : this.schemeOptions;
  }

  // ================= MULTI-SELECT SLOTS (2-4 items) =================

  readonly minCompare = 2;

  readonly maxCompare = 4;

  selectedNames: string[] = ['', ''];

  comparedItems: any[] = [];

  get canAddMore(): boolean {
    return this.selectedNames.length < this.maxCompare;
  }

  get canRemove(): boolean {
    return this.selectedNames.length > this.minCompare;
  }

  // ================= CONSTRUCTOR =================

  constructor(
    private comparisonService: ComparisonService,
    private schemeService: SchemeService,
    private policyService: PolicyService
  ) {
    this.loadOptions();
  }

  // ================= LOAD OPTIONS =================

  loadOptions(): void {
    this.schemeService.getAllSchemes().subscribe({
      next: (response: any) => {
        this.schemeOptions = (response.data || []).map((s: any) => ({
          id: s.scheme_id,
          name: s.scheme_name
        }));
        this.initSelectionIfReady();
      },
      error: (error) => console.error('Failed to load schemes for comparison:', error)
    });

    this.policyService.getAllPolicies({ public_only: true }).subscribe({
      next: (response: any) => {
        this.policyOptions = (response.data || []).map((p: any) => ({
          id: p.policy_id,
          name: p.policy_name
        }));
        this.initSelectionIfReady();
      },
      error: (error) => console.error('Failed to load policies for comparison:', error)
    });
  }

  private initSelectionIfReady(): void {
    if (this.policies.length > 0 && !this.selectedNames[0]) {
      this.selectedNames[0] = this.policies[0].name;
      this.selectedNames[1] =
        this.policies.length > 1 ? this.policies[1].name : this.policies[0].name;
      this.runComparison();
    }
  }

  // ================= SWITCH MODE =================

  switchMode(mode: 'policy' | 'scheme'): void {
    if (this.compareMode === mode) return;

    this.compareMode = mode;
    this.selectedNames = ['', ''];
    this.comparedItems = [];

    if (this.policies.length > 0) {
      this.selectedNames[0] = this.policies[0].name;
      this.selectedNames[1] =
        this.policies.length > 1 ? this.policies[1].name : this.policies[0].name;
      this.runComparison();
    }
  }

  // ================= SLOT MANAGEMENT (Add / Remove up to 4) =================

  trackByIndex(index: number): number {
    return index;
  }

  addSlot(): void {
    if (!this.canAddMore) return;

    const used = new Set(this.selectedNames);
    const next = this.policies.find(p => !used.has(p.name));

    this.selectedNames.push(next ? next.name : '');
    this.onSelectionChange();
  }

  removeSlot(index: number): void {
    if (!this.canRemove) return;

    this.selectedNames.splice(index, 1);
    this.onSelectionChange();
  }

  onSelectionChange(): void {
    const filled = this.selectedNames.filter(n => !!n);

    if (filled.length >= this.minCompare) {
      this.runComparison();
    } else {
      this.comparedItems = [];
    }
  }

  // ================= COMPARE (2-4 items) =================

  runComparison(): void {

    const ids = this.selectedNames
      .map(name => this.policies.find(p => p.name === name))
      .filter((item): item is { id: number; name: string } => !!item)
      .map(item => item.id);

    if (ids.length < this.minCompare) {
      return;
    }

    const request$ = this.compareMode === 'policy'
      ? this.comparisonService.comparePoliciesMulti(ids)
      : this.comparisonService.compareSchemesMulti(ids);

    request$.subscribe({

      next: (response: any) => {

        const rawItems = this.compareMode === 'policy'
          ? response.policies
          : response.schemes;

        this.comparedItems = (rawItems || []).map((item: any) =>
          this.compareMode === 'policy'
            ? this.normalizePolicy(item)
            : this.normalizeScheme(item)
        );
      },

      error: (error) => {

        console.error('Comparison API Error:', error);

        alert(`Unable to compare these ${this.compareMode === 'policy' ? 'policies' : 'schemes'}. Please try again.`);
      }

    });
  }

  // ================= NORMALIZE =================
  // Both Policy and Scheme records get mapped to the same shape so the
  // template can render either mode without branching per field.

  private normalizePolicy(p: any): any {
    return {
      name: p.policy_name,
      category: p.category,
      ministry: p.ministry,
      department: p.department,
      government_level: p.government_level,
      state: p.state,
      status: p.status,
      approval_status: p.approval_status,
      deadline: p.effective_date || 'Ongoing',
      description: p.description,
      benefit: p.description || 'Not specified',
      eligibility: null,
      income: null,
      documents: p.document_url ? 'Official document available' : 'Not available',
      documentUrl: p.document_url || '',
      apply: null,
      processing: null,
      officialWebsite: p.document_url || ''
    };
  }

  private normalizeScheme(s: any): any {
    return {
      name: s.scheme_name,
      category: s.category,
      ministry: null,
      department: s.department,
      government_level: s.government_level,
      state: s.state,
      benefit: s.benefits,
      eligibility: s.eligibility,
      income: s.income_limit,
      documents: s.required_documents,
      deadline: s.end_date || 'Ongoing',
      status: s.status,
      apply: s.application_process,
      processing: s.processing_time,
      officialWebsite: s.official_website,
      description: s.description
    };
  }

  // ================= TEMPLATE HELPER =================
  // Used for plain "differs across items" highlighting (Department row) -
  // not a score, just a visual cue when values aren't all identical.

  allSame(field: string): boolean {
    if (this.comparedItems.length < 2) return true;
    const first = this.comparedItems[0][field];
    return this.comparedItems.every(item => item[field] === first);
  }

  // ================= SWAP (only meaningful for exactly 2 items) =================

  swapPolicies(): void {
    if (this.selectedNames.length !== 2) return;

    const temp = this.selectedNames[0];
    this.selectedNames[0] = this.selectedNames[1];
    this.selectedNames[1] = temp;

    this.runComparison();
  }

  // ================= RESET =================

  resetComparison(): void {

    this.selectedNames = ['', ''];

    if (this.policies.length > 0) {
      this.selectedNames[0] = this.policies[0].name;
      this.selectedNames[1] =
        this.policies.length > 1 ? this.policies[1].name : this.policies[0].name;
    }

    this.search = '';

    this.runComparison();
  }

  // ================= SEARCH =================

  searchPolicy(): void {

    if (this.search.trim() === '') {
      this.runComparison();
      return;
    }

    const keyword = this.search.toLowerCase();

    const result = this.policies.find(
      policy => policy.name.toLowerCase().includes(keyword)
    );

    if (result) {
      this.selectedNames[0] = result.name;
      this.runComparison();
    }
  }

  // ================= EXPORT: CSV DOWNLOAD =================

  exportCsv(): void {

    if (this.comparedItems.length < 2) {
      return;
    }

    const isPolicy = this.compareMode === 'policy';

    const rows: { label: string; getValue: (item: any) => string }[] = [
      { label: 'Category', getValue: item => item.category },
      ...(isPolicy
        ? [{ label: 'Ministry', getValue: (item: any) => item.ministry }]
        : []),
      { label: 'Department', getValue: item => item.department },
      { label: 'Government Level', getValue: item => item.government_level },
      { label: 'State', getValue: item => item.state },
      { label: 'Last Date', getValue: item => item.deadline },
      { label: 'Status', getValue: item => item.status },
      { label: 'Benefit', getValue: item => item.benefit },
      ...(!isPolicy
        ? [
            { label: 'Eligibility', getValue: (item: any) => item.eligibility },
            { label: 'Application Process', getValue: (item: any) => item.apply },
            { label: 'Processing Time', getValue: (item: any) => item.processing }
          ]
        : []),
      { label: 'Required Documents', getValue: item => item.documents }
    ];

    const escapeCsv = (value: any): string => {
      const text = value === null || value === undefined ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const header = ['Feature', ...this.comparedItems.map(item => item.name)];

    const lines = [header.map(escapeCsv).join(',')];

    rows.forEach(row => {
      const line = [
        row.label,
        ...this.comparedItems.map(item => row.getValue(item))
      ];
      lines.push(line.map(escapeCsv).join(','));
    });

    // Leading BOM so Excel opens the file with correct UTF-8 encoding
    // instead of mangling the ₹ symbol and other non-ASCII characters.
    const csvContent = '\uFEFF' + lines.join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `${this.compareMode}-comparison-${dateStamp}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }

  // ================= EXPORT: PRINT / SAVE AS PDF =================
  // Uses the browser's own print dialog (choosing "Save as PDF" there
  // produces a real PDF) instead of a bundled PDF library, since a new
  // dependency added this close to a demo is a real risk if it doesn't
  // install cleanly on someone else's machine.

  printComparison(): void {

    if (this.comparedItems.length < 2) {
      return;
    }

    window.print();
  }

}