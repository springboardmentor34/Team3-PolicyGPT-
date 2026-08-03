import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";

import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule
  ],
  templateUrl: "./login.html",
  styleUrl: "./login.scss",
})
export class LoginComponent {
  constructor(
  private authService: AuthService,
  private router: Router
) {}

  email = "";
  password = "";
  hidePassword = true;
  rememberMe = false;

  login() {

  const loginData = {
    email: this.email,
    password: this.password
  };

  this.authService.login(loginData).subscribe({

    next: (response: any) => {

      console.log(response);

      localStorage.setItem('token', response.access_token);

      alert('Login Successful');

      this.router.navigate(['/citizen-dashboard']);

    },

    error: (error) => {

      console.error(error);

      alert('Invalid Email or Password');

    }

  });

}

}