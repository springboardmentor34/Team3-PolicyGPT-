import { Component, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';

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
 * Previously every number on this page (KPIs, both charts, the
 * scheme-wise table) was hardcoded mock data, and "Export Report" just
 * showed a toast without producing a file.
 *
 * This rewires the page to real backend data, reusing endpoints that
 * already exist rather than adding new ones:
 *   - AnalyticsService.getOverview()   -> /analytics/overview
 *       (auto-scoped server-side: an Official sees only their own
 *       policies/schemes; Admin sees the system-wide picture)
 *   - ApplicationService.getAllApplications() -> /applications/all
 *       (same auto-scoping, by scheme ownership)
 *
 * Two KPIs from the original mock had no honest backing anywhere in the
 * schema and were dropped rather than faked:
 *   - "Registered Citizens" (admin-only data an Official can't see, and
 *     not really a "report" metric for an Official's own submissions)
 *   - Per-scheme "Avg Processing Time" / "Trend" (no review-duration or
 *     historical-snapshot tracking exists anywhere in the DB)
 * They're replaced with KPIs and table columns that are fully derivable
 * from real rows: Total Policies, Total Schemes, Pending Approvals (ties
 * into the Policy Approval Workflow), Approved Policies, and a
 * scheme-wise table of real application counts + approval rate.
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
export class ReportsComponent implements AfterViewInit {
  private toast = inject(ToastService);
  private analyticsService = inject(AnalyticsService);
  private applicationService = inject(ApplicationService);

  @ViewChild('applicationChart') applicationChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChart!: ElementRef<HTMLCanvasElement>;

  private lineChartInstance?: Chart;
  private pieChartInstance?: Chart;

  loading = true;
  errorMessage = '';

  /** 'mine' for an Official (their own submissions only) or 'all' for Admin — set from the backend response, never assumed client-side. */
  scope: 'mine' | 'all' = 'mine';

  // ================= FILTER (display-only; backend doesn't support a
  // date-range filter on /analytics/overview yet, so this doesn't
  // re-query — kept so the UI isn't torn out, no functional claim made) =================
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

  ngAfterViewInit(): void {
    this.loadReportData();
  }

  loadReportData(): void {
    this.loading = true;
    this.errorMessage = '';

    // Both calls are independent (different endpoints, different
    // failure modes worth telling apart), so they're kept as two
    // subscriptions rather than combined into one forkJoin — a citizen
    // hitting a stray "You do not have permission" only reads as clearly
    // wrong if it names which part failed.
    this.analyticsService.getOverview().subscribe({
      next: (overview) => {
        this.applyOverview(overview);
        this.loading = false;
        // Charts need a rendered <canvas>, which only exists once
        // *ngIf="!loading" has resolved — deferred one tick so the DOM
        // is actually there before Chart.js reads it.
        setTimeout(() => this.renderCharts(), 0);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.describeError(err, 'load report analytics');
      },
    });

    this.applicationService.getAllApplications().subscribe({
      next: (res) => this.applySchemeReport(res?.data || []),
      error: () => {
        // Non-fatal: KPIs/charts from /analytics/overview above still
        // render even if this second call fails, so the whole page
        // doesn't go blank over one table.
        this.schemeReports = [];
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

  private describeError(err: any, action: string): string {
    if (err.status === 403) return 'You do not have permission to view reports.';
    if (err.status === 401) return 'Your session has expired. Please log in again.';
    if (err.status === 0) return 'Network error — please check your connection and try again.';
    return `Could not ${action}. Please try again.`;
  }

  // ================= CHARTS =================

  private renderCharts(): void {
    this.loadLineChart();
    this.loadPieChart();
  }

  private loadLineChart(): void {
    if (!this.applicationChart) return;
    this.lineChartInstance?.destroy();

    this.lineChartInstance = new Chart(this.applicationChart.nativeElement, {
      type: 'line',
      data: {
        labels: this.trendMonths.length ? this.trendMonths : ['No data yet'],
        datasets: [
          {
            label: 'Submitted',
            data: this.trendSubmitted.length ? this.trendSubmitted : [0],
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37,99,235,0.2)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Approved',
            data: this.trendApproved.length ? this.trendApproved : [0],
            borderColor: '#16A34A',
            backgroundColor: 'rgba(22,163,74,0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  private loadPieChart(): void {
    if (!this.categoryChart) return;
    this.pieChartInstance?.destroy();

    const labels = this.categoryReport.length ? this.categoryReport.map((c) => c.category) : ['No data yet'];
    const data = this.categoryReport.length ? this.categoryReport.map((c) => c.percentage) : [1];
    const colors = this.categoryReport.length ? this.categoryReport.map((c) => c.color) : ['#E5E7EB'];

    this.pieChartInstance = new Chart(this.categoryChart.nativeElement, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors }] },
      options: { responsive: true, maintainAspectRatio: false },
    });
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
