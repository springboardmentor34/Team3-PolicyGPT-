import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AdminService } from '../../services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Chart, ChartItem } from 'chart.js/auto';

@Component({
  selector: 'app-government-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './government-dashboard.html',
  styleUrls: ['./government-dashboard.scss']
})
export class GovernmentDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  private adminService = inject(AdminService);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  search = '';
  officerName = 'Government Officer';

  // ================= LIVE ANALYTICS (Milestone 3: Develop Analytics
  // Dashboard) — Policy Statistics + Scheme Usage Analytics, rendered
  // as real Chart.js charts (matches the Admin Dashboard's approach). =================

  loadingAnalytics = true;
  analyticsError = '';
  totalPolicies = 0;
  totalSchemes = 0;
  pendingPolicies = 0;
  approvedPolicies = 0;
  policiesByCategory: { label: string; count: number }[] = [];
  policiesByDepartment: { label: string; count: number }[] = [];
  schemesByDepartment: { label: string; count: number }[] = [];
  schemesByCategory: { label: string; count: number }[] = [];
  policiesByStatus: { label: string; count: number }[] = [];
  policiesByState: { label: string; count: number }[] = [];
  schemesByState: { label: string; count: number }[] = [];

  // ===== Usage Statistics Dashboard (Milestone 3, task vi) =====
  schemesByStatus: { label: string; count: number }[] = [];
  schemeUsageTrend: { month: string; total: number; active: number; draft: number; pending: number; archived: number }[] = [];

  // ===== Approval trend (the one time-series chart for Task 1) =====
  approvalTrend: { month: string; approved: number; pending: number; rejected: number }[] = [];

  // ================= REAL USAGE STATISTICS (Milestone 3, Task 6) =================
  // Distinct from the content-analytics charts above (which describe
  // what's IN the platform) — this describes how people are actually
  // USING it: who's active, what's viewed, what's searched. Reuses the
  // same /admin/usage-stats endpoint the Admin Dashboard uses; now that
  // officials are permitted to call it too.
  loadingUsage = true;
  usageError = '';
  usageStats: {
    total_users: number;
    active_users_7d: number;
    total_eligibility_checks: number;
    most_viewed_policies: { policy_id: number; name: string; views: number }[];
    most_viewed_schemes: { scheme_id: number; name: string; views: number }[];
    most_searched_terms: { term: string; count: number }[];
  } | null = null;

  // Canvases are always in the DOM (never behind *ngIf), and charts are
  // created exactly once, right after the API call genuinely completes
  // — no readiness-flag juggling, no setTimeout guessing. This mirrors
  // the Admin Dashboard's chart architecture after a real bug there
  // (canvas hidden behind *ngIf + timing-based render trigger produced
  // an intermittent blank-chart failure that was hard to reproduce).

  @ViewChild('policyCategoryChart') policyCategoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('schemeCategoryChart') schemeCategoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('policyDepartmentChart') policyDepartmentCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('schemeDepartmentChart') schemeDepartmentCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('policyStatusChart') policyStatusCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('policyStateChart') policyStateCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('schemeStateChart') schemeStateCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('approvalTrendChart') approvalTrendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('schemeStatusChart') schemeStatusCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('schemeUsageTrendChart') schemeUsageTrendCanvas!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  private readonly palette = [
    '#0F4C97', '#16A34A', '#D97706', '#DC2626', '#7C3AED',
    '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#4338CA'
  ];

  ngOnInit(): void {
    this.loadAnalytics();
    this.loadUsageStats();
  }

  loadUsageStats(): void {
    this.loadingUsage = true;
    this.usageError = '';
    this.adminService.getUsageStats().subscribe({
      next: (data: any) => {
        this.usageStats = data;
        this.loadingUsage = false;
      },
      error: (err) => {
        this.loadingUsage = false;
        this.usageError = err?.status === 403
          ? 'You do not have permission to view usage statistics.'
          : 'Unable to load usage statistics right now.';
      }
    });
  }

  loadAnalytics(): void {
    this.loadingAnalytics = true;
    this.analyticsError = '';
    this.analyticsService.getOverview().subscribe({
      next: (data: any) => {
        this.totalPolicies = data.total_policies ?? 0;
        this.totalSchemes = data.total_schemes ?? 0;
        this.pendingPolicies = data.policies_by_approval?.['Pending'] ?? 0;
        this.approvedPolicies = data.policies_by_approval?.['Approved'] ?? 0;
        this.policiesByCategory = this.toBreakdownList(data.policies_by_category);
        this.policiesByDepartment = this.toBreakdownList(data.policies_by_department);
        this.schemesByDepartment = this.toBreakdownList(data.schemes_by_department);
        this.schemesByCategory = this.toBreakdownList(data.schemes_by_category);
        this.policiesByStatus = this.toBreakdownList(data.policies_by_status);
        this.policiesByState = this.toBreakdownList(data.policies_by_state);
        this.schemesByState = this.toBreakdownList(data.schemes_by_state);
        this.schemesByStatus = this.toBreakdownList(data.schemes_by_status);
        this.approvalTrend = data.policy_approval_trend ?? [];
        this.schemeUsageTrend = data.scheme_usage_trend ?? [];
        this.loadingAnalytics = false;

        this.renderAllCharts();
      },
      error: (err) => {
        this.loadingAnalytics = false;
        this.analyticsError = err?.status === 403
          ? 'You do not have permission to view analytics.'
          : 'Unable to load analytics right now.';
      }
    });
  }

  private toBreakdownList(breakdown: Record<string, number> | undefined): { label: string; count: number }[] {
    if (!breakdown) return [];
    return Object.entries(breakdown)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ================= CHART RENDERING =================

  private renderAllCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];

    this.renderCategoryChart(this.policyCategoryCanvas, this.policiesByCategory, 'Policies by Category');
    this.renderCategoryChart(this.schemeCategoryCanvas, this.schemesByCategory, 'Scheme Usage by Category');
    this.renderDepartmentChart(this.policyDepartmentCanvas, this.policiesByDepartment, 'Policies by Department');
    this.renderDepartmentChart(this.schemeDepartmentCanvas, this.schemesByDepartment, 'Schemes by Department');
    this.renderCategoryChart(this.policyStatusCanvas, this.policiesByStatus, 'Policies by Status');
    this.renderDepartmentChart(this.policyStateCanvas, this.policiesByState, 'Policies by State');
    this.renderDepartmentChart(this.schemeStateCanvas, this.schemesByState, 'Schemes by State');
    this.renderTrendChart(
      this.approvalTrendCanvas,
      this.approvalTrend,
      'Policy Approvals Over Time',
      [
        { key: 'approved', label: 'Approved', color: '#16A34A' },
        { key: 'pending', label: 'Pending', color: '#D97706' },
        { key: 'rejected', label: 'Rejected', color: '#DC2626' },
      ]
    );

    // ===== Usage Statistics Dashboard (Milestone 3, task vi) =====
    this.renderCategoryChart(this.schemeStatusCanvas, this.schemesByStatus, 'Schemes by Status');
    this.renderTrendChart(
      this.schemeUsageTrendCanvas,
      this.schemeUsageTrend,
      'Scheme Publishing Over Time',
      [
        { key: 'active', label: 'Active', color: '#16A34A' },
        { key: 'draft', label: 'Draft', color: '#6B7280' },
        { key: 'pending', label: 'Pending', color: '#D97706' },
        { key: 'archived', label: 'Archived', color: '#94A3B8' },
      ]
    );
  }

  private renderTrendChart(
    canvasRef: ElementRef<HTMLCanvasElement>,
    data: { month: string; [key: string]: string | number }[],
    title: string,
    series: { key: string; label: string; color: string }[]
  ): void {
    if (!canvasRef || data.length === 0) return;

    const chart = new Chart(canvasRef.nativeElement as ChartItem, {
      type: 'line',
      data: {
        labels: data.map(item => item.month as string),
        datasets: series.map(s => ({
          label: s.label,
          data: data.map(item => Number(item[s.key]) || 0),
          borderColor: s.color,
          backgroundColor: s.color,
          tension: 0.25,
          fill: false
        }))
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: title }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    this.charts.push(chart);
  }

  private renderCategoryChart(
    canvasRef: ElementRef<HTMLCanvasElement>,
    data: { label: string; count: number }[],
    title: string
  ): void {
    if (!canvasRef || data.length === 0) return;

    const chart = new Chart(canvasRef.nativeElement as ChartItem, {
      type: 'pie',
      data: {
        labels: data.map(item => item.label),
        datasets: [{
          data: data.map(item => item.count),
          backgroundColor: data.map((_, i) => this.palette[i % this.palette.length])
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: title }
        }
      }
    });

    this.charts.push(chart);
  }

  private renderDepartmentChart(
    canvasRef: ElementRef<HTMLCanvasElement>,
    data: { label: string; count: number }[],
    title: string
  ): void {
    if (!canvasRef || data.length === 0) return;

    const chart = new Chart(canvasRef.nativeElement as ChartItem, {
      type: 'bar',
      data: {
        labels: data.map(item => item.label),
        datasets: [{
          label: 'Count',
          data: data.map(item => item.count),
          backgroundColor: '#0F4C97'
        }]
      },
      options: {
        responsive: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          title: { display: true, text: title },
          tooltip: {
            callbacks: {
              title: (items) => data[items[0].dataIndex]?.label ?? ''
            }
          }
        },
        scales: {
          x: { ticks: { stepSize: 1 } },
          y: {
            ticks: {
              callback: function (value) {
                const label = String(this.getLabelForValue(value as number));
                return label.length > 16 ? label.slice(0, 14) + '…' : label;
              }
            }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  applications = [
    {
      applicant: 'Ravi Kumar',
      scheme: 'PM Kisan',
      status: 'Approved',
      date: '02 Aug 2026'
    },
    {
      applicant: 'Priya',
      scheme: 'PMAY',
      status: 'Pending',
      date: '01 Aug 2026'
    },
    {
      applicant: 'Arjun',
      scheme: 'National Scholarship',
      status: 'Under Review',
      date: '31 Jul 2026'
    }
  ];
  notifications = [
    {
      icon: 'check_circle',
      title: 'PM Kisan applications approved',
      message: '125 applications approved today.',
      color: 'green'
    },
    {
      icon: 'warning',
      title: 'Pending document verification',
      message: '63 applications require verification.',
      color: 'orange'
    },
    {
      icon: 'campaign',
      title: 'New scheme published',
      message: 'Skill India Digital is now available.',
      color: 'blue'
    }
  ];
  deadlines = [
    {
      scheme: 'PM Kisan Registration',
      date: '30 Sep 2026'
    },
    {
      scheme: 'National Scholarship Portal',
      date: '15 Oct 2026'
    },
    {
      scheme: 'PMAY Scheme',
      date: '10 Nov 2026'
    }
  ];
  addScheme() {
    alert('Add Scheme');
  }
  manageSchemes() {
    alert('Manage Schemes');
  }
  manageUsers() {
    alert('Manage Users');
  }
  viewReports() {
    alert('Reports');
  }
}