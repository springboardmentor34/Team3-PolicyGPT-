import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

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

    console.log({
      role: this.selectedRole,
      fullName: this.fullName,
      mobile: this.mobile,
      email: this.email,
      password: this.password,
      state: this.state,
      agree: this.agree
    });

  }

}