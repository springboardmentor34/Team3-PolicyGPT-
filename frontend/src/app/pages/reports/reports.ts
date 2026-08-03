import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AfterViewInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ViewChild, ElementRef } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
  CommonModule,
  FormsModule,
  MatCardModule,
  MatIconModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule
],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})

export class ReportsComponent implements AfterViewInit {
  @ViewChild('applicationChart')
applicationChart!: ElementRef<HTMLCanvasElement>;

@ViewChild('categoryChart')
categoryChart!: ElementRef<HTMLCanvasElement>;

  // ================= USER =================

  userName = 'Sri';

  // ================= FILTER =================

  selectedPeriod = 'Last 6 Months';

  // ================= KPI CARDS =================

  statistics = [

    {
      title: 'Total Applications',
      value: '18,420',
      subtitle: '+6.4%',
      icon: 'monitor_heart',
      color: 'blue'
    },

    {
      title: 'Approved',
      value: '13,340',
      subtitle: '72.4%',
      icon: 'check_circle',
      color: 'green'
    },

    {
      title: 'Pending Review',
      value: '2,890',
      subtitle: 'Avg 4.2 days',
      icon: 'schedule',
      color: 'orange'
    },

    {
      title: 'Registered Citizens',
      value: '248,930',
      subtitle: '+8.2%',
      icon: 'person',
      color: 'purple'
    }

  ];

  // ================= LINE CHART =================

  monthlyApplications = [

    { month: 'Feb', submitted: 1200, approved: 800 },

    { month: 'Mar', submitted: 1800, approved: 1200 },

    { month: 'Apr', submitted: 1600, approved: 1100 },

    { month: 'May', submitted: 2800, approved: 1900 },

    { month: 'Jun', submitted: 3200, approved: 2300 },

    { month: 'Jul', submitted: 4300, approved: 3100 },

    { month: 'Aug', submitted: 5000, approved: 3800 }

  ];

  // ================= PIE CHART =================

  categoryReport = [

    {

      category:'Agriculture',

      percentage:51,

      color:'#2563EB'

    },

    {

      category:'Health',

      percentage:34,

      color:'#16A34A'

    },

    {

      category:'Education',

      percentage:15,

      color:'#F59E0B'

    }

  ];

  // ================= TABLE =================

  schemeReports = [

    {

      scheme:'PM Kisan Samman Nidhi',

      category:'Agriculture',

      applications:6840,

      approval:'81%',

      processing:'3.1 days',

      trend:'+4.2%'

    },

    {

      scheme:'Ayushman Bharat',

      category:'Health',

      applications:4420,

      approval:'88%',

      processing:'2.4 days',

      trend:'+2.8%'

    },

    {

      scheme:'National Scholarship Portal',

      category:'Education',

      applications:2960,

      approval:'81%',

      processing:'6.8 days',

      trend:'-1.6%'

    },

    {

      scheme:'PM Awas Yojana',

      category:'Housing',

      applications:3510,

      approval:'76%',

      processing:'5.2 days',

      trend:'+5.9%'

    }

  ];

  // ================= METHODS =================

  exportReport(){
    

    alert('Report exported successfully.');

  }
  // ================= CHART INIT =================

ngAfterViewInit(): void {

  this.loadLineChart();

  this.loadPieChart();

}

// ================= LINE CHART =================

loadLineChart(): void {

  new Chart(this.applicationChart.nativeElement, {

    type: 'line',

    data: {

      labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],

      datasets: [

        {

          label: 'Submitted',

          data: [1200, 1800, 1600, 2800, 3200, 4300, 5000],

          borderColor: '#2563EB',

          backgroundColor: 'rgba(37,99,235,0.2)',

          fill: true,

          tension: 0.4

        },

        {

          label: 'Approved',

          data: [800, 1200, 1100, 1900, 2300, 3100, 3800],

          borderColor: '#16A34A',

          backgroundColor: 'rgba(22,163,74,0.2)',

          fill: true,

          tension: 0.4

        }

      ]

    },

    options: {

      responsive: true,

      maintainAspectRatio: false

    }

  });

}

// ================= PIE CHART =================

loadPieChart(): void {

  new Chart(this.categoryChart.nativeElement, {

    type: 'doughnut',

    data: {

      labels: [

        'Agriculture',

        'Health',

        'Education'

      ],

      datasets: [

        {

          data: [51, 34, 15],

          backgroundColor: [

            '#2563EB',

            '#16A34A',

            '#F59E0B'

          ]

        }

      ]

    },

    options: {

      responsive: true,

      maintainAspectRatio: false

    }

  });

}

}