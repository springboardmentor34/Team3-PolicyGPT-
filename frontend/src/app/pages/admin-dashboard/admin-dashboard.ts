import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Chart, ChartItem } from 'chart.js/auto';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  private adminService = inject(AdminService);
  private analyticsService = inject(AnalyticsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = true;
  error = '';
  stats: any = {
    total_users: 0,
    total_policies: 0,
    total_schemes: 0,
    pending_policies: 0,
    approved_policies: 0,
    rejected_policies: 0,
    users_by_role: {}
  };

  // ================= LIVE ANALYTICS (Milestone 3: Develop Analytics
  // Dashboard) — category/department breakdowns, rendered as real
  // Chart.js charts (per the project's stated tech stack) rather than
  // plain CSS bars. =================

  loadingAnalytics = true;
  analyticsError = '';

  policiesByCategory: { label: string; count: number }[] = [];
  policiesByDepartment: { label: string; count: number }[] = [];
  policiesByState: { label: string; count: number }[] = [];
  policiesUncategorizedCount = 0;
  schemesByCategory: { label: string; count: number }[] = [];
  schemesByDepartment: { label: string; count: number }[] = [];
  schemesByState: { label: string; count: number }[] = [];
  schemesUncategorizedCount = 0;
  policyApprovalTrend: { month: string; total: number; approved: number; pending: number; rejected: number }[] = [];

  // Department Analytics (Milestone 3) — per-department scheme counts
  // split into active vs inactive, from GET /analytics/department.
  // Loaded via its OWN subscription (loadDepartmentAnalytics below),
  // deliberately NOT folded into the forkJoin that loads admin stats +
  // overview + usage stats: that forkJoin fails as a whole if any one
  // member fails, which was silently leaving this table empty (staying
  // at its initial []) whenever /admin/stats or /admin/usage-stats
  // hiccuped — even though /analytics/department itself was working
  // fine on its own. Keeping it independent means a problem with the
  // admin-only endpoints can no longer blank out this table.
  departmentAnalytics: { department: string; total_schemes: number; active_schemes: number; inactive_schemes: number }[] = [];
  loadingDepartmentAnalytics = true;
  departmentAnalyticsError = '';

  // Policies Department Analytics (Milestone 3 extension) — same
  // independent-loading pattern as departmentAnalytics above (schemes),
  // over GET /analytics/department/policies instead.
  policyDepartmentAnalytics: { department: string; total_policies: number; active_policies: number; inactive_policies: number }[] = [];
  loadingPolicyDepartmentAnalytics = true;
  policyDepartmentAnalyticsError = '';

  // ================= USAGE STATISTICS (Milestone 3, Task 6) =================
  usageStats: {
    total_users: number;
    active_users_7d: number;
    total_eligibility_checks: number;
    most_viewed_policies: { policy_id: number; name: string; views: number }[];
    most_viewed_schemes: { scheme_id: number; name: string; views: number }[];
    most_searched_terms: { term: string; count: number }[];
  } | null = null;

  // ================= CHART CANVAS REFS =================

  @ViewChild('approvalStatusChart') approvalStatusCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('policyCategoryChart') policyCategoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('schemeCategoryChart') schemeCategoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('policyDepartmentChart') policyDepartmentCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('schemeDepartmentChart') schemeDepartmentCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('policyStateChart') policyStateCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('schemeStateChart') schemeStateCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('approvalTrendChart') approvalTrendCanvas!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  private readonly palette = [
    '#0F4C97', '#16A34A', '#D97706', '#DC2626', '#7C3AED',
    '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#4338CA'
  ];

  ngOnInit(): void {
    // Canvases are always present in the DOM (no *ngIf gating them),
    // so by the time ngOnInit runs, ngAfterViewInit has already fired
    // and every @ViewChild below is guaranteed to be populated. That
    // removes the entire class of "canvas doesn't exist yet" timing
    // bugs a setTimeout-based approach was fragile against.
    this.loadDashboard();
  }

  ngAfterViewInit(): void {}

  // ================= LOAD + RENDER (single deterministic pass) =================
  // forkJoin waits for BOTH /admin/stats and /analytics/overview to
  // genuinely complete, then charts are drawn exactly once — no
  // multi-flag juggling, no setTimeout guesswork.

  loadDashboard(): void {
    this.loading = true;
    this.error = '';
    this.loadingAnalytics = true;
    this.analyticsError = '';

    forkJoin({
      stats: this.adminService.getStats(),
      analytics: this.analyticsService.getOverview(),
      usage: this.adminService.getUsageStats()
    }).subscribe({
      next: ({ stats, analytics, usage }) => {
        this.stats = stats;
        this.loading = false;

        this.policiesByCategory = this.toBreakdownList(analytics.policies_by_category);
        this.policiesByDepartment = this.toBreakdownList(analytics.policies_by_department);
        const policyStateSplit = this.splitUncategorized(this.toBreakdownList(analytics.policies_by_state));
        this.policiesByState = policyStateSplit.rest;
        this.policiesUncategorizedCount = policyStateSplit.uncategorizedCount;
        this.schemesByCategory = this.toBreakdownList(analytics.schemes_by_category);
        this.schemesByDepartment = this.toBreakdownList(analytics.schemes_by_department);
        const schemeStateSplit = this.splitUncategorized(this.toBreakdownList(analytics.schemes_by_state));
        this.schemesByState = schemeStateSplit.rest;
        this.schemesUncategorizedCount = schemeStateSplit.uncategorizedCount;
        this.policyApprovalTrend = analytics.policy_approval_trend || [];

        this.usageStats = usage;

        this.loadingAnalytics = false;

        this.renderAllCharts();
      },
      error: (err) => {
        console.error('Failed to load dashboard data:', err);
        this.loading = false;
        this.loadingAnalytics = false;
        this.analyticsError = 'Unable to load analytics breakdown.';
      }
    });

    this.loadDepartmentAnalytics();
    this.loadPolicyDepartmentAnalytics();
  }

  // Independent of loadDashboard()'s forkJoin above on purpose — see the
  // comment on departmentAnalytics for why.
  loadDepartmentAnalytics(): void {
    this.loadingDepartmentAnalytics = true;
    this.departmentAnalyticsError = '';

    this.analyticsService.getDepartmentAnalytics().subscribe({
      next: (res: any) => {
        this.departmentAnalytics = res?.data ?? [];
        this.loadingDepartmentAnalytics = false;
      },
      error: (err) => {
        console.error('Failed to load department analytics:', err);
        this.loadingDepartmentAnalytics = false;
        this.departmentAnalyticsError = 'Unable to load department analytics.';
      }
    });
  }

  // Policies counterpart of loadDepartmentAnalytics() above — same
  // independent-subscription pattern, its own loading/error state.
  loadPolicyDepartmentAnalytics(): void {
    this.loadingPolicyDepartmentAnalytics = true;
    this.policyDepartmentAnalyticsError = '';

    this.analyticsService.getPolicyDepartmentAnalytics().subscribe({
      next: (res: any) => {
        this.policyDepartmentAnalytics = res?.data ?? [];
        this.loadingPolicyDepartmentAnalytics = false;
      },
      error: (err) => {
        console.error('Failed to load policy department analytics:', err);
        this.loadingPolicyDepartmentAnalytics = false;
        this.policyDepartmentAnalyticsError = 'Unable to load policy department analytics.';
      }
    });
  }

  // "Uncategorized" (a policy/scheme with no state set) tends to
  // dominate the State charts purely because it's a data-quality gap,
  // not a real state — pulling it out keeps the chart showing what it's
  // actually meant to show (real geographic distribution) while still
  // surfacing the gap honestly as a footnote instead of hiding it.
  private splitUncategorized(
    list: { label: string; count: number }[]
  ): { rest: { label: string; count: number }[]; uncategorizedCount: number } {
    const uncategorized = list.find(item => item.label === 'Uncategorized');
    return {
      rest: list.filter(item => item.label !== 'Uncategorized'),
      uncategorizedCount: uncategorized?.count ?? 0,
    };
  }

  private toBreakdownList(breakdown: Record<string, number> | undefined): { label: string; count: number }[] {
    if (!breakdown) return [];
    return Object.entries(breakdown)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Object.entries is not directly usable in templates without this helper.
  roleEntries(): [string, number][] {
    return Object.entries(this.stats.users_by_role || {}) as [string, number][];
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ================= CHART RENDERING =================
  // Called exactly once, from inside the forkJoin success callback
  // above — by that point both API calls have genuinely completed and
  // (since canvases are never behind *ngIf) every @ViewChild is
  // guaranteed to already be populated.

  private renderAllCharts(): void {
    // Guard against re-render duplicating chart instances on the same
    // canvas if this were ever called more than once.
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];

    this.renderApprovalStatusChart();
    this.renderCategoryChart(this.policyCategoryCanvas, this.policiesByCategory, 'Policies by Category', 'policy');
    this.renderCategoryChart(this.schemeCategoryCanvas, this.schemesByCategory, 'Schemes by Category', 'scheme');
    this.renderDepartmentChart(this.policyDepartmentCanvas, this.policiesByDepartment, 'Policies by Department');
    this.renderDepartmentChart(this.schemeDepartmentCanvas, this.schemesByDepartment, 'Schemes by Department');
    this.renderDepartmentChart(this.policyStateCanvas, this.policiesByState, 'Policies by State');
    this.renderDepartmentChart(this.schemeStateCanvas, this.schemesByState, 'Schemes by State');
    this.renderApprovalTrendChart();
  }

  private renderApprovalStatusChart(): void {
    if (!this.approvalStatusCanvas) return;

    const chart = new Chart(this.approvalStatusCanvas.nativeElement as ChartItem, {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [{
          data: [
            this.stats.approved_policies,
            this.stats.pending_policies,
            this.stats.rejected_policies
          ],
          backgroundColor: ['#16A34A', '#D97706', '#DC2626']
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Policy Approval Status' }
        }
      }
    });

    this.charts.push(chart);
  }

  private renderCategoryChart(
    canvasRef: ElementRef<HTMLCanvasElement>,
    data: { label: string; count: number }[],
    title: string,
    itemType: 'policy' | 'scheme' = 'policy'
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
        onClick: (_event, elements) => {
          if (elements.length === 0) return;
          const label = data[elements[0].index]?.label;
          if (label) {
            this.router.navigate(['/policy-search'], { queryParams: { category: label, type: itemType } });
          }
        },
        onHover: (event, elements) => {
          const target = event.native?.target as HTMLElement | undefined;
          if (target) {
            target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { size: 10 },
              padding: 8
            }
          },
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
              // Tooltip always shows the FULL label, even though the
              // axis itself shows a shortened version below — no data
              // is actually lost by truncating the on-chart text.
              title: (items) => data[items[0].dataIndex]?.label ?? ''
            }
          }
        },
        scales: {
          x: { ticks: { stepSize: 1 } },
          y: {
            ticks: {
              // Long department/state names were getting visually
              // clipped by the canvas edge. Truncating on the axis
              // (with the full name still in the tooltip above) keeps
              // every label readable instead of cut off mid-word.
              callback: function (value) {
                const label = String(this.getLabelForValue(value as number));
                return label.length > 26 ? label.slice(0, 24) + '…' : label;
              }
            }
          }
        }
      }
    });

    this.charts.push(chart);
  }

  private renderApprovalTrendChart(): void {
    if (!this.approvalTrendCanvas || this.policyApprovalTrend.length === 0) return;

    const chart = new Chart(this.approvalTrendCanvas.nativeElement as ChartItem, {
      type: 'line',
      data: {
        labels: this.policyApprovalTrend.map(item => item.month),
        datasets: [
          {
            label: 'Approved',
            data: this.policyApprovalTrend.map(item => item.approved),
            borderColor: '#16A34A',
            backgroundColor: '#16A34A',
            tension: 0.3
          },
          {
            label: 'Pending',
            data: this.policyApprovalTrend.map(item => item.pending),
            borderColor: '#D97706',
            backgroundColor: '#D97706',
            tension: 0.3
          },
          {
            label: 'Rejected',
            data: this.policyApprovalTrend.map(item => item.rejected),
            borderColor: '#DC2626',
            backgroundColor: '#DC2626',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Policy Approvals Over Time (by submission month)' }
        },
        scales: {
          y: { ticks: { stepSize: 1 }, beginAtZero: true }
        }
      }
    });

    this.charts.push(chart);
  }

  // ================= EXPORT: CSV DOWNLOAD =================
  // Same pattern as the Compare module's export — a real file to disk,
  // no server round-trip needed since the data is already loaded.

  exportAnalyticsCsv(): void {

    const escapeCsv = (value: any): string => {
      const text = value === null || value === undefined ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const lines: string[] = [];

    const addSection = (title: string, rows: { label: string; count: number }[]) => {
      lines.push(escapeCsv(title));
      lines.push([escapeCsv('Category/Department/State'), escapeCsv('Count')].join(','));
      rows.forEach(row => {
        lines.push([escapeCsv(row.label), escapeCsv(row.count)].join(','));
      });
      lines.push('');
    };

    lines.push(escapeCsv('Policy Approval Status'));
    lines.push([escapeCsv('Status'), escapeCsv('Count')].join(','));
    lines.push([escapeCsv('Approved'), escapeCsv(this.stats.approved_policies)].join(','));
    lines.push([escapeCsv('Pending'), escapeCsv(this.stats.pending_policies)].join(','));
    lines.push([escapeCsv('Rejected'), escapeCsv(this.stats.rejected_policies)].join(','));
    lines.push('');

    addSection('Policies by Category', this.policiesByCategory);
    addSection('Schemes by Category', this.schemesByCategory);
    addSection('Policies by Department', this.policiesByDepartment);
    addSection('Schemes by Department', this.schemesByDepartment);
    addSection('Policies by State', this.policiesByState);
    addSection('Schemes by State', this.schemesByState);

    if (this.policyApprovalTrend.length > 0) {
      lines.push(escapeCsv('Policy Approvals Over Time'));
      lines.push([
        escapeCsv('Month'), escapeCsv('Total'), escapeCsv('Approved'),
        escapeCsv('Pending'), escapeCsv('Rejected')
      ].join(','));
      this.policyApprovalTrend.forEach(item => {
        lines.push([
          escapeCsv(item.month), escapeCsv(item.total), escapeCsv(item.approved),
          escapeCsv(item.pending), escapeCsv(item.rejected)
        ].join(','));
      });
    }

    // Leading BOM so Excel opens the file with correct UTF-8 encoding.
    const csvContent = '\uFEFF' + lines.join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const dateStamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }

  // ================= EXPORT: PRINT / SAVE AS PDF =================
  // Uses the browser's own print dialog rather than a bundled PDF
  // library, same reasoning as the Compare module's export — no new
  // dependency risk this close to a demo.

  printAnalytics(): void {
    window.print();
  }
}