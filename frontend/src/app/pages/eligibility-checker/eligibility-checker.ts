import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';

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

  eligibleCount = 18;

  // ================= METHODS =================

  selectOccupation(name: string): void {
    this.selectedOccupation = name;
  }

  nextStep(): void {

    if (this.currentStep < 4) {
      this.currentStep++;
    }

  }

  previousStep(): void {

    if (this.currentStep > 1) {
      this.currentStep--;
    }

  }
  searchPolicies(): void {
  console.log(this.search);
}

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
  }

}