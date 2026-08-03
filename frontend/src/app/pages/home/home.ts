import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { SearchBarComponent } from '../../components/search-bar/search-bar';
import { PolicyCardComponent } from '../../components/policy-card/policy-card';
import { SchemeCardComponent } from '../../components/scheme-card/scheme-card';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';

import { PolicyService } from '../../services/policy.service';
import { SchemeService } from '../../services/scheme.service';
import { Policy } from '../../models/policy.model';
import { Scheme } from '../../models/scheme.model';

interface CategoryTile {
  name: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    SearchBarComponent,
    PolicyCardComponent,
    SchemeCardComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  featuredPolicies: Policy[] = [];
  latestSchemes: Scheme[] = [];
  categories: CategoryTile[] = [];

  loadingPolicies = true;
  loadingSchemes = true;
  loadingCategories = true;

  stats = [
    { label: 'Active Policies', value: '1,240+', icon: 'gavel' },
    { label: 'Public Schemes', value: '860+', icon: 'volunteer_activism' },
    { label: 'Citizens Served', value: '12M+', icon: 'groups' },
    { label: 'Government Departments', value: '95+', icon: 'account_balance' },
  ];

  constructor(
    private readonly router: Router,
    private readonly policyService: PolicyService,
    private readonly schemeService: SchemeService
  ) {}

  ngOnInit(): void {
    this.policyService.getAllPolicies().subscribe((policies) => {
      this.featuredPolicies = policies.slice(0, 3);
      this.loadingPolicies = false;
    });

    this.schemeService.getLatestSchemes(3).subscribe((schemes) => {
      this.latestSchemes = schemes;
      this.loadingSchemes = false;
    });

    this.policyService.getPopularCategories().subscribe((categories) => {
      this.categories = categories;
      this.loadingCategories = false;
    });
  }

  onHeroSearch(query: string): void {
    this.router.navigate(['/policy-search'], { queryParams: query ? { q: query } : {} });
  }

  onCategoryClick(category: CategoryTile): void {
    this.router.navigate(['/policy-search'], { queryParams: { category: category.name } });
  }
}
