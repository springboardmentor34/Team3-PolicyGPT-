import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
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
export class ApplicationsComponent {
  constructor(private router: Router) {}

  applications = [

  {
    id: 1,
    scheme: 'PM Kisan Samman Nidhi',
    status: 'Approved',
    date: '12 July 2026',
    color: 'green',
    icon: 'check_circle'
  },

  {
    id: 2,
    scheme: 'PM Awas Yojana',
    status: 'Under Review',
    date: '20 July 2026',
    color: 'orange',
    icon: 'schedule'
  },

  {
    id: 3,
    scheme: 'National Scholarship Portal',
    status: 'Pending Documents',
    date: '28 July 2026',
    color: 'blue',
    icon: 'description'
  },

  {
    id: 4,
    scheme: 'Ayushman Bharat',
    status: 'Approved',
    date: '30 July 2026',
    color: 'green',
    icon: 'verified'
  }

  ];
  viewDetails(id: number) {

  this.router.navigate(['/scheme-details', id]);

}

}