import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Scheme } from '../../models/scheme.model';

@Component({
  selector: 'app-scheme-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './scheme-card.html',
  styleUrl: './scheme-card.scss',
})
export class SchemeCardComponent {
  @Input({ required: true }) scheme!: Scheme;
  @Output() save = new EventEmitter<Scheme>();

  onSave(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.save.emit(this.scheme);
  }
}
