import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { EligibilityResultService } from '../../services/eligibility-result.service';
import { SearchHistoryService } from '../../services/search-history.service';
import { SavedPolicyService } from '../../services/saved-policy.service';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './citizen-dashboard.html',
  styleUrls: ['./citizen-dashboard.scss']
})
export class CitizenDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private eligibilityResultService = inject(EligibilityResultService);
  private searchHistoryService = inject(SearchHistoryService);
  private savedPolicyService = inject(SavedPolicyService);

  userName = '';

  search = '';

  loadingEligibleCount = true;

  ngOnInit(): void {
    // Pull the real logged-in user's name instead of the old
    // hardcoded 'Sri' placeholder that showed for every citizen.
    this.authService.getMe().subscribe({
      next: (user: any) => {
        this.userName = (user.full_name || '').split(' ')[0] || 'Citizen';
      },
      error: () => {
        this.userName = 'Citizen';
      }
    });

    this.loadEligibleSchemesCount();
    this.loadSearchHistory();
    this.loadSavedPoliciesCount();
  }

  // Real "Saved Policies" count — was previously a hardcoded 7 that
  // never reflected what the citizen actually saved.
  loadSavedPoliciesCount(): void {
    this.savedPolicyService.getMySaved().subscribe({
      next: (response: any) => {
        const savedCard = this.stats.find(s => s.title === 'Saved Policies');
        if (savedCard) {
          savedCard.value = response.count || 0;
          savedCard.badge = response.count > 0 ? 'saved' : 'none yet';
        }
      },
      error: (err) => console.error(err)
    });
  }

  // Real "Recent Searches" — was previously a hardcoded array of 3
  // fake strings that never changed for any user.
  loadSearchHistory(): void {
    this.loadingHistory = true;
    this.searchHistoryService.getMyHistory(5).subscribe({
      next: (response: any) => {
        this.history = (response.data || []).map((h: any) => h.keyword);
        this.loadingHistory = false;
      },
      error: () => {
        this.history = [];
        this.loadingHistory = false;
      }
    });
  }

  // Live "Eligible Schemes" count, computed from the citizen's own stored
  // profile — was previously a hardcoded 18 (Milestone 3, Develop
  // Analytics Dashboard).
  loadEligibleSchemesCount(): void {
    this.loadingEligibleCount = true;
    this.http.get<any>('http://127.0.0.1:8000/eligibility/my-matches').subscribe({
      next: (response) => {
        const count = response?.eligible_count ?? 0;
        this.stats[0].value = count;
        // So "View My Matches" from /scheme-matches works even if the
        // citizen hasn't run the step-by-step checker this session.
        this.eligibilityResultService.setResult(response);
        this.loadingEligibleCount = false;
      },
      error: () => {
        // Leave the placeholder value in place rather than showing 0,
        // which would misleadingly read as "you qualify for nothing".
        this.loadingEligibleCount = false;
      }
    });
  }

 stats = [

{
    icon:'task_alt',
    value:18,
    title:'Eligible Schemes',
    color:'#16A34A',
    badge:'+4',
    badgeClass:'green'
},

{
    icon:'bookmark',
    value:7,
    title:'Saved Policies',
    color:'#2563EB',
    badge:'saved',
    badgeClass:'blue'
},

{
    icon:'notifications',
    value:5,
    title:'Notifications',
    color:'#F59E0B',
    badge:'3 news',
    badgeClass:'orange'
},

{
    icon:'description',
    value:4,
    title:'Applications',
    color:'#2563EB',
    badge:'2 pending',
    badgeClass:'blue'
}

];

  schemes = [
    {
      category: 'AGRICULTURE',
      title: 'PM Kisan Samman Nidhi',
      status: 'Eligible',
      description: 'Income support of ₹6,000/year for small and marginal farmers.',
      deadline: 'Closes 30 Sep'
    },
    {
      category: 'HEALTH',
      title: 'Ayushman Bharat - PMJAY',
      status: 'Eligible',
      description: 'Health cover up to ₹5 lakh per family per year.',
      deadline: 'Ongoing'
    },
    {
      category: 'EDUCATION',
      title: 'National Scholarship Portal',
      status: 'Under Review',
      description: 'Merit and means scholarship for students.',
      deadline: 'Closes 15 Oct'
    },
    {
      category: 'HOUSING',
      title: 'PM Awas Yojana',
      status: 'Eligible',
      description: 'Affordable housing support.',
      deadline: 'Ongoing'
    }
  ];

  notifications = [
    {
      title: 'Your PM Kisan application was approved.',
      time: '2 hours ago'
    },
    {
      title: 'New scheme matched: Skill India Digital.',
      time: 'Yesterday'
    },
    {
      title: 'Document verification pending.',
      time: '2 days ago'
    }
  ];

  history: string[] = [];
  loadingHistory = true;
  goToEligibleSchemes(){

  this.router.navigate(['/scheme-matches']);

}

goToSavedPolicies(){

  this.router.navigate(['/saved-policies']);

}

goToNotifications(){

  this.router.navigate(['/notifications']);

}

goToApplications(){

  this.router.navigate(['/applications']);

}
openCard(item:any){

  if(item.title === 'Eligible Schemes'){

    this.goToEligibleSchemes();

  }

  else if(item.title === 'Saved Policies'){

    this.goToSavedPolicies();

  }

  else if(item.title === 'Notifications'){

    this.goToNotifications();

  }

  else if(item.title === 'Applications'){

    this.goToApplications();

  }

}

}