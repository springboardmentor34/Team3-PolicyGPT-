import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { Feedback } from '../../services/feedback';

@Component({
  selector: 'app-feedback-review',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './feedback-review.html',
  styleUrl: './feedback-review.scss'
})
export class FeedbackReviewComponent implements OnInit {

  feedbackList: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(private feedbackService: Feedback) {}

  ngOnInit(): void {
    this.loadFeedback();
  }

  loadFeedback(): void {
    this.loading = true;
    this.errorMessage = '';

    this.feedbackService.getFeedback().subscribe({
      next: (data: any[]) => {
        this.feedbackList = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.status === 403
          ? 'You do not have permission to view feedback.'
          : 'Could not load feedback. Please try again.';
      }
    });
  }

  starsFor(rating: number | null): number[] {
    return Array(rating || 0).fill(0);
  }

  get averageRating(): string {
    const rated = this.feedbackList.filter(f => f.rating != null);
    if (rated.length === 0) return '—';
    const sum = rated.reduce((total, f) => total + f.rating, 0);
    return (sum / rated.length).toFixed(1);
  }
}