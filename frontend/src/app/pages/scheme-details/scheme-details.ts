//import { Component } from '@angular/core';
//import { CommonModule } from '@angular/common';
//import { RouterModule } from '@angular/router';

//import { MatButtonModule } from '@angular/material/button';
//import { MatCardModule } from '@angular/material/card';
//import { MatIconModule } from '@angular/material/icon';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class SchemeDetailsComponent implements OnInit{

  userName = 'Sri';
  constructor(
  private route: ActivatedRoute,
  private schemeService: SchemeService
) {}

ngOnInit(): void {

  const id = this.route.snapshot.paramMap.get('id');

  if (id) {

    this.schemeService.getSchemeById(id).subscribe({

    next: (response: any) => {

  const data = response.data;

  this.scheme = {
    title: data.scheme_name,
    category: data.category,
    ministry: data.department,
    status: "Available",
    deadline: "Not Available",
    mode: "Online",
    processing: "Not Available",
    website: "#"
  };

  this.benefits = [data.benefits];
  this.documents = ["Documents will be updated soon"];

  console.log(this.scheme);

},

      error: (err) => {

        console.error(err);

      }

    });

  }

}

scheme: any = {};

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