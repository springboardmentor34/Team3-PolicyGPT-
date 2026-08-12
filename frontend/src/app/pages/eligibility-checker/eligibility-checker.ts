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

  // ================= USER =================

  userName = 'Sri';

  search = '';

  // ================= STEPPER =================

  currentStep = 1;

  // ================= PERSONAL INFO =================

  fullName = '';
  mobile = '';
  email = '';
  aadhaar = '';
  dob = '';
  gender = '';

  state = 'Tamil Nadu';
  district = '';

  districts = [
    'Chennai',
    'Coimbatore',
    'Salem',
    'Madurai',
    'Erode',
    'Trichy',
    'Tiruppur'
  ];

  // ================= INCOME =================

  annualIncome = '';

  selectedOccupation = 'Farmer';

  occupations = [
    {
      name: 'Farmer',
      icon: 'agriculture',
      description: 'Agriculture & allied activities'
    },
    {
      name: 'Self-employed',
      icon: 'store',
      description: 'Own business or freelance'
    },
    {
      name: 'Salaried',
      icon: 'work',
      description: 'Private / Government employee'
    },
    {
      name: 'Unemployed',
      icon: 'person',
      description: 'Currently not employed'
    }
  ];

  // ================= CATEGORY =================

  selectedCategory = '';
  selectedCaste = '';
  disability = 'No';

  categories = [
    'Student',
    'Farmer',
    'Women',
    'Senior Citizen',
    'Business',
    'Government Employee',
    'Self Employed',
    'Unemployed'
  ];

  casteCategories = [
    'General',
    'OBC',
    'SC',
    'ST',
    'EWS',
    'Minority'
  ];

  // ================= STATES =================

  states = [
    'Tamil Nadu',
    'Kerala',
    'Karnataka',
    'Andhra Pradesh',
    'Telangana',
    'Maharashtra',
    'Delhi'
  ];

  // ================= RESULTS =================

  eligibleCount = 0;

  eligibilityResults: any[] = [];

  loading = false;

  // ================= METHODS =================

  selectOccupation(name: string): void {
    this.selectedOccupation = name;
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

    const request = {
      age: this.calculateAge(),
      gender: this.gender,
      income: Number(this.annualIncome),
      occupation: this.selectedOccupation,
      education: 'Undergraduate',
      location: this.state,
      social_category: this.selectedCaste,
      disability_status: this.disability === 'Yes'
    };

    this.http.post<any>(
      'http://127.0.0.1:8000/eligibility/check',
      request
    ).subscribe({

      next: (response) => {

        console.log(
          'Eligibility response:',
          response
        );

        this.eligibleCount =
          response.eligible_count ?? 0;

        this.eligibilityResults =
          response.eligible_schemes ?? [];

        // Store the COMPLETE backend response.
        // This preserves benefits, eligibility,
        // category, department, application guidance, etc.
        this.eligibilityResultService.setResult(
          response
        );

        this.loading = false;

        this.currentStep = 4;
      },

      error: (error) => {

        console.error(
          'Eligibility check failed:',
          error
        );

        this.loading = false;

        alert(
          'Unable to check eligibility. Please make sure the backend server is running.'
        );
      }

    });
  }

  // ================= AGE =================

  calculateAge(): number {

    if (!this.dob) {
      return 25;
    }

    const birthDate = new Date(this.dob);
    const today = new Date();

    let age =
      today.getFullYear() -
      birthDate.getFullYear();

    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() < birthDate.getDate()
      )
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

    this.fullName = '';
    this.mobile = '';
    this.email = '';
    this.aadhaar = '';
    this.dob = '';
    this.gender = '';

    this.state = 'Tamil Nadu';
    this.district = '';

    this.annualIncome = '';

    this.selectedOccupation = 'Farmer';

    this.selectedCategory = '';
    this.selectedCaste = '';
    this.disability = 'No';

    this.eligibleCount = 0;
    this.eligibilityResults = [];
    this.loading = false;

    this.eligibilityResultService.clearResult();
  }
}