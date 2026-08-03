import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './citizen-dashboard.html',
  styleUrls: ['./citizen-dashboard.scss']
})
export class CitizenDashboardComponent {
  constructor(private router: Router){}

  userName = 'Sri';

  search = '';

 stats = [

{
    icon:'task_alt',
    value:18,
    title:'Eligible Schemes',
    color:'#16A34A',
    badge:'+4',
    badgeClass:'green'
},

{
    icon:'bookmark',
    value:7,
    title:'Saved Policies',
    color:'#2563EB',
    badge:'saved',
    badgeClass:'blue'
},

{
    icon:'notifications',
    value:5,
    title:'Notifications',
    color:'#F59E0B',
    badge:'3 news',
    badgeClass:'orange'
},

{
    icon:'description',
    value:4,
    title:'Applications',
    color:'#2563EB',
    badge:'2 pending',
    badgeClass:'blue'
}

];

  schemes = [
    {
      category: 'AGRICULTURE',
      title: 'PM Kisan Samman Nidhi',
      status: 'Eligible',
      description: 'Income support of ₹6,000/year for small and marginal farmers.',
      deadline: 'Closes 30 Sep'
    },
    {
      category: 'HEALTH',
      title: 'Ayushman Bharat - PMJAY',
      status: 'Eligible',
      description: 'Health cover up to ₹5 lakh per family per year.',
      deadline: 'Ongoing'
    },
    {
      category: 'EDUCATION',
      title: 'National Scholarship Portal',
      status: 'Under Review',
      description: 'Merit and means scholarship for students.',
      deadline: 'Closes 15 Oct'
    },
    {
      category: 'HOUSING',
      title: 'PM Awas Yojana',
      status: 'Eligible',
      description: 'Affordable housing support.',
      deadline: 'Ongoing'
    }
  ];

  notifications = [
    {
      title: 'Your PM Kisan application was approved.',
      time: '2 hours ago'
    },
    {
      title: 'New scheme matched: Skill India Digital.',
      time: 'Yesterday'
    },
    {
      title: 'Document verification pending.',
      time: '2 days ago'
    }
  ];

  history = [
    'Farmer subsidy schemes',
    'Girl child education grant',
    'Health insurance eligibility'
  ];
  goToEligibleSchemes(){

  this.router.navigate(['/scheme-matches']);

}

goToSavedPolicies(){

  this.router.navigate(['/saved-policies']);

}

goToNotifications(){

  this.router.navigate(['/notifications']);

}

goToApplications(){

  this.router.navigate(['/applications']);

}
openCard(item:any){

  if(item.title === 'Eligible Schemes'){

    this.goToEligibleSchemes();

  }

  else if(item.title === 'Saved Policies'){

    this.goToSavedPolicies();

  }

  else if(item.title === 'Notifications'){

    this.goToNotifications();

  }

  else if(item.title === 'Applications'){

    this.goToApplications();

  }

}

}