import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-government-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './government-dashboard.html',
  styleUrls: ['./government-dashboard.scss']
})
export class GovernmentDashboardComponent {

  search = '';

  officerName = 'Government Officer';

  totalSchemes = 52;

  totalApplications = 18245;

  pendingReview = 463;

  approved = 17120;

  applications = [

    {
      applicant: 'Ravi Kumar',
      scheme: 'PM Kisan',
      status: 'Approved',
      date: '02 Aug 2026'
    },

    {
      applicant: 'Priya',
      scheme: 'PMAY',
      status: 'Pending',
      date: '01 Aug 2026'
    },

    {
      applicant: 'Arjun',
      scheme: 'National Scholarship',
      status: 'Under Review',
      date: '31 Jul 2026'
    }

  ];

  notifications = [

    {
      icon: 'check_circle',
      title: 'PM Kisan applications approved',
      message: '125 applications approved today.',
      color: 'green'
    },

    {
      icon: 'warning',
      title: 'Pending document verification',
      message: '63 applications require verification.',
      color: 'orange'
    },

    {
      icon: 'campaign',
      title: 'New scheme published',
      message: 'Skill India Digital is now available.',
      color: 'blue'
    }

  ];

  deadlines = [

    {
      scheme: 'PM Kisan Registration',
      date: '30 Sep 2026'
    },

    {
      scheme: 'National Scholarship Portal',
      date: '15 Oct 2026'
    },

    {
      scheme: 'PMAY Scheme',
      date: '10 Nov 2026'
    }

  ];

  logout() {
    alert('Logged out successfully');
  }

  addScheme() {
    alert('Add Scheme');
  }

  manageSchemes() {
    alert('Manage Schemes');
  }

  manageUsers() {
    alert('Manage Users');
  }

  viewReports() {
    alert('Reports');
  }

}