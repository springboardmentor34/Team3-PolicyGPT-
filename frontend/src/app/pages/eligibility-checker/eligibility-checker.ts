import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';

import { EligibilityResultService } from '../../services/eligibility-result.service';

@Component({
  selector: 'app-eligibility-checker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule
  ],
  templateUrl: './eligibility-checker.html',
  styleUrls: ['./eligibility-checker.scss']
})
export class EligibilityCheckerComponent {

  constructor(
    private http: HttpClient,
    private eligibilityResultService: EligibilityResultService
  ) {}


  today = new Date().toISOString().split('T')[0];

  search = '';

  // ================= STEPPER =================

  currentStep = 1;

  // ================= STEP 1: PERSONAL DETAILS =================

  dob = '';

  // Gender is intentionally not restricted to a Male/Female binary —
  // several government schemes explicitly target "Other"/transgender
  // applicants (e.g. under social welfare categories), so excluding it
  // would silently make the checker unusable for those citizens.
  gender = '';

  genderOptions = [
    'Male',
    'Female',
    'Other',
    'Prefer not to say'
  ];

  // Full list of Indian states and union territories — the previous
  // version only listed 7 states, which meant most citizens outside
  // South India couldn't even select their real state.
  states = [
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

  state = '';

  // District is a free-text field (see template) rather than a dropdown,
  // since a hardcoded district list can only ever cover one state at a
  // time and India has 700+ districts across 36 states/UTs.
  district = '';

  // ================= STEP 2: WORK & EDUCATION =================

  annualIncome = '';

  selectedOccupation = '';

  customOccupation = '';

  occupations = [
    { name: 'Student', icon: 'school', description: 'Currently studying' },
    { name: 'Farmer', icon: 'agriculture', description: 'Agriculture & allied activities' },
    { name: 'Salaried', icon: 'work', description: 'Private / Government employee' },
    { name: 'Self-employed', icon: 'store', description: 'Own business or freelance' },
    { name: 'Daily Wage Labourer', icon: 'construction', description: 'Informal / daily wage work' },
    { name: 'Homemaker', icon: 'home', description: 'Managing household' },
    { name: 'Retired / Pensioner', icon: 'elderly', description: 'Retired from work' },
    { name: 'Unemployed', icon: 'person_search', description: 'Currently not employed' },
    { name: 'Other', icon: 'more_horiz', description: 'None of the above' }
  ];

  selectedEducation = '';

  educationLevels = [
    'Below 10th',
    '10th Pass',
    '12th Pass',
    'Undergraduate',
    'Graduate',
    'Postgraduate',
    'Doctorate'
  ];

  // ================= STEP 3: INCOME & CATEGORY =================

  selectedCaste = '';

  casteCategories = [
    'General',
    'OBC',
    'SC',
    'ST',
    'EWS',
    'Minority'
  ];

  disability = 'No';

  // ================= RESULTS =================

  eligibleCount = 0;

  eligibilityResults: any[] = [];

  profileSummary = '';

  loading = false;

  // ================= METHODS =================

  selectOccupation(name: string): void {
    this.selectedOccupation = name;
    if (name !== 'Other') {
      this.customOccupation = '';
    }
  }

  nextStep(): void {

    if (this.currentStep === 3) {
      this.checkEligibility();
      return;
    }

    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }

  // ================= ELIGIBILITY CHECK =================

  checkEligibility(): void {

    this.loading = true;

    const occupation =
      this.selectedOccupation === 'Other'
        ? this.customOccupation
        : this.selectedOccupation;

    const request = {
      age: this.calculateAge(),
      gender: this.gender,
      income: Number(this.annualIncome),
      occupation,
      education: this.selectedEducation,
      location: this.state,
      district: this.district,
      social_category: this.selectedCaste,
      disability_status: this.disability === 'Yes'
    };

    this.http.post<any>(
      'http://127.0.0.1:8000/eligibility/check',
      request
    ).subscribe({

      next: (response) => {

        console.log('Eligibility response:', response);

        this.eligibleCount = response.eligible_count ?? 0;

        this.eligibilityResults = response.eligible_schemes ?? [];

        this.profileSummary = response.profile_summary ?? '';

        // Store the COMPLETE backend response — preserves benefits,
        // eligibility, category, department, application guidance,
        // profile summary and eligibility summary for the results page.
        this.eligibilityResultService.setResult(response);

        this.loading = false;

        this.currentStep = 4;
      },

      error: (error) => {

        console.error('Eligibility check failed:', error);

        this.loading = false;

        alert('Unable to check eligibility. Please make sure the backend server is running.');
      }

    });
  }

  // ================= AGE =================

  calculateAge(): number {

    if (!this.dob) {
      return 0;
    }

    const birthDate = new Date(this.dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  // ================= NAVIGATION =================

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  searchPolicies(): void {
    console.log(this.search);
  }

  // ================= RESTART =================

  restart(): void {

    this.currentStep = 1;

    this.dob = '';
    this.gender = '';
    this.state = '';
    this.district = '';

    this.annualIncome = '';
    this.selectedOccupation = '';
    this.customOccupation = '';
    this.selectedEducation = '';

    this.selectedCaste = '';
    this.disability = 'No';

    this.eligibleCount = 0;
    this.eligibilityResults = [];
    this.profileSummary = '';
    this.loading = false;

    this.eligibilityResultService.clearResult();
  }
}