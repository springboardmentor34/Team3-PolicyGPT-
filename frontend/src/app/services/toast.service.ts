import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * ToastService
 * ----------------------------------------------------------------------
 * A single, shared way to show success/error/info messages, replacing
 * the plain browser alert() calls that were scattered across the app.
 * alert() blocks the entire page until dismissed and looks dated —
 * this uses Angular Material's snackbar (already a dependency, already
 * in use in a few pages) so messages appear as a small toast instead.
 * ----------------------------------------------------------------------
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private snackBar = inject(MatSnackBar);

  success(message: string, durationMs: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration: durationMs,
      panelClass: ['toast-success']
    });
  }

  error(message: string, durationMs: number = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration: durationMs,
      panelClass: ['toast-error']
    });
  }

  info(message: string, durationMs: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration: durationMs,
      panelClass: ['toast-info']
    });
  }
}