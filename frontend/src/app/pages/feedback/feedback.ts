import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Feedback } from '../../services/feedback';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.html',
  styleUrl: './feedback.scss'
})
export class FeedbackComponent implements OnInit {

  rating = 0;
  comments = '';

  submitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private feedbackService: Feedback,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Feedback requires a real logged-in identity now — the backend
    // derives user_id from the session token, it no longer accepts one
    // from the request body. A logged-out visitor has no session to
    // derive from, so send them to log in first rather than letting the
    // request fail confusingly after they've already filled the form.
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

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
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err?.status === 401
          ? 'Your session has expired. Please log in again.'
          : 'Failed to submit feedback. Please try again.';
      }
    });
  }
}