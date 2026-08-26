import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartItem } from 'chart.js/auto';
import { forkJoin } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

import { ToastService } from '../../services/toast.service';
import { AnalyticsService } from '../../services/analytics.service';
import { ApplicationService } from '../../services/application.service';

/**
 * Reports page (Milestone 3, Task 3 — Generate Reports)
 * ----------------------------------------------------------------------
 * Wired to real backend data, reusing endpoints that already exist:
 *   - AnalyticsService.getOverview()          -> /analytics/overview
 *   - ApplicationService.getAllApplications() -> /applications/all
 * Both auto-scope server-side (Official sees only their own
 * policies/schemes; Admin sees the system-wide picture).
 *
 * Chart rendering follows the exact pattern already proven in
 * admin-dashboard.ts: the <canvas> elements are NEVER behind *ngIf (see
 * reports.html — only the KPI cards/table are), so every @ViewChild
 * below is guaranteed populated by the time ngOnInit's data call
 * resolves, via forkJoin, in a single deterministic render pass. An
 * earlier version gated the canvases behind *ngIf and used a
 * setTimeout() to work around the resulting timing race — that's what
 * caused the charts to render blank; this version removes the race
 * entirely instead of guessing at a delay.
 * ----------------------------------------------------------------------
 */
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
  ],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss'],
})
export class ReportsComponent implements OnInit, AfterViewInit {
  private toast = inject(ToastService);
  private analyticsService = inject(AnalyticsService);
  private applicationService = inject(ApplicationService);

  @ViewChild('applicationChart') applicationChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChart!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  loading = true;
  errorMessage = '';

  /** 'mine' for an Official (their own submissions only) or 'all' for Admin — set from the backend response, never assumed client-side. */
  scope: 'mine' | 'all' = 'mine';

  // Display-only; /analytics/overview doesn't support a date-range filter
  // yet, so this doesn't re-query — kept so the control isn't torn out,
  // but it makes no functional claim it doesn't back up.
  selectedPeriod = 'Last 6 Months';

  // ================= KPI CARDS =================
  statistics: { title: string; value: string; subtitle: string; icon: string; color: string }[] = [];

  // ================= LINE CHART DATA (policy_approval_trend) =================
  private trendMonths: string[] = [];
  private trendSubmitted: number[] = [];
  private trendApproved: number[] = [];
  chartTotalThisPeriod = 0;

  // ================= DOUGHNUT CHART DATA (policies_by_category) =================
  categoryReport: { category: string; percentage: number; color: string }[] = [];

  // ================= TABLE (derived from /applications/all) =================
  schemeReports: {
    scheme: string;
    category: string;
    applications: number;
    approved: number;
    approvalRate: string;
  }[] = [];

  private readonly palette = ['#2563EB', '#16A34A', '#F59E0B', '#7C3AED', '#DB2777', '#0EA5E9', '#EA580C'];

  ngOnInit(): void {
    // Canvases are always present in the DOM (see reports.html — no
    // *ngIf gates them), so by the time this resolves, both @ViewChild
    // refs above are guaranteed populated. Matches the pattern in
    // admin-dashboard.ts's ngOnInit/loadDashboard.
    this.loadReportData();
  }

  ngAfterViewInit(): void {}

  loadReportData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      overview: this.analyticsService.getOverview(),
      applications: this.applicationService.getAllApplications(),
    }).subscribe({
      next: ({ overview, applications }) => {
        this.applyOverview(overview);
        this.applySchemeReport(applications?.data || []);
        this.loading = false;
        this.renderCharts();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.describeError(err);
      },
    });
  }

  private applyOverview(overview: any): void {
    this.scope = overview?.scope === 'all' ? 'all' : 'mine';

    const totalPolicies = overview?.total_policies ?? 0;
    const totalSchemes = overview?.total_schemes ?? 0;
    const approvalCounts = overview?.policies_by_approval || {};
    const pending = approvalCounts['Pending'] ?? 0;
    const approved = approvalCounts['Approved'] ?? 0;

    const scopeLabel = this.scope === 'all' ? 'All Officials' : 'Your Submissions';

    this.statistics = [
      { title: 'Total Policies', value: `${totalPolicies}`, subtitle: scopeLabel, icon: 'gavel', color: 'blue' },
      { title: 'Total Schemes', value: `${totalSchemes}`, subtitle: scopeLabel, icon: 'volunteer_activism', color: 'purple' },
      { title: 'Pending Approvals', value: `${pending}`, subtitle: 'Awaiting review', icon: 'schedule', color: 'orange' },
      { title: 'Approved Policies', value: `${approved}`, subtitle: totalPolicies ? `${Math.round((approved / totalPolicies) * 100)}%` : '0%', icon: 'check_circle', color: 'green' },
    ];

    // ---- Line chart: policy_approval_trend, [{month, total, approved, pending, rejected}] ----
    const trend = (overview?.policy_approval_trend || []) as { month: string; total: number; approved: number }[];
    this.trendMonths = trend.map((t) => this.formatMonth(t.month));
    this.trendSubmitted = trend.map((t) => t.total);
    this.trendApproved = trend.map((t) => t.approved);
    this.chartTotalThisPeriod = this.trendSubmitted.reduce((sum, n) => sum + n, 0);

    // ---- Doughnut chart: policies_by_category, {category: count} ----
    const byCategory = (overview?.policies_by_category || {}) as Record<string, number>;
    const totalForCategories = Object.values(byCategory).reduce((sum, n) => sum + n, 0) || 1;
    this.categoryReport = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count], i) => ({
        category,
        percentage: Math.round((count / totalForCategories) * 100),
        color: this.palette[i % this.palette.length],
      }));
  }

  private applySchemeReport(applications: any[]): void {
    const bySchemesMap = new Map<string, { category: string; applications: number; approved: number }>();

    for (const app of applications) {
      const key = app.scheme_name || 'Unknown Scheme';
      const entry = bySchemesMap.get(key) || { category: app.category || '—', applications: 0, approved: 0 };
      entry.applications += 1;
      if ((app.status || '').toLowerCase() === 'approved') entry.approved += 1;
      bySchemesMap.set(key, entry);
    }

    this.schemeReports = Array.from(bySchemesMap.entries())
      .map(([scheme, v]) => ({
        scheme,
        category: v.category,
        applications: v.applications,
        approved: v.approved,
        approvalRate: v.applications ? `${Math.round((v.approved / v.applications) * 100)}%` : '0%',
      }))
      .sort((a, b) => b.applications - a.applications);
  }

  private formatMonth(yyyyMm: string): string {
    // "2026-08" -> "Aug 2026"
    const [year, month] = yyyyMm.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  private describeError(err: any): string {
    if (err.status === 403) return 'You do not have permission to view reports.';
    if (err.status === 401) return 'Your session has expired. Please log in again.';
    if (err.status === 0) return 'Network error — please check your connection and try again.';
    return 'Could not load report data. Please try again.';
  }

  // ================= CHART RENDERING =================
  // Called exactly once, from inside the forkJoin success callback above
  // — by that point the API calls have genuinely completed and (since
  // canvases are never behind *ngIf) both @ViewChild refs are guaranteed
  // already populated.

  private renderCharts(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];

    this.renderLineChart();
    this.renderDoughnutChart();
  }

  private renderLineChart(): void {
    if (!this.applicationChart) return;

    const hasData = this.trendMonths.length > 0;
    const chart = new Chart(this.applicationChart.nativeElement as ChartItem, {
      type: 'line',
      data: {
        labels: hasData ? this.trendMonths : ['No data yet'],
        datasets: [
          {
            label: 'Submitted',
            data: hasData ? this.trendSubmitted : [0],
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37,99,235,0.2)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Approved',
            data: hasData ? this.trendApproved : [0],
            borderColor: '#16A34A',
            backgroundColor: 'rgba(22,163,74,0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: { responsive: false, maintainAspectRatio: false },
    });

    this.charts.push(chart);
  }

  private renderDoughnutChart(): void {
    if (!this.categoryChart) return;

    const hasData = this.categoryReport.length > 0;
    const labels = hasData ? this.categoryReport.map((c) => c.category) : ['No data yet'];
    const data = hasData ? this.categoryReport.map((c) => c.percentage) : [1];
    const colors = hasData ? this.categoryReport.map((c) => c.color) : ['#E5E7EB'];

    const chart = new Chart(this.categoryChart.nativeElement as ChartItem, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors }] },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 }, padding: 8 } } },
      },
    });

    this.charts.push(chart);
  }

  // ================= EXPORT (real files, not a toast-only stub) =================

  async exportPdf(): Promise<void> {
    try {
      const { jsPDF } = await import('jspdf');
      const { autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const generatedAt = new Date().toLocaleString();

      doc.setFontSize(18);
      doc.text('PolicyGPT — Reports Summary', 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${generatedAt}  |  Scope: ${this.scope === 'all' ? 'All Officials (Admin view)' : 'Your Submissions'}`, 14, 25);

      autoTable(doc, {
        startY: 32,
        head: [['Metric', 'Value']],
        body: this.statistics.map((s) => [s.title, s.value]),
        theme: 'striped',
        headStyles: { fillColor: [15, 76, 151] },
      });

      const afterKpiY = (doc as any).lastAutoTable?.finalY ?? 60;

      autoTable(doc, {
        startY: afterKpiY + 10,
        head: [['Scheme', 'Category', 'Applications', 'Approved', 'Approval Rate']],
        body: this.schemeReports.length
          ? this.schemeReports.map((r) => [r.scheme, r.category, `${r.applications}`, `${r.approved}`, r.approvalRate])
          : [['No application data available', '—', '—', '—', '—']],
        theme: 'striped',
        headStyles: { fillColor: [15, 76, 151] },
      });

      doc.save(`policygpt-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      this.toast.success('Report exported as PDF.');
    } catch (err) {
      this.toast.error('Could not generate the PDF. Please try again.');
    }
  }

  async exportExcel(): Promise<void> {
    try {
      const XLSX = await import('xlsx');

      const kpiSheet = XLSX.utils.json_to_sheet(
        this.statistics.map((s) => ({ Metric: s.title, Value: s.value, Note: s.subtitle }))
      );

      const trendSheet = XLSX.utils.json_to_sheet(
        this.trendMonths.map((month, i) => ({
          Month: month,
          Submitted: this.trendSubmitted[i] ?? 0,
          Approved: this.trendApproved[i] ?? 0,
        }))
      );

      const categorySheet = XLSX.utils.json_to_sheet(
        this.categoryReport.map((c) => ({ Category: c.category, 'Share (%)': c.percentage }))
      );

      const schemeSheet = XLSX.utils.json_to_sheet(
        this.schemeReports.map((r) => ({
          Scheme: r.scheme,
          Category: r.category,
          Applications: r.applications,
          Approved: r.approved,
          'Approval Rate': r.approvalRate,
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');
      XLSX.utils.book_append_sheet(workbook, trendSheet, 'Monthly Trend');
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'By Category');
      XLSX.utils.book_append_sheet(workbook, schemeSheet, 'Scheme-wise Report');

      XLSX.writeFile(workbook, `policygpt-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      this.toast.success('Report exported as Excel.');
    } catch (err) {
      this.toast.error('Could not generate the Excel file. Please try again.');
    }
  }
}
