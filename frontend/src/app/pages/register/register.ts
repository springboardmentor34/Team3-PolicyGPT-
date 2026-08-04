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

  states = [
    'Tamil Nadu',
    'Kerala',
    'Karnataka',
    'Andhra Pradesh',
    'Telangana',
    'Maharashtra',
    'Delhi',
    'Gujarat',
    'Punjab',
    'West Bengal'
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

        alert('Registration Successful');

        this.router.navigate(['/login']);

      },

      error: (error) => {

        console.error(error);

        alert('Registration Failed');

      }

    });

  }

}