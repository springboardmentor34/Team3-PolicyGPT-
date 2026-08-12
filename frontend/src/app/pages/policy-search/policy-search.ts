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
import { PolicyService } from '../../services/policy.service';
import { AuthService } from '../../services/auth.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { OnInit } from '@angular/core';

interface Scheme{
id:number;
icon:string;
category:string;
title:string;
description:string;
ministry:string;
deadline:string;
publicationDate?: string;
status:string;
statusColor:string;
state:string;
eligible:boolean;
open:boolean;
}
@Component({
selector:'app-policy-search',
standalone:true,
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
templateUrl:'./policy-search.html',
styleUrls:['./policy-search.scss']
})

export class PolicySearchComponent implements OnInit {

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

categoryEducation=false;
categoryScholarships = false;
stateTamilNadu=false;
stateKarnataka=false;
stateAllIndia=false;
activeOnly=false;
eligibleOnly=false;
currentlyOpen=false;


selectedPublicationDate = '';

// ================= ARRAYS =================

schemes:Scheme[]=[];
filteredSchemes:Scheme[]=[];
displayedSchemes:Scheme[]=[];

// ================= CONSTRUCTOR =================

constructor(
  private policyService: PolicyService,
  private authService: AuthService
) {}

ngOnInit(): void {
  this.loadPolicies();
}

// ================= LOAD POLICIES =================

loadPolicies(keyword?: string): void {
  this.policyService.searchPolicies(keyword || '', 1).subscribe({
    next: (response: any) => {
      console.log('Search response:', response);
      this.schemes = response.policies.map((policy: any) => ({

        id: policy.policy_id,
        icon: 'description',
        category: policy.category,
        title: policy.policy_name,
        description: policy.description,
        ministry: policy.ministry,
        deadline: policy.effective_date || 'Ongoing',
        publicationDate: policy.publication_date,
        status: policy.status,
        statusColor: 'eligible',
        state: policy.state,
        incomeLimit: 500000,
        eligible: true,
        open: true

      }));

      // Also add schemes returned by backend
      response.schemes.forEach((scheme: any) => {

        this.schemes.push({

          id: scheme.scheme_id,
          icon: 'description',
          category: scheme.category,
          title: scheme.scheme_name,
          description: scheme.description,
          ministry: scheme.department,
          deadline: scheme.end_date || 'Ongoing',
          status: scheme.status,
          statusColor: 'eligible',
          state: scheme.state,
          eligible: true,
          open: true

        });

      });

      this.applyFilters();

    },

    error: (error) => {

      console.error('Search error:', error);

      alert('Unable to load search results');

    }

  });

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
  this.categoryEducation ||
  this.categoryScholarships
) {
  matchesCategory =
    (this.categoryEducation && scheme.category === 'Education') ||
    (this.categoryScholarships && scheme.category === 'Scholarships');
}

    // ---------- State ----------

    let matchesState = true;

    if (
      this.stateTamilNadu ||
      this.stateKarnataka ||
      this.stateAllIndia
    ) {

      matchesState =

        (this.stateTamilNadu && scheme.state === 'Taamil Nadu') ||

        (this.stateKarnataka && scheme.state === 'Karnataka') ||

        (this.stateAllIndia && scheme.state === 'All States')

    }
    // ---------- Eligible ----------

    const matchesEligible =
      !this.eligibleOnly || scheme.eligible;

    // ---------- Open ----------

    const matchesOpen =
      !this.currentlyOpen || scheme.open;

    const matchesPublicationDate =
  this.selectedPublicationDate === '' ||
  scheme.publicationDate === this.selectedPublicationDate;

    return (
  matchesSearch &&
  matchesCategory &&
  matchesState &&
 
  matchesEligible &&
  matchesOpen &&
  matchesPublicationDate
);

  });

  this.sortSchemes();

}

onPublicationDateChange(date: Date | null): void {

  if (!date) {
    this.selectedPublicationDate = '';
    this.applyFilters();
    return;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  this.selectedPublicationDate = `${year}-${month}-${day}`;

  console.log('Selected date:', this.selectedPublicationDate);
  console.log('Schemes:', this.schemes);

  this.applyFilters();
}
// ================= SEARCH =================
searchPolicies(): void {
  this.loadPolicies(this.search.trim() || undefined);
}

searchByCategory(category: string): void {

  this.policyService.getAllPolicies({
    category: category
  }).subscribe({

    next: (response: any) => {

      console.log('Category search response:', response);

      this.schemes = response.data.map((policy: any) => ({

        id: policy.policy_id,
        icon: 'description',
        category: policy.category,
        title: policy.policy_name,
        description: policy.description,
        ministry: policy.ministry,
        deadline: policy.effective_date || 'Ongoing',
        status: policy.status,
        statusColor: 'eligible',
        state: policy.state,
        incomeLimit: 500000,
        eligible: true,
        open: true

      }));

      this.filteredSchemes = this.schemes;

      this.currentPage = 1;

      this.updateDisplayedSchemes();

    },

    error: (error) => {
      console.error('Category search error:', error);
    }

  });

}
searchByState(state: string): void {

  // -------- POLICIES --------

  this.policyService.getAllPolicies({
    state: state
  }).subscribe({

    next: (policyResponse: any) => {

      console.log('Policy state response:', policyResponse);

      this.schemes = policyResponse.data.map((policy: any) => ({

        id: policy.policy_id,
        icon: 'description',
        category: policy.category,
        title: policy.policy_name,
        description: policy.description,
        ministry: policy.ministry,
        deadline: policy.effective_date || 'Ongoing',
        status: policy.status,
        statusColor: 'eligible',
        state: policy.state,
        incomeLimit: 500000,
        eligible: true,
        open: true

      }));

      // -------- SCHEMES --------

      this.policyService.searchSchemesByCategory('').subscribe({

        next: (schemeResponse: any) => {

          console.log('Scheme state response:', schemeResponse);

          const stateSchemes = schemeResponse.data.filter(
            (scheme: any) => scheme.state === state
          );

          stateSchemes.forEach((scheme: any) => {

            this.schemes.push({

  id: scheme.scheme_id,
  icon: 'description',
  category: scheme.category,
  title: scheme.scheme_name,
  description: scheme.description,
  ministry: scheme.department,
  deadline: scheme.end_date || 'Ongoing',
  publicationDate: '',
  status: scheme.status,
  statusColor: 'eligible',
  state: scheme.state,
  eligible: true,
  open: true

});

          });

          this.filteredSchemes = this.schemes;

          this.currentPage = 1;

          this.updateDisplayedSchemes();

        },

        error: (error) => {
          console.error('Scheme state search error:', error);
        }

      });

    },

    error: (error) => {
      console.error('Policy state search error:', error);
    }

  });

}
searchByMinistry(ministry: string): void {

  this.policyService.getAllPolicies({
    ministry: ministry
  }).subscribe({

    next: (response: any) => {

      console.log('Ministry search response:', response);

      this.schemes = response.data.map((policy: any) => ({

        id: policy.policy_id,
        icon: 'description',
        category: policy.category,
        title: policy.policy_name,
        description: policy.description,
        ministry: policy.ministry,
        deadline: policy.effective_date || 'Ongoing',
        status: policy.status,
        statusColor: 'eligible',
        state: policy.state,
        incomeLimit: 500000,
        eligible: true,
        open: true

      }));

      this.filteredSchemes = this.schemes;

      this.currentPage = 1;

      this.updateDisplayedSchemes();

    },

    error: (error) => {

      console.error('Ministry search error:', error);

    }

  });

}

searchSchemeByCategory(category: string): void {

  this.policyService.searchSchemesByCategory(category).subscribe({

    next: (response: any) => {

      console.log('Scheme category response:', response);

      this.schemes = response.data.map((scheme: any) => ({

        id: scheme.scheme_id,
        icon: 'description',
        category: scheme.category,
        title: scheme.scheme_name,
        description: scheme.description,
        ministry: scheme.department,
        deadline: scheme.end_date || 'Ongoing',
        status: scheme.status,
        statusColor: 'eligible',
        state: scheme.state,
        incomeLimit: 500000,
        eligible: true,
        open: true

      }));

      this.filteredSchemes = this.schemes;

      this.currentPage = 1;

      this.updateDisplayedSchemes();

    },

    error: (error) => {
      console.error('Scheme category search error:', error);
    }

  });

}

searchByDepartment(department: string): void {

  // -------- POLICIES --------

  this.policyService.getAllPolicies({
    department: department
  }).subscribe({

    next: (policyResponse: any) => {

      console.log('Policy department response:', policyResponse);

      this.schemes = policyResponse.data.map((policy: any) => ({

        id: policy.policy_id,
        icon: 'description',
        category: policy.category,
        title: policy.policy_name,
        description: policy.description,
        ministry: policy.ministry,
        deadline: policy.effective_date || 'Ongoing',
        status: policy.status,
        statusColor: 'eligible',
        state: policy.state,
        incomeLimit: 500000,
        eligible: true,
        open: true

      }));

      // -------- SCHEMES --------

      this.policyService.searchSchemesByDepartment(department).subscribe({

        next: (schemeResponse: any) => {

          console.log('Scheme department response:', schemeResponse);

          schemeResponse.data.forEach((scheme: any) => {

            this.schemes.push({

              id: scheme.scheme_id,
              icon: 'description',
              category: scheme.category,
              title: scheme.scheme_name,
              description: scheme.description,
              ministry: scheme.department,
              deadline: scheme.end_date || 'Ongoing',
              status: scheme.status,
              statusColor: 'eligible',
              state: scheme.state,
              eligible: true,
              open: true

            });

          });

          this.filteredSchemes = this.schemes;

          this.currentPage = 1;

          this.updateDisplayedSchemes();

        (this.categoryHealth && scheme.category === 'Healthcare') ||

        error: (error) => {
          console.error('Scheme department search error:', error);
        }

      });

    },

    error: (error) => {
      console.error('Policy department search error:', error);
    }

  });

}

searchByStatus(status: string): void {

  // -------- POLICIES --------

  this.policyService.getAllPolicies({
    status: status
  }).subscribe({

    next: (policyResponse: any) => {

      console.log('Policy status response:', policyResponse);

      this.schemes = policyResponse.data.map((policy: any) => ({

        id: policy.policy_id,
        icon: 'description',
        category: policy.category,
        title: policy.policy_name,
        description: policy.description,
        ministry: policy.ministry,
        deadline: policy.effective_date || 'Ongoing',
        status: policy.status,
        statusColor: 'eligible',
        state: policy.state,
        incomeLimit: 500000,
        eligible: true,
        open: true

      }));

      // -------- SCHEMES --------

      this.policyService.getAllSchemesByStatus(status).subscribe({

        next: (schemeResponse: any) => {

          console.log('Scheme status response:', schemeResponse);

          schemeResponse.data.forEach((scheme: any) => {

            this.schemes.push({

              id: scheme.scheme_id,
              icon: 'description',
              category: scheme.category,
              title: scheme.scheme_name,
              description: scheme.description,
              ministry: scheme.department,
              deadline: scheme.end_date || 'Ongoing',
              status: scheme.status,
              statusColor: 'eligible',
              state: scheme.state,
              eligible: true,
              open: true

            });

          });

          this.filteredSchemes = this.schemes;

          this.currentPage = 1;

          this.updateDisplayedSchemes();

        },

        error: (error: any) => {
          console.error('Scheme status search error:', error);
        }

      });

    },

    error: (error: any) => {
      console.error('Policy status search error:', error);
    }

  this.loadPolicies(this.search.trim() || undefined);

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
  this.categoryEducation = false;
  this.stateTamilNadu = false;
  this.stateKarnataka = false;
  this.stateAllIndia = false;
  this.activeOnly = false;
  this.selectedPublicationDate = '';
  this.eligibleOnly = false;
  this.currentlyOpen = false;
  this.categoryScholarships = false;
  this.selectedSort = 'Most Relevant';
  this.applyFilters();
}
// ================= RESET =================
resetFilters(): void {
  this.clearAllFilters();

}
}