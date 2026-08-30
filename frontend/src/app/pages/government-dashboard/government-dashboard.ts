import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Chart, ChartItem } from 'chart.js/auto';
import { ApplicationService } from '../../services/application.service';
import { SchemeService } from '../../services/scheme.service';
import { NotificationService } from '../../services/notification.service';
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
    MatInputModule,
    MatMenuModule,
    MatSnackBarModule
  ],
  templateUrl: './government-dashboard.html',
  styleUrls: ['./government-dashboard.scss']
})
export class GovernmentDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  private applicationService = inject(ApplicationService);
  private schemeService = inject(SchemeService);
  private notificationService = inject(NotificationService);
  private snackBar = inject(MatSnackBar);
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  search = '';
  officerName = 'Government Officer';
  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadAnalytics();
    this.loadContentUsage();
    this.loadApplications();
    this.loadDeadlines();
    this.loadNotifications();
  }
  loadCurrentUser(): void {
    this.authService.getMe().subscribe({
      next: (user: any) => {
        this.officerName = user.full_name || 'Government Officer';
      },
      error: () => {
        // Non-fatal — the dashboard still works with the generic label.
      }
    });
  }
  // ================= LIVE ANALYTICS (Milestone 3: Develop Analytics
  // Dashboard) — Policy Statistics + Scheme Usage Analytics, rendered
  // as real Chart.js charts (matches the Admin Dashboard's approach).
  //
  // Scope: the backend derives this from the caller's own role (see
  // analytics.py get_analytics_overview) — an Official always gets
  // "mine" (their own submissions only), Admin always gets "all"
  // (system-wide). `scope` below just reflects which one came back, so
  // the template can label cards "My Policies" vs "All Policies"
  // correctly instead of assuming. =================
  loadingAnalytics = true;
  analyticsError = '';
  scope: 'mine' | 'all' = 'mine';
  totalPolicies = 0;
  totalSchemes = 0;
  pendingPolicies = 0;
  approvedPolicies = 0;
  rejectedPolicies = 0;
  policiesByCategory: { label: string; count: number }[] = [];
  policiesByDepartment: { label: string; count: number }[] = [];
  schemesByCategory: { label: string; count: number }[] = [];
  policiesByStatus: { label: string; count: number }[] = [];
  policiesByState: { label: string; count: number }[] = [];
  schemesByState: { label: string; count: number }[] = [];
  // ===== Usage Statistics Dashboard (Milestone 3, task vi) =====
  schemesByStatus: { label: string; count: number }[] = [];
  schemeUsageTrend: { month: string; total: number; active: number; draft: number; pending: number; archived: number }[] = [];
  // ===== Approval trend (the one time-series chart for Task 1) =====
  approvalTrend: { month: string; approved: number; pending: number; rejected: number }[] = [];
  // Canvases are always in the DOM (never behind *ngIf), and charts are
  // created exactly once, right after the API call genuinely completes
  // — no readiness-flag juggling, no setTimeout guessing. This mirrors
  // the Admin Dashboard's chart architecture after a real bug there
  // (canvas hidden behind *ngIf + timing-based render trigger produced
  // an intermittent blank-chart failure that was hard to reproduce).
  @ViewChild('policyCategoryChart') policyCategoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('schemeCategoryChart') schemeCategoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('policyDepartmentChart') policyDepartmentCanvas!: ElementRef<HTMLCanvasElement>;
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
  // ===== Content usage — Most Viewed / Most Searched (Milestone 3, task
  // vi, the official-accessible half; see analytics.service.ts) =====
  loadingContentUsage = true;
  contentUsageError = '';
  mostViewedPolicies: { policy_id: number; name: string; views: number }[] = [];
  mostViewedSchemes: { scheme_id: number; name: string; views: number }[] = [];
  mostSearchedTerms: { term: string; count: number }[] = [];
  loadContentUsage(): void {
    this.loadingContentUsage = true;
    this.contentUsageError = '';
    this.analyticsService.getContentUsage().subscribe({
      next: (data: any) => {
        this.mostViewedPolicies = data.most_viewed_policies ?? [];
        this.mostViewedSchemes = data.most_viewed_schemes ?? [];
        this.mostSearchedTerms = data.most_searched_terms ?? [];
        this.loadingContentUsage = false;
      },
      error: (err) => {
        this.loadingContentUsage = false;
        this.contentUsageError = err?.status === 403
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
        this.scope = data.scope === 'all' ? 'all' : 'mine';
        this.totalPolicies = data.total_policies ?? 0;
        this.totalSchemes = data.total_schemes ?? 0;
        this.pendingPolicies = data.policies_by_approval?.['Pending'] ?? 0;
        this.approvedPolicies = data.policies_by_approval?.['Approved'] ?? 0;
        this.rejectedPolicies = data.policies_by_approval?.['Rejected'] ?? 0;
        this.policiesByCategory = this.toBreakdownList(data.policies_by_category);
        this.policiesByDepartment = this.toBreakdownList(data.policies_by_department);
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
  // Real applications submitted to this official's own schemes (or every
  // scheme, for Admin) — was previously a hardcoded 3-row list
  // (Ravi Kumar/Priya/Arjun) that never changed and whose View/Review
  // buttons did nothing. Populated by loadApplications() below.
  applications: any[] = [];
  loadingApplications = true;
  applicationActionInProgressId: number | null = null;
  readonly applicationStatuses = ['Submitted', 'Under Review', 'Approved', 'Rejected'];

  loadApplications(): void {
    this.loadingApplications = true;
    this.applicationService.getAllApplications().subscribe({
      next: (response: any) => {
        this.applications = (response.data || []).map((a: any) => ({
          application_id: a.application_id,
          applicant: a.applicant_name || 'Unknown Citizen',
          scheme: a.scheme_name,
          status: a.status,
          date: a.applied_at ? new Date(a.applied_at).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
          }) : ''
        }));
        this.loadingApplications = false;
      },
      error: () => {
        this.loadingApplications = false;
      }
    });
  }

  // Review action from the dashboard table's status dropdown — this is
  // what makes "Recent Applications" something an official can actually
  // act on, not just a static preview.
  updateApplicationStatus(app: any, status: string): void {
    if (this.applicationActionInProgressId) return;
    this.applicationActionInProgressId = app.application_id;

    this.applicationService.updateStatus(app.application_id, status).subscribe({
      next: () => {
        this.applicationActionInProgressId = null;
        app.status = status;
        this.snackBar.open(`${app.applicant}'s application marked as ${status}.`, 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.applicationActionInProgressId = null;
        const detail = err?.error?.detail;
        this.snackBar.open(typeof detail === 'string' ? detail : 'Failed to update application status', 'Close', { duration: 4000 });
      }
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'approved';
      case 'Rejected': return 'rejected';
      case 'Under Review': return 'review';
      default: return 'pending';
    }
  }
  // Real per-user notifications — previously 3 hardcoded rows shown
  // identically to every official regardless of who was logged in, plus
  // a top-nav bell badge that was always "5" with no click handler at
  // all (Officials had no way to reach /notifications from here).
  notifications: { id: number; icon: string; title: string; message: string; color: string; isRead: boolean }[] = [];
  unreadNotificationCount = 0;

  private static readonly NOTIFICATION_STYLE: Record<string, { icon: string; color: string }> = {
    'Policy Submitted': { icon: 'pending_actions', color: 'orange' },
    'Policy Approved': { icon: 'check_circle', color: 'green' },
    'Policy Rejected': { icon: 'cancel', color: 'red' },
    'New Policy': { icon: 'campaign', color: 'blue' },
    'New Scheme': { icon: 'campaign', color: 'blue' },
    'Scheme Updated': { icon: 'update', color: 'orange' },
    'Application Status': { icon: 'assignment_turned_in', color: 'orange' },
  };

  loadNotifications(): void {
    this.notificationService.getMyNotifications().subscribe({
      next: (response: any) => {
        this.unreadNotificationCount = response.unread_count || 0;
        this.notifications = (response.data || []).slice(0, 5).map((n: any) => {
          const style = GovernmentDashboardComponent.NOTIFICATION_STYLE[n.notification_type]
            || { icon: 'notifications', color: 'blue' };
          return {
            id: n.notification_id,
            icon: style.icon,
            title: n.title,
            message: n.message,
            color: style.color,
            isRead: n.is_read
          };
        });
      },
      error: (err) => console.error(err)
    });
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }
  deadlines: { scheme_id: number; scheme_name: string; end_date: string; category: string }[] = [];
  loadingDeadlines = true;
  deadlinesError = '';

  loadDeadlines(): void {
    this.loadingDeadlines = true;
    this.deadlinesError = '';
    this.schemeService.getUpcomingDeadlines(5).subscribe({
      next: (res: any) => {
        this.deadlines = res?.data || [];
        this.loadingDeadlines = false;
      },
      error: () => {
        this.loadingDeadlines = false;
        this.deadlinesError = 'Could not load upcoming deadlines.';
      }
    });
  }

  viewScheme(schemeId: number): void {
    this.router.navigate(['/scheme-details', schemeId]);
  }
}