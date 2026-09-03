import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationHistoryService } from '../../services/navigation-history.service';

/**
 * <app-back-button>
 * ----------------------------------------------------------------------
 * Drop this into any page's header to get a working Back button that
 * uses real browser history, with a safe dashboard fallback when there's
 * nowhere real to go back to. See NavigationHistoryService for the
 * actual logic — this component is just the shared button UI.
 * ----------------------------------------------------------------------
 */
@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      mat-icon-button
      class="app-back-button"
      (click)="navigationHistory.goBack()"
      aria-label="Go back">
      <mat-icon>arrow_back</mat-icon>
    </button>
  `,
  styles: [`
    .app-back-button {
      color: inherit;
    }
  `]
})
export class BackButtonComponent {
  protected navigationHistory = inject(NavigationHistoryService);
}