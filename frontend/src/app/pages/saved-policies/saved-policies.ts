import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SavedPolicyService } from '../../services/saved-policy.service';

@Component({
  selector: 'app-saved-policies',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './saved-policies.html',
  styleUrls: ['./saved-policies.scss']
})
export class SavedPoliciesComponent implements OnInit {

  private savedPolicyService = inject(SavedPolicyService);
  private router = inject(Router);

  savedPolicies: any[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadSavedPolicies();
  }

  loadSavedPolicies(): void {
    this.loading = true;
    this.savedPolicyService.getMySaved().subscribe({
      next: (response: any) => {
        this.savedPolicies = (response.data || []).map((item: any) => ({
          id: item.policy.policy_id,
          title: item.policy.policy_name,
          category: item.policy.category,
          description: item.policy.description,
          savedOn: new Date(item.saved_at).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
          })
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  removePolicy(id: number): void {
    this.savedPolicyService.unsave(id).subscribe({
      next: () => {
        this.savedPolicies = this.savedPolicies.filter(item => item.id !== id);
      },
      error: (err) => console.error(err)
    });
  }

  viewDetails(id: number): void {
    this.router.navigate(['/policy-details', id]);
  }

}