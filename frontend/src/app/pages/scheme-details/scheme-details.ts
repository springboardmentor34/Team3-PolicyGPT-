import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { EligibilityResultService } from '../../services/eligibility-result.service';

@Component({
  selector: 'app-scheme-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './scheme-details.html',
  styleUrls: ['./scheme-details.scss']
})
export class SchemeDetailsComponent implements OnInit {

  userName = 'Sri';

  scheme: any = {};

  benefits: string[] = [];

  eligibility: string[] = [];

  documents: string[] = [
    'Aadhaar Card',
    'Bank Passbook',
    'Land Ownership Certificate',
    'Income Certificate',
    'Passport Size Photo'
  ];

  constructor(
    private eligibilityResultService: EligibilityResultService
  ) {}

  ngOnInit(): void {
    this.loadSchemeDetails();
  }

  loadSchemeDetails(): void {

    const result = this.eligibilityResultService.getResult();

    if (
      !result ||
      !result.eligible_schemes ||
      result.eligible_schemes.length === 0
    ) {
      console.warn('No eligible scheme found.');
      return;
    }

    const data = result.eligible_schemes[0];

    console.log('Selected matched scheme:', data);

    // ================= SCHEME INFORMATION =================

    this.scheme = {
      title: data.scheme_name ?? 'Government Scheme',

      category: data.category ?? 'General',

      ministry: data.department ?? 'Government Department',

      status: 'Eligible',

      deadline: data.deadline ?? 'Not Available',

      mode: data.application_mode ?? 'Online',

      processing: data.processing_time ?? 'Not Available',

      website: data.website ?? '#',

      applicationGuidance:
        data.application_guidance ??
        'Application guidance is not available.'
    };

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

    console.log('Scheme details:', this.scheme);
    console.log('Benefits:', this.benefits);
    console.log('Eligibility:', this.eligibility);
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

  applyNow(): void {

    if (
      this.scheme.website &&
      this.scheme.website !== '#'
    ) {

      window.open(
        this.scheme.website,
        '_blank'
      );

    } else {

      alert(
        this.scheme.applicationGuidance ??
        'Official application portal is not available yet.'
      );
    }
  }
}