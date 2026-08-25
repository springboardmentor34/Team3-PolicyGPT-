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
import { ApplicationService } from '../../services/application.service';

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
  private applicationService = inject(ApplicationService);

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
    this.loadApplicationsCount();
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

  // Real "Applications" count — was previously a hardcoded 4 with a
  // hardcoded "2 pending" badge that never reflected anything the
  // citizen actually applied to (Application Status, Module 8).
  loadApplicationsCount(): void {
    this.applicationService.getMyApplications().subscribe({
      next: (response: any) => {
        const applicationsCard = this.stats.find(s => s.title === 'Applications');
        if (applicationsCard) {
          const apps = response.data || [];
          const pendingCount = apps.filter((a: any) =>
            a.status === 'Submitted' || a.status === 'Under Review'
          ).length;
          applicationsCard.value = apps.length;
          applicationsCard.badge = pendingCount > 0 ? `${pendingCount} pending` : 'up to date';
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

  // Live "Eligible Schemes" count AND the preview cards below, both
  // computed from the citizen's own stored profile — the count used to
  // be real but the 4 example scheme cards underneath it stayed a fixed
  // hardcoded array (PM Kisan, Ayushman Bharat, etc.) that never actually
  // reflected the citizen's own matches (Milestone 3, Develop Analytics
  // Dashboard + Citizen Dashboard "Eligible Schemes").
  loadEligibleSchemesCount(): void {
    this.loadingEligibleCount = true;
    this.http.get<any>('http://127.0.0.1:8000/eligibility/my-matches').subscribe({
      next: (response) => {
        const count = response?.eligible_count ?? 0;
        this.stats[0].value = count;
        this.schemes = (response?.eligible_schemes || [])
          .slice(0, 4)
          .map((s: any) => ({
            scheme_id: s.scheme_id,
            category: s.category,
            title: s.title,
            status: 'Eligible',
            description: s.description,
            deadline: s.deadline && s.deadline !== 'No deadline'
              ? `Closes ${s.deadline}`
              : 'Ongoing'
          }));
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
},

{
  icon:'star',
  value:'',
  title:'Give Feedback',
  color:'#F59E0B',
  badge:'Share your experience',
  badgeClass:'orange'
}

];

  // Populated by loadEligibleSchemesCount() with the citizen's own real
  // matches — starts empty rather than hardcoded so nothing misleading
  // shows before that call resolves.
  schemes: {
    scheme_id?: number;
    category: string;
    title: string;
    status: string;
    description: string;
    deadline: string;
  }[] = [];

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

// Quick Actions panel — previously 4 buttons with no (click) handlers
// at all (Search Schemes, Track Applications, Saved Policies, Update
// Profile). Track Applications / Saved Policies reuse the same
// navigation as their matching stat cards above; these two are new.

goToSearchSchemes(){

  this.router.navigate(['/policy-search'], { queryParams: { type: 'scheme' } });

}

goToProfile(){

  this.router.navigate(['/profile']);

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

  else if(item.title === 'Give Feedback'){

  this.router.navigate(['/feedback']);

}

}

}