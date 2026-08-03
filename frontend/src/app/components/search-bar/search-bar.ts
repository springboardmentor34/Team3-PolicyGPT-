import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBarComponent {
  /** Placeholder text shown inside the input */
  @Input() placeholder = 'Search policies, schemes, departments...';
  /** Bind an initial query value */
  @Input() query = '';
  /** Emits the trimmed search query whenever the user searches */
  @Output() search = new EventEmitter<string>();

  onSearch(): void {
    this.search.emit(this.query.trim());
  }

  onClear(): void {
    this.query = '';
    this.search.emit('');
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }
}
