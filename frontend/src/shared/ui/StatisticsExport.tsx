import { apiRequest } from "@/shared/api/client";
import { apiUrl } from "@/shared/api/config";
import { getAccessToken } from "@/shared/auth/session";
import { courseStatusLabel, memberRoleLabel } from "@/shared/lib/labels";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { BarChart3, Download, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type CourseStatRow = {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  courseId: string;
  courseTitle?: string | null;
  courseType?: string | null;
  courseStatus?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  progress: number;
  enrollmentStatus?: string | null;
  completedLessons: number;
  totalLessons: number;
  certificateIssued: boolean;
  enrolledAt?: string | null;
  updatedAt?: string | null;
};

const CSV_HEADERS = [
  "Сотрудник", "Email", "Роль", "Курс", "Тип курса", "Статус курса",
  "Организация", "Прогресс, %", "Статус прохождения",
  "Уроков пройдено", "Уроков всего", "Сертификат", "Записан", "Обновлено",
];

function csvCell(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("ru-RU");
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Course-completion statistics panel with CSV (client-side) and Excel (server-side) export.
 * The backend enforces role-based scope from the access token, so an admin sees the whole platform
 * while a partner company is limited to its own organization regardless of params.
 */
export function StatisticsExport({ title = "Статистика прохождения курсов" }: { title?: string }) {
  const [rows, setRows] = useState<CourseStatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<CourseStatRow[]>("/api/courses/statistics");
      setRows(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить статистику");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function downloadCsv() {
    if (!rows.length) {
      toastError("Нет данных для выгрузки");
      return;
    }
    const lines = [CSV_HEADERS.join(";")];
    for (const row of rows) {
      lines.push([
        row.userName, row.userEmail, memberRoleLabel(row.userRole ?? undefined),
        row.courseTitle, row.courseType, courseStatusLabel(row.courseStatus ?? undefined),
        row.organizationName, row.progress, row.enrollmentStatus,
        row.completedLessons, row.totalLessons, row.certificateIssued ? "Да" : "Нет",
        formatDate(row.enrolledAt), formatDate(row.updatedAt),
      ].map(csvCell).join(";"));
    }
    // BOM so Excel opens UTF-8 Cyrillic correctly.
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, `course-statistics-${new Date().toISOString().slice(0, 10)}.csv`);
    toastSuccess("CSV выгружен");
  }

  async function downloadXlsx() {
    setDownloadingXlsx(true);
    try {
      const token = getAccessToken();
      const response = await fetch(`${apiUrl}/api/courses/statistics/export.xlsx`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error(response.status === 403 ? "Недостаточно прав для выгрузки" : "Не удалось сформировать Excel");
      }
      const blob = await response.blob();
      triggerDownload(blob, `course-statistics-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toastSuccess("Excel выгружен");
    } catch (reason) {
      toastError("Ошибка выгрузки", reason instanceof Error ? reason.message : undefined);
    } finally {
      setDownloadingXlsx(false);
    }
  }

  const completed = rows.filter((r) => r.progress >= 100).length;
  const avgProgress = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.progress, 0) / rows.length) : 0;

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <BarChart3 size={15} className="text-primary" />{title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:border-primary hover:text-primary disabled:opacity-40"
            title="Обновить"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={loading || !rows.length}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={13} />CSV
          </button>
          <button
            type="button"
            onClick={downloadXlsx}
            disabled={downloadingXlsx || loading || !rows.length}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-gradient px-3 py-1.5 text-[12px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {downloadingXlsx ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}Excel
          </button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-primary">{error}</p>}

      {!error && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              ["Записей", rows.length],
              ["Завершили", completed],
              ["Средний прогресс", `${avgProgress}%`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-line bg-surface px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
                <p className="text-[18px] font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div className="max-h-[320px] overflow-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0 bg-surface text-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Сотрудник</th>
                  <th className="px-3 py-2 text-left font-semibold">Курс</th>
                  <th className="px-3 py-2 text-right font-semibold">Прогресс</th>
                  <th className="px-3 py-2 text-center font-semibold">Серт.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.userId}-${row.courseId}-${i}`} className="border-t border-line">
                    <td className="px-3 py-2">
                      <span className="block font-medium text-ink">{row.userName || "—"}</span>
                      <span className="block text-[11px] text-muted">{row.userEmail}</span>
                    </td>
                    <td className="px-3 py-2 text-ink">{row.courseTitle || "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold text-ink">{row.progress}%</td>
                    <td className="px-3 py-2 text-center">{row.certificateIssued ? "✓" : "—"}</td>
                  </tr>
                ))}
                {!rows.length && !loading && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted">Нет данных по прохождению</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
