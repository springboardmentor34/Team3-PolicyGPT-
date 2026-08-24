import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,

    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {

  constructor(
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  selectedRole = 'citizen';

  fullName = '';
  mobile = '';
  email = '';
  password = '';
  state = '';

  hidePassword = true;

  agree = false;

  // Full list of Indian states and union territories — matches the
  // Eligibility Checker's state list exactly, so a citizen's selected
  // state during registration lines up with anything filtered/matched
  // against it elsewhere in the app.
  states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  selectRole(role: string) {
    this.selectedRole = role;
  }

  createAccount() {

    const registerData = {
      full_name: this.fullName,
      email: this.email,
      password: this.password,
      role: this.selectedRole,
      mobile: this.mobile,
      state: this.state
    };

    this.authService.register(registerData).subscribe({

      next: (response: any) => {

        console.log(response);

        this.toast.success('Registration Successful');

        this.router.navigate(['/login']);

      },

      error: (error) => {

        console.error(error);

        this.toast.error('Registration Failed');

      }

    });

  }

}