import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

export interface SidebarLink {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatListModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  @Input() title = 'Dashboard';
  @Input() links: SidebarLink[] = [
    { label: 'Overview', icon: 'dashboard', path: '/government-dashboard' },
    { label: 'Policy Management', icon: 'gavel', path: '/policy-search' },
    { label: 'Scheme Management', icon: 'volunteer_activism', path: '/scheme-details' },
    { label: 'Reports & Analytics', icon: 'bar_chart', path: '/reports' },
    { label: 'Notifications', icon: 'notifications', path: '/notifications' },
    { label: 'Profile', icon: 'person', path: '/profile' },
  ];
}
