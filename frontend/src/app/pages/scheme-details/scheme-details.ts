import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { SchemeService } from '../../services/scheme.service';

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

  documents: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private schemeService: SchemeService,
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