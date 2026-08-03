import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
export class PolicyDetailsComponent {

  userName = 'Sri';

  scheme = {
    title: 'PM Kisan Samman Nidhi (PM-KISAN)',
    category: 'Agriculture Policy',
    description:
      'A central sector scheme providing income support of ₹6,000 per year to all eligible farmer families through Direct Benefit Transfer (DBT).',
    benefit: '₹6,000 / Year',
    deadline: '30 September 2026',
    beneficiaries: '11.2 Crore+',
    coverage: 'All States',
    ministry: 'Ministry of Agriculture & Farmers Welfare'
  };

  overview = [
    'Provides financial assistance of ₹6,000 annually.',
    'Transferred directly into Aadhaar-linked bank accounts.',
    'Paid in three equal installments.',
    'Supports small and marginal farmers.'
  ];

  eligibility = [
    'Indian citizen.',
    'Must own cultivable agricultural land.',
    'Valid Aadhaar card.',
    'Active bank account linked with Aadhaar.',
    'Institutional landholders are not eligible.'
  ];

  documents = [
    'Aadhaar Card',
    'Land Ownership Certificate',
    'Bank Passbook',
    'Income Certificate (if required)',
    'Passport-size Photograph'
  ];

  faqs = [

    {
      question: 'Who can apply?',
      answer: 'All eligible landholding farmer families.'
    },

    {
      question: 'How much financial assistance is provided?',
      answer: '₹6,000 per year in three equal installments.'
    },

    {
      question: 'How will the amount be received?',
      answer: 'Through Direct Benefit Transfer (DBT) into the registered bank account.'
    }

  ];

  relatedSchemes = [

    {
      name: 'PM Fasal Bima Yojana',
      description: 'Crop Insurance Scheme'
    },

    {
      name: 'Kisan Credit Card',
      description: 'Agricultural Credit Support'
    },

    {
      name: 'Soil Health Card',
      description: 'Soil Nutrient Assessment'
    }

  ];

}