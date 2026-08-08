import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

const STATUS_OPTIONS = ['Draft', 'Pending', 'Active', 'Archived'];

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
    MatSnackBarModule
  ],
  templateUrl: './manage-policies-schemes.html',
  styleUrl: './manage-policies-schemes.scss'
})
export class ManagePoliciesSchemesComponent implements OnInit {

  policyCategories = POLICY_CATEGORIES;
  schemeCategories = SCHEME_CATEGORIES;
  statusOptions = STATUS_OPTIONS;

  currentUserId: number | null = null;
  currentUserRole: string | null = null;

  showArchived = false;

  policies: any[] = [];
  schemes: any[] = [];

  policyForm: any = this.emptyPolicyForm();
  schemeForm: any = this.emptySchemeForm();

  editingPolicyId: number | null = null;
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
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadPolicies();
    this.loadSchemes();
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
      status: 'Draft',
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
      },
      error: () => {
        this.snackBar.open('Could not verify your login. Please log in again.', 'Close', { duration: 4000 });
      }
    });
  }

  // ================= POLICIES =================

  loadPolicies(): void {
    this.loadingPolicies = true;
    this.policyService.getAllPolicies({ include_archived: this.showArchived })
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
      // Editing: send only fields the update endpoint accepts
      const { policy_name, description, category, ministry, department, government_level, state, status, publication_date, effective_date, document_url } = this.policyForm;
      this.policyService.updatePolicy(this.editingPolicyId, { policy_name, description, category, ministry, department, government_level, state, status, publication_date, effective_date, document_url })
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
          this.loadPolicies();
        },
        error: (err) => this.showApiError(err, 'create policy')
      });
    }
  }

  editPolicy(policy: any): void {
    this.editingPolicyId = policy.policy_id;
    this.policyForm = {
      policy_name: policy.policy_name || '',
      description: policy.description || '',
      category: policy.category || '',
      ministry: policy.ministry || '',
      department: policy.department || '',
      government_level: policy.government_level || '',
      state: policy.state || '',
      status: policy.status || 'Draft',
      publication_date: policy.publication_date || '',
      effective_date: policy.effective_date || '',
      document_url: policy.document_url || ''
    };
  }

  cancelPolicyEdit(): void {
    this.editingPolicyId = null;
    this.policyForm = this.emptyPolicyForm();
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
    this.schemeService.getAllSchemes({ include_archived: this.showArchived }).subscribe({
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
          this.loadSchemes();
        },
        error: (err) => this.showApiError(err, 'create scheme')
      });
    }
  }

  editScheme(scheme: any): void {
    this.editingSchemeId = scheme.scheme_id;
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

  toggleShowArchived(): void {
    this.showArchived = !this.showArchived;
    this.loadPolicies();
    this.loadSchemes();
  }

  private showApiError(err: any, action: string): void {
    const detail = err?.error?.detail;
    const message = typeof detail === 'string' ? detail : `Failed to ${action}`;
    this.snackBar.open(message, 'Close', { duration: 4000 });
  }
}