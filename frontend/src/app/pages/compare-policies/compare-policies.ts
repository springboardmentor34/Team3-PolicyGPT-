import { Component } from '@angular/core';
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

  // ================= USER =================

  userName = 'Sri';


  // ================= SEARCH =================

  search = '';


  // ================= SELECTED POLICIES =================

  selectedPolicy1 = 'PM Kisan Samman Nidhi';

  selectedPolicy2 = 'Ayushman Bharat PM-JAY';


  // ================= POLICY LIST =================

  policies = [

    {
      id: 1,
      name: 'PM Kisan Samman Nidhi',
      category: 'Agriculture',
      ministry: 'Ministry of Agriculture',
      benefit: '₹6,000 per year',
      eligibility: 'Farmers',
      income: 'No Income Limit',
      documents: 'Aadhaar, Bank Passbook',
      deadline: '30 Sep 2026',
      status: 'Active',
      apply: 'Online',
      processing: '15 Days'
    },

    {
      id: 2,
      name: 'Ayushman Bharat PM-JAY',
      category: 'Health',
      ministry: 'Ministry of Health',
      benefit: '₹5 Lakh Health Insurance',
      eligibility: 'BPL Families',
      income: 'Below Poverty Line',
      documents: 'Aadhaar, Ration Card',
      deadline: 'Ongoing',
      status: 'Active',
      apply: 'Online',
      processing: '10 Days'
    },

    {
      id: 7,
      name: 'PM Awas Yojana',
      category: 'Housing',
      ministry: 'Ministry of Housing',
      benefit: 'Housing Subsidy',
      eligibility: 'Economically Weaker Sections',
      income: 'Below ₹6 Lakhs',
      documents: 'Aadhaar, Income Certificate',
      deadline: '31 Dec 2026',
      status: 'Active',
      apply: 'Online',
      processing: '30 Days'
    },

    {
      id: 8,
      name: 'National Scholarship Portal',
      category: 'Education',
      ministry: 'Ministry of Education',
      benefit: 'Scholarship',
      eligibility: 'Students',
      income: 'Below ₹2.5 Lakhs',
      documents: 'Aadhaar, Income Certificate',
      deadline: '15 Oct 2026',
      status: 'Active',
      apply: 'Online',
      processing: '20 Days'
    },

    {
      id: 9,
      name: 'Skill India Mission',
      category: 'Employment',
      ministry: 'MSDE',
      benefit: 'Free Skill Training',
      eligibility: 'Youth',
      income: 'No Limit',
      documents: 'Aadhaar',
      deadline: 'Ongoing',
      status: 'Active',
      apply: 'Online',
      processing: '7 Days'
    }

  ];


  // ================= COMPARE DATA =================

  policyOne: any = null;

  policyTwo: any = null;


  // ================= CONSTRUCTOR =================

  constructor(
    private comparisonService: ComparisonService
  ) {
    this.comparePolicies();
  }


  // ================= METHODS =================

  comparePolicies(): void {

    // Find selected policies from local list

    const policy1 = this.policies.find(
      p => p.name === this.selectedPolicy1
    );

    const policy2 = this.policies.find(
      p => p.name === this.selectedPolicy2
    );


    if (!policy1 || !policy2) {
      console.error('Selected policies not found');
      return;
    }


    console.log('Selected Policy 1:', policy1);

    console.log('Selected Policy 2:', policy2);


    // Call backend

    this.comparisonService.compareSchemes(
      policy1.id,
      policy2.id
    ).subscribe({

      next: (response: any) => {

        console.log(
          'API Response:',
          JSON.stringify(response, null, 2)
        );


        // ================= POLICY 1 =================

        this.policyOne = {

          name: response.scheme_1.scheme_name,

          category: response.scheme_1.category,

          ministry: response.scheme_1.department,

          government_level: response.scheme_1.government_level,

          state: response.scheme_1.state,

          benefit: response.scheme_1.benefits,

          eligibility: response.scheme_1.eligibility,

          income: response.scheme_1.income_limit,

          documents: response.scheme_1.required_documents,

          deadline: response.scheme_1.end_date || 'Ongoing',

          status: response.scheme_1.status,

          apply: response.scheme_1.application_process,

          processing: response.scheme_1.processing_time,

          officialWebsite: response.scheme_1.official_website,

          description: response.scheme_1.description

        };


        // ================= POLICY 2 =================

        this.policyTwo = {

          name: response.scheme_2.scheme_name,

          category: response.scheme_2.category,

          ministry: response.scheme_2.department,

          government_level: response.scheme_2.government_level,

          state: response.scheme_2.state,

          benefit: response.scheme_2.benefits,

          eligibility: response.scheme_2.eligibility,

          income: response.scheme_2.income_limit,

          documents: response.scheme_2.required_documents,

          deadline: response.scheme_2.end_date || 'Ongoing',

          status: response.scheme_2.status,

          apply: response.scheme_2.application_process,

          processing: response.scheme_2.processing_time,

          officialWebsite: response.scheme_2.official_website,

          description: response.scheme_2.description

        };


        console.log(
          'Policy 1:',
          this.policyOne
        );

        console.log(
          'Policy 2:',
          this.policyTwo
        );

      },


      error: (error) => {

        console.error(
          'Comparison API Error:',
          error
        );

      }

    });

  }


  // ================= SWAP =================

  swapPolicies(): void {

    const temp = this.selectedPolicy1;

    this.selectedPolicy1 = this.selectedPolicy2;

    this.selectedPolicy2 = temp;

    this.comparePolicies();

  }


  // ================= RESET =================

  resetComparison(): void {

    this.selectedPolicy1 =
      'PM Kisan Samman Nidhi';

    this.selectedPolicy2 =
      'Ayushman Bharat PM-JAY';

    this.search = '';

    this.comparePolicies();

  }


  // ================= SEARCH =================

  searchPolicy(): void {

    if (this.search.trim() === '') {

      this.comparePolicies();

      return;

    }


    const keyword = this.search.toLowerCase();


    const result = this.policies.find(
      policy =>
        policy.name.toLowerCase().includes(keyword)
    );


    if (result) {

      this.selectedPolicy1 = result.name;

      this.comparePolicies();

    }

  }


  // ================= GET MATCH =================

  // getOverallMatch(): number {

  //   if (!this.policyOne || !this.policyTwo) {

  //     return 0;

  //   }


  //   let score = 0;


  //   if (
  //     this.policyOne.category ===
  //     this.policyTwo.category
  //   ) {

  //     score += 40;

  //   }


  //   if (
  //     this.policyOne.apply ===
  //     this.policyTwo.apply
  //   ) {

  //     score += 20;

  //   }


  //   if (
  //     this.policyOne.status ===
  //     this.policyTwo.status
  //   ) {

  //     score += 20;

  //   }


  //   if (
  //     this.policyOne.documents ===
  //     this.policyTwo.documents
  //   ) {

  //     score += 20;

  //   }


  //   return score;

  // }


  getOverallMatch(): number {

  if (!this.policyOne || !this.policyTwo) {
    return 0;
  }

  let score = 0;

  // Same category
  if (this.policyOne.category === this.policyTwo.category) {
    score += 25;
  }

  // Same application mode
  if (
    this.policyOne.apply &&
    this.policyTwo.apply &&
    this.policyOne.apply.toLowerCase().includes('online') ===
    this.policyTwo.apply.toLowerCase().includes('online')
  ) {
    score += 20;
  }

  // Same status
  if (this.policyOne.status === this.policyTwo.status) {
    score += 20;
  }

  // Similar processing time
  const processingOne = parseInt(this.policyOne.processing) || 0;
  const processingTwo = parseInt(this.policyTwo.processing) || 0;

  if (processingOne === processingTwo) {
    score += 20;
  } else if (Math.abs(processingOne - processingTwo) <= 5) {
    score += 10;
  }

  // Same government level
  if (
    this.policyOne.government_level &&
    this.policyTwo.government_level &&
    this.policyOne.government_level === this.policyTwo.government_level
  ) {
    score += 15;
  }

  return score;
}


  // ================= RECOMMENDATION =================

  // getRecommendation(): string {

  //   if (!this.policyOne || !this.policyTwo) {

  //     return 'No recommendation available';

  //   }


  //   let scoreOne = 0;

  //   let scoreTwo = 0;


  //   // Same category

  //   if (
  //     this.policyOne.category ===
  //     this.policyTwo.category
  //   ) {

  //     scoreOne += 1;

  //     scoreTwo += 1;

  //   }


  //   // Active status

  //   if (this.policyOne.status === 'Active') {

  //     scoreOne += 1;

  //   }


  //   if (this.policyTwo.status === 'Active') {

  //     scoreTwo += 1;

  //   }


  //   // Same government level

  //   if (
  //     this.policyOne.government_level ===
  //     this.policyTwo.government_level
  //   ) {

  //     scoreOne += 1;

  //     scoreTwo += 1;

  //   }


  //   if (scoreOne > scoreTwo) {

  //     return this.policyOne.name;

  //   }


  //   if (scoreTwo > scoreOne) {

  //     return this.policyTwo.name;

  //   }


  //   return 'Both policies are equally suitable';

  // }

  getRecommendation(): string {

  if (!this.policyOne || !this.policyTwo) {
    return 'No recommendation available';
  }

  let scoreOne = 0;
  let scoreTwo = 0;

  // ================= STATUS =================

  if (this.policyOne.status === 'Active') {
    scoreOne += 2;
  }

  if (this.policyTwo.status === 'Active') {
    scoreTwo += 2;
  }

  // ================= PROCESSING TIME =================
  // Lower processing time is better

  const processingOne = parseInt(this.policyOne.processing) || 999;
  const processingTwo = parseInt(this.policyTwo.processing) || 999;

  if (processingOne < processingTwo) {
    scoreOne += 3;
  } else if (processingTwo < processingOne) {
    scoreTwo += 3;
  }

  // ================= APPLICATION MODE =================

  if (
    this.policyOne.apply &&
    this.policyOne.apply.toLowerCase().includes('online')
  ) {
    scoreOne += 1;
  }

  if (
    this.policyTwo.apply &&
    this.policyTwo.apply.toLowerCase().includes('online')
  ) {
    scoreTwo += 1;
  }

  // ================= ELIGIBILITY =================
  // More general eligibility gets a small advantage

  if (
    this.policyOne.eligibility &&
    (
      this.policyOne.eligibility.toLowerCase().includes('youth') ||
      this.policyOne.eligibility.toLowerCase().includes('students') ||
      this.policyOne.eligibility.toLowerCase().includes('farmers')
    )
  ) {
    scoreOne += 1;
  }

  if (
    this.policyTwo.eligibility &&
    (
      this.policyTwo.eligibility.toLowerCase().includes('youth') ||
      this.policyTwo.eligibility.toLowerCase().includes('students') ||
      this.policyTwo.eligibility.toLowerCase().includes('farmers')
    )
  ) {
    scoreTwo += 1;
  }

  // ================= DOCUMENTS =================
  // Fewer required documents gets an advantage

  const documentsOne =
    this.policyOne.documents
      ? this.policyOne.documents.split(',').length
      : 999;

  const documentsTwo =
    this.policyTwo.documents
      ? this.policyTwo.documents.split(',').length
      : 999;

  if (documentsOne < documentsTwo) {
    scoreOne += 2;
  } else if (documentsTwo < documentsOne) {
    scoreTwo += 2;
  }

  // ================= FINAL RECOMMENDATION =================

  console.log('Recommendation Score 1:', scoreOne);
  console.log('Recommendation Score 2:', scoreTwo);

  if (scoreOne > scoreTwo) {
    return this.policyOne.name;
  }

  if (scoreTwo > scoreOne) {
    return this.policyTwo.name;
  }

  return 'Both policies are equally suitable';
}

}