import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  quickLinks = [
    { label: 'Home', path: '/home' },
    { label: 'Policy Search', path: '/policy-search' },
    { label: 'Eligibility Checker', path: '/eligibility-checker' },
    { label: 'Compare Policies', path: '/compare-policies' },
    { label: 'Reports', path: '/reports' },
  ];

  resourceLinks = [
    { label: 'Citizen Dashboard', path: '/citizen-dashboard' },
    { label: 'Government Dashboard', path: '/government-dashboard' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Profile', path: '/profile' },
  ];
}
