import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';

interface Scheme{

id:number;

icon:string;

category:string;

title:string;

description:string;

ministry:string;

deadline:string;

status:string;

statusColor:string;

state:string;

incomeLimit:number;

eligible:boolean;

open:boolean;

}

@Component({
selector:'app-policy-search',
standalone:true,
imports:[
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
MatSliderModule
],
templateUrl:'./policy-search.html',
styleUrls:['./policy-search.scss']
})

export class PolicySearchComponent{

// ================= USER =================

userName='Sri';

// ================= SEARCH =================

search='';

selectedSort='Most Relevant';

// ================= PAGINATION =================

currentPage=1;

itemsPerPage=8;

pageNumbers=[1,2,3,4,5,6,7,8,9];

// ================= FILTERS =================

categoryAgriculture=false;

categoryHealth=false;

categoryEducation=false;

categoryEmployment=false;

categoryHousing=false;

stateTamilNadu=false;

stateKarnataka=false;

stateAllIndia=false;

eligibleOnly=false;

currentlyOpen=false;

selectedIncome=500000;

// ================= ARRAYS =================

schemes:Scheme[]=[];

filteredSchemes:Scheme[]=[];

displayedSchemes:Scheme[]=[];

// ================= CONSTRUCTOR =================

constructor(){

this.loadSchemes();

}

// ================= LOAD SCHEMES =================

loadSchemes(){

this.schemes=[

{

id:1,

icon:'agriculture',

category:'Agriculture',

title:'PM Kisan Samman Nidhi',

description:'Income support of ₹6,000 per year for eligible farmer families.',

ministry:'Ministry of Agriculture',

deadline:'30 Sep 2026',

status:'Eligible',

statusColor:'eligible',

state:'Tamil Nadu',

incomeLimit:500000,

eligible:true,

open:true

},

{

id:2,

icon:'health_and_safety',

category:'Health',

title:'Ayushman Bharat PM-JAY',

description:'Health insurance coverage up to ₹5 lakh.',

ministry:'Ministry of Health',

deadline:'Ongoing',

status:'Eligible',

statusColor:'eligible',

state:'All India',

incomeLimit:500000,

eligible:true,

open:true

},

{

id:3,

icon:'school',

category:'Education',

title:'National Scholarship Portal',

description:'Scholarship support for students.',

ministry:'Ministry of Education',

deadline:'15 Oct 2026',

status:'Review',

statusColor:'review',

state:'Tamil Nadu',

incomeLimit:250000,

eligible:false,

open:true

},

{

id:4,

icon:'home',

category:'Housing',

title:'PM Awas Yojana',

description:'Affordable housing assistance.',

ministry:'Ministry of Housing',

deadline:'31 Dec 2026',

status:'Eligible',

statusColor:'eligible',

state:'Karnataka',

incomeLimit:300000,

eligible:true,

open:false

},

{

id:5,

icon:'work',

category:'Employment',

title:'Skill India Mission',

description:'Skill development for youth.',

ministry:'MSDE',

deadline:'Ongoing',

status:'Eligible',

statusColor:'eligible',

state:'All India',

incomeLimit:500000,

eligible:true,

open:true

},

{

id:6,

icon:'payments',

category:'Finance',

title:'PM Mudra Loan',

description:'Business loan assistance.',

ministry:'Finance',

deadline:'Ongoing',

status:'Eligible',

statusColor:'eligible',

state:'Tamil Nadu',

incomeLimit:500000,

eligible:true,

open:true

},

{

id:7,

icon:'elderly',

category:'Pension',

title:'Atal Pension Yojana',

description:'Monthly pension scheme.',

ministry:'Finance',

deadline:'Ongoing',

status:'Eligible',

statusColor:'eligible',

state:'All India',

incomeLimit:500000,

eligible:true,

open:true

},

{

id:8,

icon:'groups',

category:'Women',

title:'Beti Bachao Beti Padhao',

description:'Women empowerment scheme.',

ministry:'Women & Child Development',

deadline:'31 Dec 2026',

status:'Eligible',

statusColor:'eligible',

state:'Tamil Nadu',

incomeLimit:500000,

eligible:true,

open:true

}

];

this.filteredSchemes=[...this.schemes];

this.displayedSchemes=[...this.filteredSchemes];

}
// ================= APPLY FILTERS =================

applyFilters(): void {

  this.filteredSchemes = this.schemes.filter((scheme) => {

    // ---------- Search ----------

    const matchesSearch =
      this.search.trim() === '' ||

      scheme.title.toLowerCase().includes(this.search.toLowerCase()) ||

      scheme.category.toLowerCase().includes(this.search.toLowerCase()) ||

      scheme.ministry.toLowerCase().includes(this.search.toLowerCase());

    // ---------- Category ----------

    let matchesCategory = true;

    if (
      this.categoryAgriculture ||
      this.categoryHealth ||
      this.categoryEducation ||
      this.categoryEmployment ||
      this.categoryHousing
    ) {

      matchesCategory =

        (this.categoryAgriculture && scheme.category === 'Agriculture') ||

        (this.categoryHealth && scheme.category === 'Health') ||

        (this.categoryEducation && scheme.category === 'Education') ||

        (this.categoryEmployment && scheme.category === 'Employment') ||

        (this.categoryHousing && scheme.category === 'Housing');

    }

    // ---------- State ----------

    let matchesState = true;

    if (
      this.stateTamilNadu ||
      this.stateKarnataka ||
      this.stateAllIndia
    ) {

      matchesState =

        (this.stateTamilNadu && scheme.state === 'Tamil Nadu') ||

        (this.stateKarnataka && scheme.state === 'Karnataka') ||

        (this.stateAllIndia && scheme.state === 'All India');

    }

    // ---------- Income ----------

    const matchesIncome =
      scheme.incomeLimit <= this.selectedIncome;

    // ---------- Eligible ----------

    const matchesEligible =
      !this.eligibleOnly || scheme.eligible;

    // ---------- Open ----------

    const matchesOpen =
      !this.currentlyOpen || scheme.open;

    return (

      matchesSearch &&

      matchesCategory &&

      matchesState &&

      matchesIncome &&

      matchesEligible &&

      matchesOpen

    );

  });

  this.sortSchemes();

}

// ================= SEARCH =================

searchPolicies(): void {

  this.applyFilters();

}

// ================= SORT =================

sortSchemes(): void {

  if (this.selectedSort === 'Newest') {

    this.filteredSchemes.sort((a, b) => b.id - a.id);

  }

  if (this.selectedSort === 'Most Relevant') {

    this.filteredSchemes.sort((a, b) => a.id - b.id);

  }

  if (this.selectedSort === 'Deadline') {

    this.filteredSchemes.sort((a, b) =>
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

  if (this.currentPage < this.pageNumbers.length) {

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

  this.stateTamilNadu = false;

  this.stateKarnataka = false;

  this.stateAllIndia = false;

  this.eligibleOnly = false;

  this.currentlyOpen = false;

  this.selectedIncome = 500000;

  this.selectedSort = 'Most Relevant';

  this.applyFilters();

}

// ================= RESET =================

resetFilters(): void {

  this.clearAllFilters();

}
}