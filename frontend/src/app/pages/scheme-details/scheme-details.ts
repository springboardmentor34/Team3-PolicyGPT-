import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SchemeService } from '../../services/scheme.service';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-scheme-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './scheme-details.html',
  styleUrls: ['./scheme-details.scss']
})
export class SchemeDetailsComponent implements OnInit {

  userName = 'Sri';

  scheme: any = {};

  benefits: string[] = [];

  eligibility: string[] = [];

  documents: string[] = [];

  applying = false;
  alreadyApplied = false;

  constructor(
    private route: ActivatedRoute,
    private schemeService: SchemeService,
    private applicationService: ApplicationService,
    private snackBar: MatSnackBar,
    private location: Location
  ) {}

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSchemeDetails(id);
    }
  }

  loadSchemeDetails(id: string): void {

    this.schemeService.getSchemeById(id).subscribe({

      next: (response: any) => {

        const data = response.data ?? response;

        console.log('Scheme from database:', data);

        // ================= SCHEME INFORMATION =================

        this.scheme = {
          scheme_id: data.scheme_id,

          title: data.scheme_name ?? 'Government Scheme',

          category: data.category ?? 'General',

          ministry: data.department ?? 'Government Department',

          status: data.status ?? 'Active',

          deadline: data.end_date ?? 'Not Available',

          mode: data.application_process ?? 'Online',

          processing: data.processing_time ?? 'Not Available',

          website: data.official_website ?? '#',

          applicationGuidance:
            data.application_process ??
            'Application guidance is not available.'
        };

        // Check whether the citizen already applied to this scheme, so
        // the button correctly shows "Applied" on every future visit —
        // not just for the rest of the current browser session.
        this.checkIfAlreadyApplied(this.scheme.scheme_id);

        // ================= BENEFITS =================

        this.benefits = this.convertToList(
          data.benefits,
          'Benefit information is not available.'
        );

        // ================= ELIGIBILITY =================

        this.eligibility = this.convertToList(
          data.eligibility,
          'Eligibility information is not available.'
        );

        // ================= DOCUMENTS =================

        this.documents = this.convertToList(
          data.required_documents,
          'Document information is not available.'
        );
      },

      error: (err) => {
        console.error('Failed to load scheme:', err);
      }

    });
  }

  // ================= CONVERT TEXT TO LIST =================

  private convertToList(
    value: any,
    fallback: string
  ): string[] {

    if (!value) {
      return [fallback];
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value : [fallback];
    }

    if (typeof value === 'string') {

      const items = value
        .split(/\r?\n|;/)
        .map(item => item.trim())
        .filter(item => item.length > 0);

      return items.length > 0 ? items : [fallback];
    }

    return [String(value)];
  }

  // ================= APPLY NOW =================
  // Previously this opened the scheme's official external website and
  // didn't reliably reflect whether you'd already applied. Per updated
  // requirements: no external redirect at all — Apply Now just records
  // the application here and flips the button to a disabled "Applied"
  // state, which is what then shows up in Application Status / the
  // Citizen Dashboard's Applications count (Module 8).

  checkIfAlreadyApplied(schemeId: number): void {
    if (!schemeId) return;
    this.applicationService.getMyApplications().subscribe({
      next: (response: any) => {
        const applications = response.data || [];
        this.alreadyApplied = applications.some((a: any) => a.scheme_id === schemeId);
      },
      // Not logged in, or the call failed — leave the button as
      // "Apply Now" rather than guessing; apply attempts will still be
      // caught by the backend's own duplicate check either way.
      error: () => {}
    });
  }

  applyNow(): void {
    if (this.alreadyApplied || this.applying || !this.scheme.scheme_id) {
      return;
    }

    this.applying = true;
    this.applicationService.applyToScheme(this.scheme.scheme_id).subscribe({
      next: () => {
        this.applying = false;
        this.alreadyApplied = true;
        this.snackBar.open('Application submitted — track its status under My Applications.', 'Close', { duration: 5000 });
      },
      error: (err) => {
        this.applying = false;
        if (err?.status === 400) {
          // Already applied per the backend (e.g. applied from another
          // tab/device) — treat it the same as a successful apply so the
          // button state stays correct.
          this.alreadyApplied = true;
          this.snackBar.open('You have already applied to this scheme.', 'Close', { duration: 4000 });
        } else if (err?.status === 401) {
          this.snackBar.open('Please log in to apply for this scheme.', 'Close', { duration: 4000 });
        } else {
          this.snackBar.open('Could not submit your application. Please try again.', 'Close', { duration: 4000 });
        }
      }
    });
  }
}