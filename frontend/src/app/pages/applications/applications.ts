import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ApplicationService } from '../../services/application.service';

interface ApplicationView {
  application_id: number;
  scheme_id: number;
  scheme: string;
  status: string;
  date: string;
  color: string;
  icon: string;
  steps: StepView[];
}

const STATUS_STYLE: Record<string, { color: string; icon: string }> = {
  'Submitted': { color: 'blue', icon: 'description' },
  'Under Review': { color: 'orange', icon: 'schedule' },
  'Approved': { color: 'green', icon: 'check_circle' },
  'Rejected': { color: 'red', icon: 'cancel' },
};

interface StepView {
  label: string;
  state: 'done' | 'current' | 'pending' | 'rejected';
  lineClass: string;
}

// Submitted -> Under Review -> Approved, with Rejected able to end the
// journey at any point instead of Approved. The backend only stores the
// CURRENT status (no per-stage history), so a Rejected application can't
// distinguish "rejected immediately" from "rejected after review" —
// both earlier dots are shown as completed and the final dot shows the
// rejection itself, which is the simplification the current data model
// supports without adding a status-history table.
function buildSteps(status: string): StepView[] {
  let states: StepView['state'][];
  let labels: string[];

  switch (status) {
    case 'Under Review':
      states = ['done', 'current', 'pending'];
      labels = ['Submitted', 'Under Review', 'Approved'];
      break;
    case 'Approved':
      states = ['done', 'done', 'done'];
      labels = ['Submitted', 'Under Review', 'Approved'];
      break;
    case 'Rejected':
      states = ['done', 'done', 'rejected'];
      labels = ['Submitted', 'Under Review', 'Rejected'];
      break;
    case 'Submitted':
    default:
      states = ['current', 'pending', 'pending'];
      labels = ['Submitted', 'Under Review', 'Approved'];
  }

  return labels.map((label, i) => {
    let lineClass = '';
    if (i < labels.length - 1) {
      const current = states[i];
      const next = states[i + 1];
      if (current === 'done' && next === 'done') lineClass = 'filled';
      else if (current === 'done' && next === 'rejected') lineClass = 'filled-rejected';
    }
    return { label, state: states[i], lineClass };
  });
}

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './applications.html',
  styleUrl: './applications.scss'
})
export class ApplicationsComponent implements OnInit {
  private router = inject(Router);
  private applicationService = inject(ApplicationService);

  // Was previously a hardcoded array of 4 fake applications that never
  // changed for any user — now the citizen's own real submissions
  // (Milestone 3 / Module 8, Citizen Dashboard "Application Status").
  applications: ApplicationView[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.errorMessage = '';
    this.applicationService.getMyApplications().subscribe({
      next: (response: any) => {
        this.applications = (response.data || []).map((a: any) => {
          const style = STATUS_STYLE[a.status] || STATUS_STYLE['Submitted'];
          return {
            application_id: a.application_id,
            scheme_id: a.scheme_id,
            scheme: a.scheme_name,
            status: a.status,
            date: a.applied_at ? new Date(a.applied_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            }) : '',
            color: style.color,
            icon: style.icon,
            steps: buildSteps(a.status)
          };
        });
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load your applications right now.';
        this.loading = false;
      }
    });
  }

  viewDetails(schemeId: number): void {
    this.router.navigate(['/scheme-details', schemeId]);
  }
}