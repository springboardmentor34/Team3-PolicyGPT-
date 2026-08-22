import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = true;
  saving = false;

  userName = '';
  userRole = '';

  // These two lists must match eligibility-checker.ts and
  // manage-policies-schemes.ts exactly — an official's rule requiring
  // 'Farmer' should still match a citizen whose profile says 'Farmer',
  // not a narrower or differently-worded list collected here.
  occupations = [
    'Student', 'Farmer', 'Salaried', 'Self-employed', 'Daily Wage Labourer',
    'Homemaker', 'Retired / Pensioner', 'Unemployed', 'Other'
  ];

  educationLevels = [
    'Below 10th', '10th Pass', '12th Pass', 'Undergraduate',
    'Graduate', 'Postgraduate', 'Doctorate'
  ];

  getRoleLabel(): string {
    const labels: { [key: string]: string } = {
      citizen: 'Verified Citizen',
      official: 'Government Official',
      researcher: 'Researcher',
      organization: 'Organization',
      admin: 'Administrator',
      administrator: 'Administrator',
    };
    return labels[this.userRole.toLowerCase()] || 'Verified Citizen';
  }

  user: any = {
    fullName: '',
    email: '',
    mobile: '',
    dob: '',
    gender: '',
    state: '',
    district: '',
    occupation: '',
    education: '',
    income: null,
    socialCategory: '',
    disabilityStatus: false,
  };

  statistics = {
    applications: 0,
    approved: 0,
    pending: 0,
    saved: 0,
  };

  isEditing = false;
  originalUser: any;

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loading = true;
    this.authService.getMe().subscribe({
      next: (data: any) => {
        this.user = {
          fullName: data.full_name || '',
          email: data.email || '',
          mobile: data.mobile || '',
          dob: data.date_of_birth || '',
          gender: data.gender || '',
          state: data.state || '',
          district: data.district || '',
          occupation: data.occupation || '',
          education: data.education || '',
          income: data.income ?? null,
          socialCategory: data.social_category || '',
          disabilityStatus: data.disability_status || false,
        };
        this.userName = this.user.fullName;
        this.userRole = data.role || 'citizen';
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.loading = false;
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  editProfile() {
    this.originalUser = { ...this.user };
    this.isEditing = true;
  }

  saveProfile() {
    this.saving = true;

    const payload = {
      full_name: this.user.fullName,
      mobile: this.user.mobile,
      date_of_birth: this.user.dob || null,
      gender: this.user.gender,
      state: this.user.state,
      district: this.user.district,
      occupation: this.user.occupation,
      education: this.user.education,
      income: this.user.income !== '' && this.user.income !== null ? Number(this.user.income) : null,
      social_category: this.user.socialCategory,
      disability_status: this.user.disabilityStatus,
    };

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.userName = this.user.fullName;
        this.isEditing = false;
        this.saving = false;
        alert('Profile updated successfully');
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        this.saving = false;
        alert('Could not update profile. Please try again.');
      },
    });
  }

  cancelEdit() {
    this.user = { ...this.originalUser };
    this.isEditing = false;
  }

  changePassword() {
    this.router.navigate(['/forgot-password']);
  }

  notificationSettings() {
    this.router.navigate(['/notifications']);
  }

  downloadProfile() {
    const blob = new Blob([JSON.stringify(this.user, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-profile.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}