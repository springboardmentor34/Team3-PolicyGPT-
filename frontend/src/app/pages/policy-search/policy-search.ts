import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { PolicyService } from '../../services/policy.service';
import { ToastService } from '../../services/toast.service';
import { SchemeService } from '../../services/scheme.service';
import { OnInit } from '@angular/core';

interface Scheme {
  id: number;
  icon: string;
  category: string;
  title: string;
  description: string;
  ministry: string;
  department: string;
  publicationDate: string;
  deadline: string;
  status: string;
  statusColor: string;
  state: string;
  incomeLimit: number;
  availability: 'Upcoming' | 'Open' | 'Closed';
}

@Component({
  selector: 'app-policy-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './policy-search.html',
  styleUrls: ['./policy-search.scss']
})
export class PolicySearchComponent implements OnInit {

  // ================= USER =================

  userName = 'Sri';

  // ================= SEARCH =================

  search = '';

  selectedSort = 'Most Relevant';

  // ================= PAGINATION =================

  currentPage = 1;

  itemsPerPage = 8;

  pageNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // ================= FILTERS =================

  categoryAgriculture = false;

  categoryHealth = false;

  categoryEducation = false;

  categoryEmployment = false;

  categoryHousing = false;

  categoryFinance = false;

  categoryWomenChildWelfare = false;

  categoryEnvironment = false;

  categoryDigitalGovernance = false;

  categoryInfrastructure = false;

  // ===== Scheme mode =====
  searchMode: 'policies' | 'schemes' = 'policies';

  schemeCategoryScholarships = false;
  schemeCategoryFarmerWelfare = false;
  schemeCategoryHealthcare = false;
  schemeCategoryHousing = false;
  schemeCategoryBusinessSupport = false;
  schemeCategoryWomenEmpowerment = false;
  schemeCategorySeniorCitizen = false;
  schemeCategoryStudentSchemes = false;
  schemeCategoryEmploymentPrograms = false;
  schemeCategorySocialSecurity = false;

  stateFilter: string = '';

  ministryFilter: string = '';

  departmentFilter: string = '';

  availabilityFilter: string = '';

  activeOnly = false;

  selectedIncome = 500000;

  selectedPublicationDate: Date | null = null;

  // ================= ARRAYS =================

  schemes: Scheme[] = [];

  filteredSchemes: Scheme[] = [];

  displayedSchemes: Scheme[] = [];

  // ================= CONSTRUCTOR =================

  constructor(
    private policyService: PolicyService,
    private schemeService: SchemeService,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit(): void {

    // Supports deep-linking into a pre-filtered search, e.g. clicking a
    // category slice on the Admin/Government Dashboard analytics
    // charts, or the homepage's category tiles
    // (routerLink="/policy-search" queryParams="{ category: '...', type: '...' }").
    const categoryFromUrl = this.route.snapshot.queryParamMap.get('category');
    const typeFromUrl = this.route.snapshot.queryParamMap.get('type');
    const keywordFromUrl = this.route.snapshot.queryParamMap.get('q');

    if (categoryFromUrl) {
      // Deliberately NOT passed as a backend `keyword` — the backend's
      // keyword search only matches policy/scheme name and description,
      // never category, so it would silently return 0 results for any
      // category whose name doesn't happen to also appear in a title.
      // searchByCategory() below sets the real category checkbox flag
      // instead, which the existing client-side filtering already
      // understands correctly.
      this.searchByCategory(
        categoryFromUrl,
        typeFromUrl === 'scheme' ? 'scheme' : 'policy'
      );
    } else if (typeFromUrl === 'scheme') {
      // No category given — just "open straight into Scheme search",
      // e.g. from the Citizen Dashboard's "Search Schemes" quick action
      // (routerLink="/policy-search" queryParams="{ type: 'scheme' }").
      this.toggleSearchMode('schemes');
    } else if (keywordFromUrl) {
      // Plain keyword search, e.g. from the homepage's hero search bar
      // (routerLink="/policy-search" queryParams="{ q: '...' }"). Unlike
      // category, a free-text keyword genuinely IS meant for the
      // backend's name/description search, so it's safe to pass through
      // as-is here.
      this.search = keywordFromUrl;
      this.loadPolicies(keywordFromUrl);
    } else {
      this.loadPolicies();
    }
  }

  // ================= LOAD POLICIES =================

  loadPolicies(keyword?: string): void {

    // Policy Approval Workflow (Task 4):
    // public_only=true keeps Pending/Rejected policies
    // out of citizen-facing search results.

    this.policyService.getAllPolicies({
      ...(keyword ? { keyword } : {}),
      public_only: true
    }).subscribe({

      next: (response: any) => {

        console.log(response);

        this.schemes = response.data.map((policy: any) => ({

          id: policy.policy_id,

          icon: 'description',

          category: policy.category,

          title: policy.policy_name,

          description: policy.description,

          ministry: policy.ministry,

          department: policy.department,

          publicationDate: policy.publication_date,

          deadline: policy.effective_date || 'Ongoing',

          status: policy.status,

          statusColor: 'eligible',

          state: policy.state,

          incomeLimit: 500000,

          availability: this.getAvailabilityStatus(
            policy.publication_date || 'Ongoing',
            policy.effective_date || 'Ongoing'
          )

        }));

        this.applyFilters();

      },

      error: (error) => {

        console.error(error);

        this.toast.error('Unable to load policies');

      }

    });

  }

  // ================= LOAD SCHEMES (for scheme search mode) =================

  loadSchemesForSearch(keyword?: string): void {

    this.schemeService.getAllSchemes(
      keyword ? { keyword } : undefined
    ).subscribe({

      next: (response: any) => {

        this.schemes = response.data.map((scheme: any) => ({

          id: scheme.scheme_id,

          icon: 'card_giftcard',

          category: scheme.category,

          title: scheme.scheme_name,

          description: scheme.description || scheme.benefits,

          ministry: '',

          department: scheme.department,

          publicationDate: scheme.start_date,

          deadline: scheme.end_date || 'Ongoing',

          status: scheme.status,

          statusColor: 'eligible',

          state: scheme.state,

          incomeLimit: 500000,

          availability: this.getAvailabilityStatus(
            scheme.start_date || 'Ongoing',
            scheme.end_date || 'Ongoing'
          )

        }));

        this.applyFilters();

      },

      error: (error) => {

        console.error(error);

        this.toast.error('Unable to load schemes');

      }

    });

  }

  // Determines real availability from start/end dates, instead of the
  // old binary "open" flag. Works for both policies (start=publication_date,
  // end=effective_date) and schemes (start=start_date, end=end_date) since
  // both are already mapped into publicationDate/deadline in the loaders.
  private getAvailabilityStatus(startStr: string, endStr: string): 'Upcoming' | 'Open' | 'Closed' {

    const today = new Date();
    const todayStr =
      today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    const hasStart = !!startStr && startStr !== 'Ongoing';
    const hasEnd = !!endStr && endStr !== 'Ongoing';

    if (hasStart && startStr > todayStr) {
      return 'Upcoming';
    }

    if (hasEnd && endStr < todayStr) {
      return 'Closed';
    }

    return 'Open';

  }

  toggleSearchMode(mode: 'policies' | 'schemes'): void {

    if (this.searchMode === mode) {
      return;
    }

    this.searchMode = mode;
    this.search = '';
    this.clearAllFilters();

    if (mode === 'policies') {
      this.loadPolicies();
    } else {
      this.loadSchemesForSearch();
    }

  }

  // ================= APPLY FILTERS =================

  applyFilters(): void {

    this.filteredSchemes = this.schemes.filter((scheme) => {

      // ---------- Search ----------

      const matchesSearch =
        this.search.trim() === '' ||

        scheme.title.toLowerCase().includes(
          this.search.toLowerCase()
        ) ||

        scheme.category.toLowerCase().includes(
          this.search.toLowerCase()
        ) ||

        scheme.ministry.toLowerCase().includes(
          this.search.toLowerCase()
        );

      // ---------- Category ----------

      let matchesCategory = true;

      if (this.searchMode === 'policies') {

        if (
          this.categoryAgriculture ||
          this.categoryHealth ||
          this.categoryEducation ||
          this.categoryEmployment ||
          this.categoryHousing ||
          this.categoryFinance ||
          this.categoryWomenChildWelfare ||
          this.categoryEnvironment ||
          this.categoryDigitalGovernance ||
          this.categoryInfrastructure
        ) {

          matchesCategory =

            (this.categoryAgriculture &&
              scheme.category === 'Agriculture') ||

            (this.categoryHealth &&
              scheme.category === 'Healthcare') ||

            (this.categoryEducation &&
              scheme.category === 'Education') ||

            (this.categoryEmployment &&
              scheme.category === 'Employment') ||

            (this.categoryHousing &&
              scheme.category === 'Housing') ||

            (this.categoryFinance &&
              scheme.category === 'Finance') ||

            (this.categoryWomenChildWelfare &&
              scheme.category === 'Women & Child Welfare') ||

            (this.categoryEnvironment &&
              scheme.category === 'Environment') ||

            (this.categoryDigitalGovernance &&
              scheme.category === 'Digital Governance') ||

            (this.categoryInfrastructure &&
              scheme.category === 'Infrastructure');

        }

      } else {

        if (
          this.schemeCategoryScholarships ||
          this.schemeCategoryFarmerWelfare ||
          this.schemeCategoryHealthcare ||
          this.schemeCategoryHousing ||
          this.schemeCategoryBusinessSupport ||
          this.schemeCategoryWomenEmpowerment ||
          this.schemeCategorySeniorCitizen ||
          this.schemeCategoryStudentSchemes ||
          this.schemeCategoryEmploymentPrograms ||
          this.schemeCategorySocialSecurity
        ) {

          matchesCategory =

            (this.schemeCategoryScholarships &&
              scheme.category === 'Scholarships') ||

            (this.schemeCategoryFarmerWelfare &&
              scheme.category === 'Farmer Welfare') ||

            (this.schemeCategoryHealthcare &&
              scheme.category === 'Healthcare') ||

            (this.schemeCategoryHousing &&
              scheme.category === 'Housing') ||

            (this.schemeCategoryBusinessSupport &&
              scheme.category === 'Business Support') ||

            (this.schemeCategoryWomenEmpowerment &&
              scheme.category === 'Women Empowerment') ||

            (this.schemeCategorySeniorCitizen &&
              scheme.category === 'Senior Citizen Welfare') ||

            (this.schemeCategoryStudentSchemes &&
              scheme.category === 'Student Schemes') ||

            (this.schemeCategoryEmploymentPrograms &&
              scheme.category === 'Employment Programs') ||

            (this.schemeCategorySocialSecurity &&
              scheme.category === 'Social Security');

        }

      }

      // ---------- State ----------

      const matchesState =
        this.stateFilter.trim() === '' ||
        (scheme.state || '').toLowerCase().includes(
          this.stateFilter.trim().toLowerCase()
        );

      // ---------- Income ----------

      const matchesIncome =
        scheme.incomeLimit <= this.selectedIncome;

      // ---------- Availability ----------

      const matchesAvailability =
        !this.availabilityFilter ||
        scheme.availability === this.availabilityFilter;

      // ---------- Active ----------

      const matchesActive =
        !this.activeOnly ||
        scheme.status === 'Active';

      // ---------- Ministry ----------

      const matchesMinistry =
        this.searchMode === 'schemes' ||
        this.ministryFilter.trim() === '' ||
        (scheme.ministry || '').toLowerCase().includes(
          this.ministryFilter.trim().toLowerCase()
        );

      // ---------- Department ----------

      const matchesDepartment =
        this.departmentFilter.trim() === '' ||
        (scheme.department || '').toLowerCase().includes(
          this.departmentFilter.trim().toLowerCase()
        );

      // ---------- Publication Date ----------

      let matchesPublicationDate = true;

      if (this.selectedPublicationDate) {

        // Build YYYY-MM-DD from LOCAL date parts, not .toISOString()
        // (which converts to UTC and silently shifts the date by a day
        // in timezones ahead of UTC, like India — this was the exact
        // bug where the picked date never matched, but date+1 did).
        const d = this.selectedPublicationDate;
        const selectedDate =
          d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0');

        matchesPublicationDate =
          !!scheme.publicationDate &&
          scheme.publicationDate.startsWith(selectedDate);

      }

      return (

        matchesSearch &&

        matchesCategory &&

        matchesState &&

        matchesMinistry &&

        matchesDepartment &&

        matchesIncome &&

        matchesAvailability &&

        matchesActive &&

        matchesPublicationDate

      );

    });

    this.sortSchemes();

  }

  // ================= SEARCH =================

  searchPolicies(): void {

    const keyword = this.search.trim() || undefined;

    if (this.searchMode === 'policies') {
      this.loadPolicies(keyword);
    } else {
      this.loadSchemesForSearch(keyword);
    }

  }

  searchByCategory(category: string, type: 'policy' | 'scheme' = 'policy'): void {

    this.clearAllFilters();

    if (type === 'scheme') {

      this.searchMode = 'schemes';

      const schemeCategoryMap: Record<string, () => void> = {
        'Scholarships': () => this.schemeCategoryScholarships = true,
        'Farmer Welfare': () => this.schemeCategoryFarmerWelfare = true,
        'Healthcare': () => this.schemeCategoryHealthcare = true,
        'Housing': () => this.schemeCategoryHousing = true,
        'Business Support': () => this.schemeCategoryBusinessSupport = true,
        'Women Empowerment': () => this.schemeCategoryWomenEmpowerment = true,
        'Senior Citizen Welfare': () => this.schemeCategorySeniorCitizen = true,
        'Student Schemes': () => this.schemeCategoryStudentSchemes = true,
        'Employment Programs': () => this.schemeCategoryEmploymentPrograms = true,
        'Social Security': () => this.schemeCategorySocialSecurity = true,
      };

      const setFlag = schemeCategoryMap[category];
      if (setFlag) {
        setFlag();
        this.loadSchemesForSearch();
      } else {
        // No matching checkbox for this category (e.g. real data has a
        // category not in the fixed checkbox list) — fall back to a
        // plain keyword search so the click still does *something*
        // useful rather than silently filtering to zero results.
        this.search = category;
        this.loadSchemesForSearch(category);
      }

    } else {

      this.searchMode = 'policies';

      const policyCategoryMap: Record<string, () => void> = {
        'Agriculture': () => this.categoryAgriculture = true,
        'Healthcare': () => this.categoryHealth = true,
        'Education': () => this.categoryEducation = true,
        'Employment': () => this.categoryEmployment = true,
        'Housing': () => this.categoryHousing = true,
        'Finance': () => this.categoryFinance = true,
        'Women & Child Welfare': () => this.categoryWomenChildWelfare = true,
        'Environment': () => this.categoryEnvironment = true,
        'Digital Governance': () => this.categoryDigitalGovernance = true,
        'Infrastructure': () => this.categoryInfrastructure = true,
      };

      const setFlag = policyCategoryMap[category];
      if (setFlag) {
        setFlag();
        this.loadPolicies();
      } else {
        this.search = category;
        this.loadPolicies(category);
      }
    }

    // NOTE: no separate applyFilters() call here — loadPolicies() and
    // loadSchemesForSearch() both call applyFilters() themselves once
    // their data actually arrives, which is what makes the category
    // flags set above take effect correctly against the right dataset.

  }

  // ================= PUBLICATION DATE =================

  onPublicationDateChange(date: Date | null): void {

    this.selectedPublicationDate = date;

    this.applyFilters();

  }

  // ================= STATUS =================

  searchByStatus(status: string): void {

    this.activeOnly = !this.activeOnly;

    if (this.activeOnly) {

      this.filteredSchemes =
        this.filteredSchemes.filter(
          scheme => scheme.status === status
        );

      this.updateDisplayedSchemes();

    } else {

      this.applyFilters();

    }

  }

  // ================= SORT =================

  sortSchemes(): void {

    if (this.selectedSort === 'Newest') {

      this.filteredSchemes.sort(
        (a, b) => b.id - a.id
      );

    }

    if (this.selectedSort === 'Most Relevant') {

      this.filteredSchemes.sort(
        (a, b) => a.id - b.id
      );

    }

    if (this.selectedSort === 'Deadline') {

      this.filteredSchemes.sort(
        (a, b) =>
          a.deadline.localeCompare(b.deadline)
      );

    }

    this.currentPage = 1;

    this.updateDisplayedSchemes();

  }

  // ================= DISPLAYED SCHEMES =================

  updateDisplayedSchemes(): void {

    const start =
      (this.currentPage - 1) * this.itemsPerPage;

    const end =
      start + this.itemsPerPage;

    this.displayedSchemes =
      this.filteredSchemes.slice(start, end);

  }

  // ================= PAGE =================

  goToPage(page: number): void {

    this.currentPage = page;

    this.updateDisplayedSchemes();

  }

  nextPage(): void {

    if (
      this.currentPage <
      this.pageNumbers.length
    ) {

      this.currentPage++;

      this.updateDisplayedSchemes();

    }

  }

  previousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

      this.updateDisplayedSchemes();

    }

  }

  // ================= CLEAR =================

  clearAllFilters(): void {

    this.search = '';

    this.categoryAgriculture = false;

    this.categoryHealth = false;

    this.categoryEducation = false;

    this.categoryEmployment = false;

    this.categoryHousing = false;

    this.categoryFinance = false;

    this.categoryWomenChildWelfare = false;

    this.categoryEnvironment = false;

    this.categoryDigitalGovernance = false;

    this.categoryInfrastructure = false;

    this.schemeCategoryScholarships = false;
    this.schemeCategoryFarmerWelfare = false;
    this.schemeCategoryHealthcare = false;
    this.schemeCategoryHousing = false;
    this.schemeCategoryBusinessSupport = false;
    this.schemeCategoryWomenEmpowerment = false;
    this.schemeCategorySeniorCitizen = false;
    this.schemeCategoryStudentSchemes = false;
    this.schemeCategoryEmploymentPrograms = false;
    this.schemeCategorySocialSecurity = false;

    this.stateFilter = '';

    this.ministryFilter = '';

    this.departmentFilter = '';

    this.availabilityFilter = '';

    this.activeOnly = false;

    this.selectedIncome = 500000;

    this.selectedPublicationDate = null;

    this.selectedSort = 'Most Relevant';

    this.applyFilters();

  }

  // ================= RESET =================

  resetFilters(): void {

    this.clearAllFilters();

  }

}