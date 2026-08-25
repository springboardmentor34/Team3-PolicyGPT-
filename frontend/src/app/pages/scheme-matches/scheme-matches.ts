import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { EligibilityResultService } from '../../services/eligibility-result.service';

@Component({
  selector: 'app-scheme-matches',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './scheme-matches.html',
  styleUrls: ['./scheme-matches.scss']
})
export class SchemeMatchesComponent implements OnInit {

  goBack(): void {
    this.location.back();
  }

  // ================= RESULTS =================

  totalMatches = 0;

  search = '';

  schemes: any[] = [];

  // (ii) User Profile Analysis
  profileSummary = '';

  // (iv) Eligibility Summary
  eligibilitySummary: any = null;

  // ================= CONSTRUCTOR =================

  constructor(
    private eligibilityResultService: EligibilityResultService,
    private location: Location
  ) {}

  // ================= INITIALIZE =================

  ngOnInit(): void {
    this.loadMatchedSchemes();
  }

  // ================= LOAD RESULTS =================

  loadMatchedSchemes(): void {

    const result =
      this.eligibilityResultService.getResult();

    if (!result) {
      this.totalMatches = 0;
      this.schemes = [];
      return;
    }

    this.totalMatches =
      result.eligible_count ?? 0;

    this.schemes =
      result.eligible_schemes ?? [];

    this.profileSummary =
      result.profile_summary ?? '';

    this.eligibilitySummary =
      result.eligibility_summary ?? null;

    console.log(
      'Matched schemes:',
      this.schemes
    );
  }

  // ================= METHODS =================

  viewScheme(scheme: any): void {

    console.log(
      'Selected Scheme:',
      scheme
    );

  }

}