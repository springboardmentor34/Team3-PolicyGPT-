import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Feedback } from '../../services/feedback';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.html',
  styleUrl: './feedback.scss'
})
export class FeedbackComponent {

  rating = 0;
  comments = '';

  submitting = false;
  successMessage = '';
  errorMessage = '';

  private userId = 1;

  constructor(private feedbackService: Feedback) {}

  setRating(value: number): void {
    this.rating = value;
  }

  submitFeedback(): void {

    this.successMessage = '';
    this.errorMessage = '';

    if (this.rating === 0) {
      this.errorMessage = 'Please select a rating.';
      return;
    }

    this.submitting = true;

    const feedbackData = {
      user_id: this.userId,
      policy_id: null,
      scheme_id: null,
      rating: this.rating,
      comments: this.comments || null
    };

    this.feedbackService.submitFeedback(feedbackData).subscribe({
      next: () => {
        this.submitting = false;
        this.successMessage = 'Feedback submitted successfully!';
        this.rating = 0;
        this.comments = '';
      },
      error: () => {
        this.submitting = false;
        this.errorMessage = 'Failed to submit feedback. Please try again.';
      }
    });
  }
}