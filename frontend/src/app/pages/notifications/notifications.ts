import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class NotificationsComponent {

  selectedFilter = 'All';

filteredNotifications:any[] = [];
  selectedPeriod = 'Last 30 days';

  // ================= FILTERS =================

  filters = [
    'All',
    'Unread',
    'Applications',
    'System'
  ];

  periods = [
    'Today',
    'Last 7 Days',
    'Last 30 Days',
    'All'
  ];

  // ================= NOTIFICATIONS =================
notifications = [

  {
    id:1,
    type:'Applications',
    isRead:false,
    icon:'check_circle',
    color:'green',
    title:'Your PM Kisan application was approved',
    message:'Your application for PM Kisan Samman Nidhi has been approved. The first installment of ₹2,000 will be credited within 5 working days.',
    action:'View Application',
    time:'2 hours ago'
  },

  {
    id:2,
    type:'System',
    isRead:false,
    icon:'verified',
    color:'blue',
    title:'New Scheme Matched',
    message:'Based on your profile you are eligible for Skill India Digital.',
    action:'View Scheme',
    time:'Yesterday'
  },

  {
    id:3,
    type:'Applications',
    isRead:true,
    icon:'warning',
    color:'orange',
    title:'Document Verification Pending',
    message:'Please upload your updated Income Certificate to continue verification.',
    action:'Upload Document',
    time:'2 days ago'
  },

  {
    id:4,
    type:'Applications',
    isRead:false,
    icon:'calendar_month',
    color:'purple',
    title:'Application Deadline Reminder',
    message:'National Scholarship Portal applications close on 15 October 2026.',
    action:'Continue Application',
    time:'3 days ago'
  },

  {
    id:5,
    type:'Applications',
    isRead:true,
    icon:'task_alt',
    color:'green',
    title:'PM Awas Yojana Application Submitted',
    message:'We have received your application. You will be notified once the verification process is completed.',
    action:'Track Status',
    time:'5 days ago'
  },

  {
    id:6,
    type:'System',
    isRead:false,
    icon:'lock',
    color:'yellow',
    title:'Password Changed Successfully',
    message:'Your account password has been updated successfully.',
    action:'Security Settings',
    time:'1 week ago'
  }

];

  // ================= METHODS =================

  // ================= INITIALIZE =================

constructor(){

  this.filteredNotifications = [...this.notifications];

}

// ================= FILTER =================

setFilter(filter:string):void{

  this.selectedFilter = filter;

  this.filterNotifications();

}

filterNotifications():void{

  if(this.selectedFilter === 'All'){

    this.filteredNotifications = [...this.notifications];

  }

  else if(this.selectedFilter === 'Unread'){

    this.filteredNotifications = this.notifications.filter(

      item => !item.isRead

    );

  }

  else if(this.selectedFilter === 'Applications'){

    this.filteredNotifications = this.notifications.filter(

      item => item.type === 'Applications'

    );

  }

  else if(this.selectedFilter === 'System'){

    this.filteredNotifications = this.notifications.filter(

      item => item.type === 'System'

    );

  }

}

// ================= MARK ALL READ =================

markAllRead():void{

  this.notifications.forEach(item=>{

    item.isRead = true;

  });

  this.filterNotifications();

}

// ================= UNREAD COUNT =================

getUnreadCount():number{

  return this.notifications.filter(item=>!item.isRead).length;

}

}