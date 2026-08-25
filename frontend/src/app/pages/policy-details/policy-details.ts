import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SchemeService } from '../../services/scheme.service';
import { PolicyService } from '../../services/policy.service';
import { SavedPolicyService } from '../../services/saved-policy.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-policy-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './policy-details.html',
  styleUrls: ['./policy-details.scss']
})
export class PolicyDetailsComponent implements OnInit{

  constructor(
  private route: ActivatedRoute,
  private policyService: PolicyService,
  private savedPolicyService: SavedPolicyService,
  private authService: AuthService,
  private location: Location
) {}

  goBack(): void {
    this.location.back();
  }

  policyId: string | null = null;
  isSaved = false;
  savingInProgress = false;

  ngOnInit(): void {

  const id = this.route.snapshot.paramMap.get('id');
  this.policyId = id;

  if (id) {

    this.policyService.getPolicyById(id).subscribe({

      next: (response: any) => {

        this.policy = response.data;

        console.log(this.policy);

      },

      error: (err) => {

        console.error(err);

      }

    });

    // Only check saved-state if actually logged in — guests can't save.
    if (this.authService.isLoggedIn()) {
      this.savedPolicyService.isSaved(id).subscribe({
        next: (res: any) => {
          this.isSaved = !!res.saved;
        },
        error: (err) => console.error(err)
      });
    }

  }

}

  toggleSave(): void {

    if (!this.authService.isLoggedIn() || !this.policyId) {
      return;
    }

    this.savingInProgress = true;

    if (this.isSaved) {
      this.savedPolicyService.unsave(this.policyId).subscribe({
        next: () => {
          this.isSaved = false;
          this.savingInProgress = false;
        },
        error: (err) => {
          console.error(err);
          this.savingInProgress = false;
        }
      });
    } else {
      this.savedPolicyService.save(this.policyId).subscribe({
        next: () => {
          this.isSaved = true;
          this.savingInProgress = false;
        },
        error: (err) => {
          console.error(err);
          this.savingInProgress = false;
        }
      });
    }

  }

  policy: any = {};

}