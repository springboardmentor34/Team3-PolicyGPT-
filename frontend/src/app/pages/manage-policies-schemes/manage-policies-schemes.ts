import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../../services/auth.service';
import { PolicyService } from '../../services/policy.service';
import { SchemeService } from '../../services/scheme.service';
import { EligibilityRuleService } from '../../services/eligibility-rule.service';

const POLICY_CATEGORIES = [
  'Education', 'Healthcare', 'Agriculture', 'Employment', 'Finance',
  'Women & Child Welfare', 'Housing', 'Environment', 'Digital Governance', 'Infrastructure'
];

const SCHEME_CATEGORIES = [
  'Scholarships', 'Farmer Welfare', 'Healthcare', 'Housing', 'Business Support',
  'Women Empowerment', 'Senior Citizen Welfare', 'Student Schemes', 'Employment Programs', 'Social Security'
];

// Policy status is now fully derived from approval_status (see backend
// policy.py), so 'Draft' is no longer a reachable policy state — every
// policy starts Pending. Scheme status has no approval workflow though,
// so schemes keep 'Draft' as a legitimate, manually-selectable state.
const POLICY_STATUS_OPTIONS = ['Pending', 'Active', 'Rejected', 'Archived'];
const SCHEME_STATUS_OPTIONS = ['Draft', 'Pending', 'Active', 'Archived'];

// These four lists must stay in sync with the Eligibility Checker
// (eligibility-checker.ts) — an official picking a rule value from a
// different vocabulary than what citizens actually submit means the
// eligibility matcher silently never matches (e.g. rule says "Farming"
// but the checker only ever sends "Farmer").
const ELIGIBILITY_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const ELIGIBILITY_OCCUPATIONS = [
  'Student', 'Farmer', 'Salaried', 'Self-employed', 'Daily Wage Labourer',
  'Homemaker', 'Retired / Pensioner', 'Unemployed', 'Other'
];

const ELIGIBILITY_EDUCATION_LEVELS = [
  'Below 10th', '10th Pass', '12th Pass', 'Undergraduate',
  'Graduate', 'Postgraduate', 'Doctorate'
];

const ELIGIBILITY_CASTE_CATEGORIES = [
  'General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'
];

const ELIGIBILITY_GENDER_OPTIONS = [
  'Male', 'Female', 'Other', 'Prefer not to say'
];

const GOVERNMENT_LEVELS = ['Central', 'State', 'Local'];

// Common central ministries — used as autocomplete suggestions, not a
// closed list. State-level departments vary too much to enumerate, so
// officials can still type anything not on this list.
const COMMON_MINISTRIES = [
  'Ministry of Education', 'Ministry of Health and Family Welfare',
  'Ministry of Agriculture and Farmers Welfare', 'Ministry of Rural Development',
  'Ministry of Housing and Urban Affairs', 'Ministry of Labour and Employment',
  'Ministry of Social Justice and Empowerment', 'Ministry of Women and Child Development',
  'Ministry of Skill Development and Entrepreneurship', 'Ministry of Micro, Small and Medium Enterprises',
  'Ministry of Finance', 'Ministry of Electronics and Information Technology',
  'Ministry of Environment, Forest and Climate Change', 'Ministry of Tribal Affairs',
  'Ministry of Minority Affairs', 'Ministry of Panchayati Raj',
  'Ministry of Power', 'Ministry of Road Transport and Highways',
  'Ministry of Home Affairs', 'Ministry of Commerce and Industry'
];

const COMMON_DEPARTMENTS = [
  'Department of School Education', 'Department of Higher Education',
  'Department of Health Services', 'Department of Agriculture and Farmers Welfare',
  'Department of Rural Development', 'Department of Urban Development',
  'Department of Social Justice and Empowerment', 'Department of Women and Child Development',
  'Department of Labour and Employment', 'Department of Industries and Commerce',
  'Department of Revenue', 'Department of Finance',
  'Department of Panchayati Raj', 'Department of Information Technology',
  'Department of Housing', 'Department of Environment and Forests',
  'Department of Skill Development'
];

@Component({
  selector: 'app-manage-policies-schemes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatChipsModule
  ],
  templateUrl: './manage-policies-schemes.html',
  styleUrl: './manage-policies-schemes.scss'
})
export class ManagePoliciesSchemesComponent implements OnInit {

  policyCategories = POLICY_CATEGORIES;
  schemeCategories = SCHEME_CATEGORIES;
  statusOptions = POLICY_STATUS_OPTIONS;
  schemeStatusOptions = SCHEME_STATUS_OPTIONS;
  eligibilityStates = ELIGIBILITY_STATES;
  eligibilityOccupations = ELIGIBILITY_OCCUPATIONS;
  eligibilityEducationLevels = ELIGIBILITY_EDUCATION_LEVELS;
  eligibilityCasteCategories = ELIGIBILITY_CASTE_CATEGORIES;
  eligibilityGenderOptions = ELIGIBILITY_GENDER_OPTIONS;
  governmentLevels = GOVERNMENT_LEVELS;
  commonMinistries = COMMON_MINISTRIES;
  commonDepartments = COMMON_DEPARTMENTS;
  filteredMinistries = COMMON_MINISTRIES;
  filteredDepartments = COMMON_DEPARTMENTS;

  // ===== Collapsible forms: closed by default, open automatically when
  // creating (via the "+ Add" button) or editing an existing item =====
  isPolicyFormOpen = false;
  isSchemeFormOpen = false;

  // ===== Search/filter bar for the existing-items lists =====
  policySearchText = '';
  policyFilterCategory = '';
  policyFilterStatus = '';

  schemeSearchText = '';
  schemeFilterCategory = '';
  schemeFilterStatus = '';

  currentUserId: number | null = null;
  currentUserRole: string | null = null;

  // Archived items are always fetched — whether to show them is entirely
  // controlled by the Status filter dropdown ("All Statuses" includes
  // them, "Archived" shows only them). There's no separate toggle for
  // this anymore; a second control that also gated archived visibility
  // was fighting the dropdown and made "Archived" silently show nothing.

  policies: any[] = [];
  schemes: any[] = [];

  policyForm: any = this.emptyPolicyForm();
  schemeForm: any = this.emptySchemeForm();

  editingPolicyId: number | null = null;
  editingPolicyStatus = '';
  editingSchemeId: number | null = null;

  // ===== Eligibility rules state =====
  expandedSchemeId: number | null = null;
  eligibilityRules: { [schemeId: number]: any[] } = {};
  loadingEligibility: { [schemeId: number]: boolean } = {};
  eligibilityForm: any = this.emptyEligibilityForm();
  editingRuleId: number | null = null;

  loadingPolicies = false;
  loadingSchemes = false;

  constructor(
    private authService: AuthService,
    private policyService: PolicyService,
    private schemeService: SchemeService,
    private eligibilityRuleService: EligibilityRuleService,
    private snackBar: MatSnackBar,
    private location: Location
  ) {}

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  // ================= COLLAPSIBLE FORMS =================

  openNewPolicyForm(): void {
    this.editingPolicyId = null;
    this.policyForm = this.emptyPolicyForm();
    this.isPolicyFormOpen = true;
  }

  openNewSchemeForm(): void {
    this.editingSchemeId = null;
    this.schemeForm = this.emptySchemeForm();
    this.isSchemeFormOpen = true;
  }

  // ================= LIST FILTERING =================

  get filteredPolicies(): any[] {
    const text = this.policySearchText.trim().toLowerCase();
    return this.policies.filter((p) => {
      const matchesText = !text ||
        (p.policy_name || '').toLowerCase().includes(text) ||
        (p.ministry || '').toLowerCase().includes(text) ||
        (p.department || '').toLowerCase().includes(text);
      const matchesCategory = !this.policyFilterCategory || p.category === this.policyFilterCategory;
      const matchesStatus = !this.policyFilterStatus || p.status === this.policyFilterStatus;
      return matchesText && matchesCategory && matchesStatus;
    });
  }

  get filteredSchemes(): any[] {
    const text = this.schemeSearchText.trim().toLowerCase();
    return this.schemes.filter((s) => {
      const matchesText = !text ||
        (s.scheme_name || '').toLowerCase().includes(text) ||
        (s.department || '').toLowerCase().includes(text);
      const matchesCategory = !this.schemeFilterCategory || s.category === this.schemeFilterCategory;
      const matchesStatus = !this.schemeFilterStatus || s.status === this.schemeFilterStatus;
      return matchesText && matchesCategory && matchesStatus;
    });
  }

  // ================= AUTOCOMPLETE FILTERING =================

  filterMinistries(value: string): void {
    const v = (value || '').toLowerCase();
    this.filteredMinistries = this.commonMinistries.filter((m) => m.toLowerCase().includes(v));
  }

  filterDepartments(value: string): void {
    const v = (value || '').toLowerCase();
    this.filteredDepartments = this.commonDepartments.filter((d) => d.toLowerCase().includes(v));
  }

  private emptyPolicyForm() {
    return {
      policy_name: '',
      description: '',
      category: '',
      ministry: '',
      department: '',
      government_level: '',
      state: '',
      publication_date: '',
      effective_date: '',
      document_url: ''
    };
  }

  private emptySchemeForm() {
    return {
      scheme_name: '',
      description: '',
      category: '',
      department: '',
      government_level: '',
      state: '',
      benefits: '',
      application_process: '',
      required_documents: '',
      official_website: '',
      start_date: '',
      end_date: '',
      status: 'Draft'
    };
  }

  // ================= CURRENT USER =================

  loadCurrentUser(): void {
    this.authService.getMe().subscribe({
      next: (user: any) => {
        this.currentUserId = user.user_id;
        this.currentUserRole = user.role;
        // Only load the lists once we actually know the role — Admin
        // sees everything (system-wide oversight, archive rights on any
        // item), an Official sees only their own. Loading before this
        // resolves would default to the wrong scope.
        this.loadPolicies();
        this.loadSchemes();
      },
      error: () => {
        this.snackBar.open('Could not verify your login. Please log in again.', 'Close', { duration: 4000 });
        // Fail safe: if we can't confirm identity, still load in the
        // restrictive (mine_only) mode rather than defaulting to "see
        // everything."
        this.loadPolicies();
        this.loadSchemes();
      }
    });
  }

  get isAdmin(): boolean {
    const role = (this.currentUserRole || '').toLowerCase();
    return role === 'admin' || role === 'administrator';
  }

  // ================= POLICIES =================

  loadPolicies(): void {
    this.loadingPolicies = true;
    // Admin: system-wide view (no mine_only) — matches the archive/
    // unarchive exemption on the backend (_require_owner_or_admin), so
    // Admin can actually see the items they're now allowed to archive.
    // Official: unchanged, mine_only stays true.
    this.policyService.getAllPolicies({ include_archived: true, mine_only: !this.isAdmin })
      .subscribe({
        next: (response: any) => {
          this.policies = response.data || [];
          this.loadingPolicies = false;
        },
        error: () => {
          this.loadingPolicies = false;
          this.snackBar.open('Failed to load policies', 'Close', { duration: 3000 });
        }
      });
  }

  submitPolicy(): void {
    if (!this.policyForm.policy_name || !this.policyForm.category) {
      this.snackBar.open('Policy name and category are required', 'Close', { duration: 3000 });
      return;
    }

    if (this.editingPolicyId) {
      // Editing: send only fields the update endpoint accepts. `status` is
      // deliberately excluded — the backend now derives it from
      // approval_status and ignores it even if sent (see PolicyUpdate).
      const { policy_name, description, category, ministry, department, government_level, state, publication_date, effective_date, document_url } = this.policyForm;
      this.policyService.updatePolicy(this.editingPolicyId, { policy_name, description, category, ministry, department, government_level, state, publication_date, effective_date, document_url })
        .subscribe({
          next: () => {
            this.snackBar.open('Policy updated', 'Close', { duration: 2500 });
            this.cancelPolicyEdit();
            this.loadPolicies();
          },
          error: (err) => this.showApiError(err, 'update policy')
        });
    } else {
      if (!this.currentUserId) {
        this.snackBar.open('Still verifying your login, please wait a moment and try again.', 'Close', { duration: 3000 });
        return;
      }
      const payload = { ...this.policyForm, uploaded_by_user_id: this.currentUserId };
      this.policyService.createPolicy(payload).subscribe({
        next: () => {
          this.snackBar.open('Policy created', 'Close', { duration: 2500 });
          this.policyForm = this.emptyPolicyForm();
          this.isPolicyFormOpen = false;
          this.loadPolicies();
        },
        error: (err) => this.showApiError(err, 'create policy')
      });
    }
  }

  editPolicy(policy: any): void {
    this.editingPolicyId = policy.policy_id;
    this.editingPolicyStatus = policy.status || 'Pending';
    this.isPolicyFormOpen = true;
    this.policyForm = {
      policy_name: policy.policy_name || '',
      description: policy.description || '',
      category: policy.category || '',
      ministry: policy.ministry || '',
      department: policy.department || '',
      government_level: policy.government_level || '',
      state: policy.state || '',
      publication_date: policy.publication_date || '',
      effective_date: policy.effective_date || '',
      document_url: policy.document_url || ''
    };
  }

  cancelPolicyEdit(): void {
    this.editingPolicyId = null;
    this.policyForm = this.emptyPolicyForm();
    this.isPolicyFormOpen = false;
  }

  archivePolicy(id: number): void {
    this.policyService.archivePolicy(id).subscribe({
      next: () => {
        this.snackBar.open('Policy archived', 'Close', { duration: 2500 });
        this.loadPolicies();
      },
      error: (err) => this.showApiError(err, 'archive policy')
    });
  }

  unarchivePolicy(id: number): void {
    this.policyService.unarchivePolicy(id).subscribe({
      next: () => {
        this.snackBar.open('Policy restored', 'Close', { duration: 2500 });
        this.loadPolicies();
      },
      error: (err) => this.showApiError(err, 'restore policy')
    });
  }

  // ================= SCHEMES =================

  loadSchemes(): void {
    this.loadingSchemes = true;
    this.schemeService.getAllSchemes({ include_archived: true, mine_only: !this.isAdmin }).subscribe({
      next: (response: any) => {
        this.schemes = response.data || [];
        this.loadingSchemes = false;
      },
      error: () => {
        this.loadingSchemes = false;
        this.snackBar.open('Failed to load schemes', 'Close', { duration: 3000 });
      }
    });
  }

  submitScheme(): void {
    if (!this.schemeForm.scheme_name || !this.schemeForm.category) {
      this.snackBar.open('Scheme name and category are required', 'Close', { duration: 3000 });
      return;
    }

    if (this.editingSchemeId) {
      const { scheme_name, description, category, department, government_level, state, benefits, application_process, required_documents, official_website, start_date, end_date, status } = this.schemeForm;
      this.schemeService.updateScheme(this.editingSchemeId, { scheme_name, description, category, department, government_level, state, benefits, application_process, required_documents, official_website, start_date, end_date, status })
        .subscribe({
          next: () => {
            this.snackBar.open('Scheme updated', 'Close', { duration: 2500 });
            this.cancelSchemeEdit();
            this.loadSchemes();
          },
          error: (err) => this.showApiError(err, 'update scheme')
        });
    } else {
      if (!this.currentUserId) {
        this.snackBar.open('Still verifying your login, please wait a moment and try again.', 'Close', { duration: 3000 });
        return;
      }
      const payload = { ...this.schemeForm, uploaded_by_user_id: this.currentUserId };
      this.schemeService.createScheme(payload).subscribe({
        next: () => {
          this.snackBar.open('Scheme created', 'Close', { duration: 2500 });
          this.schemeForm = this.emptySchemeForm();
          this.isSchemeFormOpen = false;
          this.loadSchemes();
        },
        error: (err) => this.showApiError(err, 'create scheme')
      });
    }
  }

  editScheme(scheme: any): void {
    this.editingSchemeId = scheme.scheme_id;
    this.isSchemeFormOpen = true;
    this.schemeForm = {
      scheme_name: scheme.scheme_name || '',
      description: scheme.description || '',
      category: scheme.category || '',
      department: scheme.department || '',
      government_level: scheme.government_level || '',
      state: scheme.state || '',
      benefits: scheme.benefits || '',
      application_process: scheme.application_process || '',
      required_documents: scheme.required_documents || '',
      official_website: scheme.official_website || '',
      start_date: scheme.start_date || '',
      end_date: scheme.end_date || '',
      status: scheme.status || 'Draft'
    };
  }

  cancelSchemeEdit(): void {
    this.editingSchemeId = null;
    this.schemeForm = this.emptySchemeForm();
    this.isSchemeFormOpen = false;
  }

  archiveScheme(id: number): void {
    this.schemeService.archiveScheme(id).subscribe({
      next: () => {
        this.snackBar.open('Scheme archived', 'Close', { duration: 2500 });
        this.loadSchemes();
      },
      error: (err) => this.showApiError(err, 'archive scheme')
    });
  }

  unarchiveScheme(id: number): void {
    this.schemeService.unarchiveScheme(id).subscribe({
      next: () => {
        this.snackBar.open('Scheme restored', 'Close', { duration: 2500 });
        this.loadSchemes();
      },
      error: (err) => this.showApiError(err, 'restore scheme')
    });
  }

  // ================= ELIGIBILITY RULES =================

  private emptyEligibilityForm() {
    return {
      minimum_age: null,
      maximum_age: null,
      gender: '',
      maximum_income: null,
      occupation: '',
      education: '',
      state: '',
      district: '',
      social_category: '',
      disability_status: null
    };
  }

  toggleEligibilityPanel(scheme: any): void {
    if (this.expandedSchemeId === scheme.scheme_id) {
      this.expandedSchemeId = null;
      this.cancelEligibilityEdit();
      return;
    }
    this.expandedSchemeId = scheme.scheme_id;
    this.loadEligibilityRules(scheme.scheme_id);
  }

  loadEligibilityRules(schemeId: number): void {
    this.loadingEligibility[schemeId] = true;
    this.eligibilityRuleService.getRulesForScheme(schemeId).subscribe({
      next: (response: any) => {
        this.eligibilityRules[schemeId] = response.data || [];
        this.loadingEligibility[schemeId] = false;
      },
      error: () => {
        this.loadingEligibility[schemeId] = false;
        this.snackBar.open('Failed to load eligibility rules', 'Close', { duration: 3000 });
      }
    });
  }

  submitEligibilityRule(schemeId: number): void {
    if (this.editingRuleId) {
      this.eligibilityRuleService.updateRule(this.editingRuleId, this.eligibilityForm).subscribe({
        next: () => {
          this.snackBar.open('Eligibility rule updated', 'Close', { duration: 2500 });
          this.cancelEligibilityEdit();
          this.loadEligibilityRules(schemeId);
        },
        error: (err) => this.showApiError(err, 'update eligibility rule')
      });
    } else {
      const payload = { ...this.eligibilityForm, scheme_id: schemeId };
      this.eligibilityRuleService.createRule(payload).subscribe({
        next: () => {
          this.snackBar.open('Eligibility rule added', 'Close', { duration: 2500 });
          this.eligibilityForm = this.emptyEligibilityForm();
          this.loadEligibilityRules(schemeId);
        },
        error: (err) => this.showApiError(err, 'add eligibility rule')
      });
    }
  }

  editEligibilityRule(rule: any): void {
    this.editingRuleId = rule.rule_id;
    this.eligibilityForm = {
      minimum_age: rule.minimum_age,
      maximum_age: rule.maximum_age,
      gender: rule.gender || '',
      maximum_income: rule.maximum_income,
      occupation: rule.occupation || '',
      education: rule.education || '',
      state: rule.state || '',
      district: rule.district || '',
      social_category: rule.social_category || '',
      disability_status: rule.disability_status
    };
  }

  cancelEligibilityEdit(): void {
    this.editingRuleId = null;
    this.eligibilityForm = this.emptyEligibilityForm();
  }

  deleteEligibilityRule(ruleId: number, schemeId: number): void {
    this.eligibilityRuleService.deleteRule(ruleId).subscribe({
      next: () => {
        this.snackBar.open('Eligibility rule removed', 'Close', { duration: 2500 });
        this.loadEligibilityRules(schemeId);
      },
      error: (err) => this.showApiError(err, 'delete eligibility rule')
    });
  }

  // ================= SHARED =================

  private showApiError(err: any, action: string): void {
    const detail = err?.error?.detail;
    const message = typeof detail === 'string' ? detail : `Failed to ${action}`;
    this.snackBar.open(message, 'Close', { duration: 4000 });
  }
}