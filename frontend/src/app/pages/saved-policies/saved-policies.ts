import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-saved-policies',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './saved-policies.html',
  styleUrls: ['./saved-policies.scss']
})
export class SavedPoliciesComponent {

  savedPolicies = [

    {
      id:1,
      title:'PM Kisan Samman Nidhi',
      category:'Agriculture',
      description:'Income support of ₹6,000 every year for eligible farmers.',
      savedOn:'02 Aug 2026'
    },

    {
      id:2,
      title:'Ayushman Bharat',
      category:'Health',
      description:'Health insurance coverage up to ₹5 lakh per family.',
      savedOn:'30 Jul 2026'
    },

    {
      id:3,
      title:'PM Awas Yojana',
      category:'Housing',
      description:'Affordable housing assistance for eligible families.',
      savedOn:'28 Jul 2026'
    },

    {
      id:4,
      title:'National Scholarship Portal',
      category:'Education',
      description:'Scholarships for school and college students.',
      savedOn:'25 Jul 2026'
    }

  ];

  removePolicy(id:number){

    this.savedPolicies=this.savedPolicies.filter(

      item=>item.id!==id

    );

  }

  viewDetails(id:number){

    alert("Open Scheme Details : "+id);

  }

}