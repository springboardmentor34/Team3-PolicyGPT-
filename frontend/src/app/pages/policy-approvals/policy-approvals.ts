import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PolicyService } from '../../services/policy.service';

/**
 * Administrator Policy Approval page (Task 4)
 * ----------------------------------------------------------------------
 * Lists policies with approval_status = 'Pending' (GET /policies/pending,
 * admin-only on the backend) and lets an Administrator review full policy
 * details inline, then Approve or Reject (with a mandatory reason) a
 * policy. Approve/Reject call PATCH /policies/{id}/approve|reject, which
 * are also admin-only on the backend — this page's guard is a UX
 * convenience, not the real security boundary.
 *
 * Deliberately reuses PolicyService rather than a new service, and
 * mirrors the visual language (mat-card items, status-badge-style pills,
 * MatSnackBar for feedback) already established in
 * manage-policies-schemes so this page looks like it belongs to the app.
 * ----------------------------------------------------------------------
 */
@Component({
  selector: 'app-policy-approvals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './policy-approvals.html',
  styleUrl: './policy-approvals.scss',
})
export class PolicyApprovalsComponent implements OnInit {
  pendingPolicies: any[] = [];
  loading = true;
  errorMessage = '';

  /** policy_id of the card currently expanded for review, or null */
  expandedPolicyId: number | null = null;

  /** policy_id currently showing the reject-reason textarea */
  rejectingPolicyId: number | null = null;
  rejectReason = '';

  /** policy_id of the approve/reject request currently in flight, to disable buttons and avoid double-submits */
  actionInProgressId: number | null = null;

  constructor(
    private readonly policyService: PolicyService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPendingPolicies();
  }

  loadPendingPolicies(): void {
    this.loading = true;
    this.errorMessage = '';
    this.policyService.getPendingPolicies().subscribe({
      next: (res) => {
        this.pendingPolicies = res?.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) {
          this.errorMessage = 'You do not have permission to view pending policies.';
        } else if (err.status === 401) {
          this.errorMessage = 'Your session has expired. Please log in again.';
        } else {
          this.errorMessage = 'Could not load pending policies. Please check your connection and try again.';
        }
      },
    });
  }

  toggleReview(policyId: number): void {
    this.expandedPolicyId = this.expandedPolicyId === policyId ? null : policyId;
    // Collapse any open reject box from a different card when switching review targets.
    if (this.rejectingPolicyId !== policyId) {
      this.rejectingPolicyId = null;
      this.rejectReason = '';
    }
  }

  approve(policy: any): void {
    if (this.actionInProgressId) return;
    this.actionInProgressId = policy.policy_id;

    this.policyService.approvePolicy(policy.policy_id).subscribe({
      next: () => {
        this.actionInProgressId = null;
        this.snackBar.open(`"${policy.policy_name}" approved.`, 'Close', { duration: 4000 });
        this.removeFromPendingList(policy.policy_id);
      },
      error: (err) => {
        this.actionInProgressId = null;
        this.handleActionError(err, 'approve');
      },
    });
  }

  startReject(policyId: number): void {
    this.rejectingPolicyId = policyId;
    this.rejectReason = '';
  }

  cancelReject(): void {
    this.rejectingPolicyId = null;
    this.rejectReason = '';
  }

  confirmReject(policy: any): void {
    const reason = this.rejectReason.trim();
    if (!reason) {
      this.snackBar.open('Please enter a reason for rejection.', 'Close', { duration: 3000 });
      return;
    }
    if (this.actionInProgressId) return;
    this.actionInProgressId = policy.policy_id;

    this.policyService.rejectPolicy(policy.policy_id, reason).subscribe({
      next: () => {
        this.actionInProgressId = null;
        this.snackBar.open(`"${policy.policy_name}" rejected.`, 'Close', { duration: 4000 });
        this.rejectingPolicyId = null;
        this.rejectReason = '';
        this.removeFromPendingList(policy.policy_id);
      },
      error: (err) => {
        this.actionInProgressId = null;
        this.handleActionError(err, 'reject');
      },
    });
  }

  private removeFromPendingList(policyId: number): void {
    this.pendingPolicies = this.pendingPolicies.filter((p) => p.policy_id !== policyId);
    if (this.expandedPolicyId === policyId) this.expandedPolicyId = null;
  }

  private handleActionError(err: any, action: 'approve' | 'reject'): void {
    let message = `Could not ${action} the policy. Please try again.`;
    if (err.status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (err.status === 404) {
      message = 'This policy no longer exists.';
      this.loadPendingPolicies();
    } else if (err.status === 400 && err.error?.detail) {
      message = err.error.detail;
    } else if (err.status === 0) {
      message = 'Network error — please check your connection.';
    }
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }
}
