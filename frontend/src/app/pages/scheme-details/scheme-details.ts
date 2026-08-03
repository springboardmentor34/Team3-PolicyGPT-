import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

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
export class SchemeDetailsComponent {

  userName = 'Sri';

  scheme = {

    title: 'PM Kisan Samman Nidhi',

    category: 'Agriculture',

    ministry: 'Ministry of Agriculture & Farmers Welfare',

    status: 'Eligible',

    deadline: '30 September 2026',

    mode: 'Online',

    processing: '30 Days',

    website: 'https://pmkisan.gov.in'

  };

  benefits = [

    '₹6,000 financial assistance every year',

    'Amount credited directly to bank account',

    'Support for small and marginal farmers',

    'No application processing fee'

  ];

  eligibility = [

    'Indian Citizen',

    'Must be a Farmer',

    'Own agricultural land',

    'Valid Aadhaar Card',

    'Active Bank Account'

  ];

  documents = [

    'Aadhaar Card',

    'Bank Passbook',

    'Land Ownership Certificate',

    'Income Certificate',

    'Passport Size Photo'

  ];

}