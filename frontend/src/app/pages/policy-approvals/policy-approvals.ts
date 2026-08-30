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

  // ===== Policies I've approved — separate from the Pending queue above.
  // Loaded independently so a mistaken approval can be undone without
  // reloading the whole page. =====
  approvedByMe: any[] = [];
  loadingApproved = true;
  approvedErrorMessage = '';
  showApprovedSection = false;

  constructor(
    private readonly policyService: PolicyService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPendingPolicies();
    this.loadApprovedByMe();
  }

  loadApprovedByMe(): void {
    this.loadingApproved = true;
    this.approvedErrorMessage = '';
    this.policyService.getPoliciesApprovedByMe().subscribe({
      next: (res) => {
        this.approvedByMe = res?.data || [];
        this.loadingApproved = false;
      },
      error: (err) => {
        this.loadingApproved = false;
        this.approvedErrorMessage = err.status === 403
          ? 'You do not have permission to view this.'
          : 'Could not load your approval history.';
      },
    });
  }

  unapprove(policy: any): void {
    if (this.actionInProgressId) return;
    this.actionInProgressId = policy.policy_id;

    this.policyService.unapprovePolicy(policy.policy_id).subscribe({
      next: () => {
        this.actionInProgressId = null;
        this.snackBar.open(`"${policy.policy_name}" sent back to Pending.`, 'Close', { duration: 4000 });
        this.approvedByMe = this.approvedByMe.filter((p) => p.policy_id !== policy.policy_id);
        // It's back in the review queue now — refresh Pending so it
        // shows up there without a manual page reload.
        this.loadPendingPolicies();
      },
      error: (err) => {
        this.actionInProgressId = null;
        let message = 'Could not unapprove this policy. Please try again.';
        if (err.status === 403) {
          message = err.error?.detail || 'You can only unapprove policies you personally approved.';
        } else if (err.status === 400 && err.error?.detail) {
          message = err.error.detail;
        }
        this.snackBar.open(message, 'Close', { duration: 5000 });
      },
    });
  }

  /**
   * Groups the flat pending-policies list by who submitted them, so an
   * Admin reviewing the queue can see at a glance "these 3 are from
   * Priya, these 2 are from Elahiya" instead of one undifferentiated
   * list. Relies on uploaded_by_name/email now included in the
   * /policies/pending response (see policy.py).
   */
  // Was a `get groupedBySubmitter()` getter — Angular calls that on
  // EVERY change-detection cycle, and it built a brand-new array of
  // brand-new objects each time. Combined with *ngFor having no
  // trackBy, Angular saw every object as "new" on every check and
  // destroyed+recreated the whole card list constantly. Mounting a new
  // Material form-field (the reject textarea) triggers its own change
  // detection, which called this getter again, which looked "new"
  // again — a runaway loop that froze the tab the instant Reject was
  // clicked (Approve never mounts a new component, so it never
  // triggered this). Now a plain cached field, recomputed only when
  // pendingPolicies actually changes.
  groupedBySubmitter: { name: string; email: string | null; policies: any[] }[] = [];

  private recomputeGroupedBySubmitter(): void {
    const groups = new Map<string, { name: string; email: string | null; policies: any[] }>();

    for (const policy of this.pendingPolicies) {
      const key = policy.uploaded_by_name || 'Unknown';
      if (!groups.has(key)) {
        groups.set(key, { name: key, email: policy.uploaded_by_email || null, policies: [] });
      }
      groups.get(key)!.policies.push(policy);
    }

    this.groupedBySubmitter = Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  trackByGroupName(_index: number, group: { name: string }): string {
    return group.name;
  }

  trackByPolicyId(_index: number, policy: any): number {
    return policy.policy_id;
  }

  loadPendingPolicies(): void {
    this.loading = true;
    this.errorMessage = '';
    this.policyService.getPendingPolicies().subscribe({
      next: (res) => {
        this.pendingPolicies = res?.data || [];
        this.recomputeGroupedBySubmitter();
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
    this.recomputeGroupedBySubmitter();
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