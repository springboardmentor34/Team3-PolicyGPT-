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
      id:1,
      name:'PM Kisan Samman Nidhi',
      category:'Agriculture',
      ministry:'Ministry of Agriculture',
      benefit:'₹6,000 per year',
      eligibility:'Farmers',
      income:'No Income Limit',
      documents:'Aadhaar, Bank Passbook',
      deadline:'30 Sep 2026',
      status:'Active',
      apply:'Online',
      processing:'15 Days'
    },

    {
      id:2,
      name:'Ayushman Bharat PM-JAY',
      category:'Health',
      ministry:'Ministry of Health',
      benefit:'₹5 Lakh Health Insurance',
      eligibility:'BPL Families',
      income:'Below Poverty Line',
      documents:'Aadhaar, Ration Card',
      deadline:'Ongoing',
      status:'Active',
      apply:'Online',
      processing:'10 Days'
    },

    {
      id:3,
      name:'PM Awas Yojana',

      category:'Housing',

      ministry:'Ministry of Housing',

      benefit:'Housing Subsidy',

      eligibility:'Economically Weaker Sections',

      income:'Below ₹6 Lakhs',

      documents:'Aadhaar, Income Certificate',

      deadline:'31 Dec 2026',

      status:'Active',

      apply:'Online',

      processing:'30 Days'

    },

    {
      id:4,

      name:'National Scholarship Portal',

      category:'Education',

      ministry:'Ministry of Education',

      benefit:'Scholarship',

      eligibility:'Students',

      income:'Below ₹2.5 Lakhs',

      documents:'Aadhaar, Income Certificate',

      deadline:'15 Oct 2026',

      status:'Active',

      apply:'Online',

      processing:'20 Days'

    },

    {
      id:5,

      name:'Skill India Mission',

      category:'Employment',

      ministry:'MSDE',

      benefit:'Free Skill Training',

      eligibility:'Youth',

      income:'No Limit',

      documents:'Aadhaar',

      deadline:'Ongoing',

      status:'Active',

      apply:'Online',

      processing:'7 Days'

    }

  ];

  // ================= COMPARE DATA =================

  policyOne: any;

  policyTwo: any;

  constructor() {

    this.comparePolicies();

  }
    // ================= METHODS =================

  comparePolicies(): void {

    this.policyOne = this.policies.find(

      p => p.name === this.selectedPolicy1

    );

    this.policyTwo = this.policies.find(

      p => p.name === this.selectedPolicy2

    );

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

    this.selectedPolicy1 = 'PM Kisan Samman Nidhi';

    this.selectedPolicy2 = 'Ayushman Bharat PM-JAY';

    this.search = '';

    this.comparePolicies();

  }

  // ================= SEARCH =================

  searchPolicy(): void {

    if(this.search.trim()===''){

      this.comparePolicies();

      return;

    }

    const keyword=this.search.toLowerCase();

    const result=this.policies.find(policy=>

      policy.name.toLowerCase().includes(keyword)

    );

    if(result){

      this.selectedPolicy1=result.name;

      this.comparePolicies();

    }

  }

  // ================= GET MATCH =================

  getOverallMatch(): number{

    let score=0;

    if(this.policyOne.category===this.policyTwo.category){

      score+=25;

    }

    if(this.policyOne.apply===this.policyTwo.apply){

      score+=25;

    }

    if(this.policyOne.status===this.policyTwo.status){

      score+=25;

    }

    if(this.policyOne.processing===this.policyTwo.processing){

      score+=25;

    }

    return score;

  }

  // ================= RECOMMENDATION =================

  getRecommendation(): string{

    if(this.policyOne.processing < this.policyTwo.processing){

      return this.policyOne.name;

    }

    return this.policyTwo.name;

  }

}