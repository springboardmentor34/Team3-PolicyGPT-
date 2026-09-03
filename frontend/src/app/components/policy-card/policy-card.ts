import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Policy } from '../../models/policy.model';

@Component({
  selector: 'app-policy-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './policy-card.html',
  styleUrl: './policy-card.scss',
})
export class PolicyCardComponent {
  @Input({ required: true }) policy!: Policy;
}