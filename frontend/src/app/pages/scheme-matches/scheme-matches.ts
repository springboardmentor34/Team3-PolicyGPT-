import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

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
export class SchemeMatchesComponent {

  // ================= USER =================

  userName = 'Sri';

  search = '';

  totalMatches = 18;

  // ================= SCHEME LIST =================

  schemes = [

    {
      id: 1,
      category: 'Agriculture',
      title: 'PM Kisan Samman Nidhi',
      description: 'Income support of ₹6,000 per year for eligible farmers.',
      benefit: '₹6,000 / Year',
      deadline: '30 Sep 2026',
      status: 'Eligible',
      icon: 'agriculture'
    },

    {
      id: 2,
      category: 'Health',
      title: 'Ayushman Bharat PM-JAY',
      description: 'Health insurance coverage up to ₹5 lakh per family.',
      benefit: '₹5 Lakh Health Cover',
      deadline: 'Ongoing',
      status: 'Eligible',
      icon: 'health_and_safety'
    },

    {
      id: 3,
      category: 'Education',
      title: 'National Scholarship Portal',
      description: 'Scholarships for eligible school and college students.',
      benefit: 'Scholarship Assistance',
      deadline: '15 Oct 2026',
      status: 'Eligible',
      icon: 'school'
    },

    {
      id: 4,
      category: 'Housing',
      title: 'PM Awas Yojana',
      description: 'Affordable housing support for eligible families.',
      benefit: 'Housing Subsidy',
      deadline: 'Ongoing',
      status: 'Eligible',
      icon: 'home'
    },

    {
      id: 5,
      category: 'Employment',
      title: 'Skill India Mission',
      description: 'Free skill development training and certification.',
      benefit: 'Free Skill Training',
      deadline: 'Always Open',
      status: 'Eligible',
      icon: 'work'
    },

    {
      id: 6,
      category: 'Women',
      title: 'Mahila Shakti Scheme',
      description: 'Support for women entrepreneurs and self-help groups.',
      benefit: 'Business Support',
      deadline: '31 Dec 2026',
      status: 'Eligible',
      icon: 'groups'
    }

  ];

  // ================= METHODS =================

  viewScheme(scheme: any): void {

    console.log('Selected Scheme:', scheme);

    // Later we'll navigate to Scheme Details page

    // Example:
    // this.router.navigate(['/scheme-details', scheme.id]);

  }

}