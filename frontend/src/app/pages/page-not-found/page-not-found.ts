import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: "app-page-not-found",
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: "./page-not-found.html",
  styleUrl: "./page-not-found.scss",
})
export class PageNotFoundComponent {
  pageTitle = "Page Not Found";
}
