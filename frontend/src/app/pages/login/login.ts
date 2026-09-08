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
import { ToastService } from '../../services/toast.service';
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
  private toast: ToastService,
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

      this.toast.success('Login Successful');

      const role = (this.getRoleFromToken(response.access_token) || '').trim().toLowerCase();

      // Case-insensitive, and matches every role variant your backend
      // itself already recognizes as "official" (see analytics.py's
      // _ANALYTICS_ROLES) — the previous exact-match check against
      // lowercase 'official'/'admin' never matched real seeded values
      // like 'Government Official' or 'Admin', so EVERY login (Official
      // and Admin alike) silently fell through to Citizen Dashboard here.
      if (['official', 'government official', 'government'].includes(role)) {
        this.router.navigate(['/government-dashboard']);
      } else if (['admin', 'administrator'].includes(role)) {
        this.router.navigate(['/admin-dashboard']);
      } else {
        this.router.navigate(['/citizen-dashboard']);
      }

    },

    error: (error) => {

      console.error(error);

      this.toast.error('Invalid Email or Password');

    }

  });

}

/**
 * Decodes the JWT payload (no verification needed here — this is purely
 * for deciding where to redirect after login; the backend independently
 * verifies the token's signature on every actual API request).
 */
private getRoleFromToken(token: string): string | null {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    return payload.role || null;
  } catch (e) {
    console.error('Could not decode token', e);
    return null;
  }
}

}