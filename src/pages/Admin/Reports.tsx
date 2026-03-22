import { useEffect, useMemo, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import TablePagination from "../../components/admin/TablePagination";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import { exportToCsv } from "../../hooks/useTableUtils";
import {
  useSavedFilters,
  getSlaStatus,
  formatAge,
  SLA_COLORS,
  saveLocalFilter,
  readLocalFilter,
} from "../../hooks/useAdminPreferences";

const PAGE_SIZE = 20;

type Report = {
  id: number;
  reporter_id: number;
  reported_user_id: number;
  reporter_name: string;
  reported_name: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  severity?: string;
};

type ActionModal = {
  reportId: number;
  reportedName: string;
  action: "resolve" | "dismiss";
};

type SaveFilterModal = { filterJson: string } | null;

function ActionModal({
  modal,
  onClose,
  onSubmit,
  loading,
}: {
  modal: ActionModal;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isResolve = modal.action === "resolve";

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          {isResolve ? "Resolve Report" : "Dismiss Report"}
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Report about <span className="font-medium text-gray-700 dark:text-gray-300">{modal.reportedName}</span>
        </p>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          {isResolve ? "Resolution details (optional)" : "Reason for dismissal"}
        </label>
        <textarea
          ref={inputRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={isResolve ? "e.g. Content removed, warning issued" : "e.g. Report does not violate policy"}
          className="mb-4 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason || (isResolve ? "Resolved by admin" : "Dismissed by admin"))}
            disabled={loading || (!isResolve && !reason.trim())}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${isResolve ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {loading ? "SavingΓÇª" : isResolve ? "Γ£ô Resolve" : "Γ£ò Dismiss"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const { range } = useAdminDateRange();
  const { slaConfig, filters, saveFilter, deleteFilter } = useSavedFilters("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">(() =>
    readLocalFilter("reports", "status", "all") as "all" | "open" | "resolved"
  );
  const [severityFilter, setSeverityFilter] = useState<string>(() =>
    readLocalFilter("reports", "severity", "all")
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState<ActionModal | null>(null);
  const [page, setPage] = useState(1);
  const [saveFilterModal, setSaveFilterModal] = useState<SaveFilterModal>(null);
  const [filterName, setFilterName] = useState("");

  const loadReports = async () => {
    setStatus("loading");
    try {
      const response = await fetchAdmin<{ reports: Report[] }>("/api/admin/reports", {
        start: range.start, end: range.end, range: range.key,
      });
      setReports(response.reports || []);
      setStatus("ready");
    } catch {
      setReports([]);
      setStatus("error");
    }
  };

  useEffect(() => { loadReports(); }, [range]);
  useEffect(() => { setPage(1); }, [filter, severityFilter, query]);

  // Persist filter changes locally
  useEffect(() => { saveLocalFilter("reports", "status", filter); }, [filter]);
  useEffect(() => { saveLocalFilter("reports", "severity", severityFilter); }, [severityFilter]);

  const filteredReports = useMemo(() => {
    let result = reports;
    if (filter !== "all") result = result.filter((r) => r.status === filter);
    if (severityFilter !== "all") result = result.filter((r) => (r.severity ?? "low") === severityFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (r) =>
          r.reported_name.toLowerCase().includes(q) ||
          r.reporter_name.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [reports, filter, severityFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const paged = filteredReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function submitAction(reason: string) {
    if (!modal) return;
    const endpoint = modal.action === "resolve" ? "/api/admin/resolve-report" : "/api/admin/dismiss-report";
    const body = modal.action === "resolve"
      ? { reportId: modal.reportId, resolution: reason }
      : { reportId: modal.reportId, reason };

    setActionLoading(true);
    try {
      await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await loadReports();
    } finally {
      setActionLoading(false);
      setModal(null);
    }
  }

  function handleExport() {
    exportToCsv(`reports-${range.key}`, filteredReports.map(
      ({ id, reporter_name, reported_name, reason, description, status: s, created_at, severity }) => ({
        id, reporter_name, reported_name, reason, description, status: s, severity: severity ?? "low", created_at,
      })
    ));
  }

  function openSaveFilter() {
    setSaveFilterModal({
      filterJson: JSON.stringify({ status: filter, severity: severityFilter }),
    });
    setFilterName("");
  }

  async function handleSaveFilter() {
    if (!saveFilterModal || !filterName.trim()) return;
    await saveFilter(filterName.trim(), saveFilterModal.filterJson);
    setSaveFilterModal(null);
    setFilterName("");
  }

  function applyFilter(f: typeof filters[0]) {
    try {
      const parsed = JSON.parse(f.filterJson) as { status?: string; severity?: string };
      if (parsed.status) setFilter(parsed.status as "all" | "open" | "resolved");
      if (parsed.severity) setSeverityFilter(parsed.severity);
    } catch {}
  }

  // Count SLA breaches
  const slaBreaches = filteredReports.filter(
    (r) => r.status === "open" && getSlaStatus(r.created_at, r.severity ?? "low", slaConfig) === "breach"
  ).length;

  return (
    <>
      <PageMeta title="Admin Reports" description="User complaints and reports" />

      {modal && (
        <ActionModal
          modal={modal}
          onClose={() => setModal(null)}
          onSubmit={submitAction}
          loading={actionLoading}
        />
      )}

      {saveFilterModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setSaveFilterModal(null); }}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">Save Current Filter</h2>
            <input
              autoFocus
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveFilter(); if (e.key === "Escape") setSaveFilterModal(null); }}
              placeholder="Filter nameΓÇª"
              className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setSaveFilterModal(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">Cancel</button>
              <button onClick={handleSaveFilter} disabled={!filterName.trim()} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 hover:bg-brand-700">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">User Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage user complaints and reported content</p>
          {slaBreaches > 0 && (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
              ⚠️ {slaBreaches} report{slaBreaches !== 1 ? "s" : ""} past SLA deadline
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Full-text search */}
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reason, description…"
              className="h-9 w-52 rounded-lg border border-gray-200 bg-white pl-3 pr-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | "open" | "resolved")} className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {/* Saved filters */}
          {filters.length > 0 && (
            <div className="flex items-center gap-1">
              {filters.map((f) => (
                <div key={f.id} className="flex items-center rounded-full border border-gray-200 bg-gray-50 pl-2 pr-1 dark:border-gray-700 dark:bg-gray-800">
                  <button onClick={() => applyFilter(f)} className="text-xs text-gray-600 dark:text-gray-300 hover:underline">{f.name}</button>
                  <button onClick={() => deleteFilter(f.id)} className="ml-1 text-gray-400 hover:text-red-500 text-xs">×</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={openSaveFilter} title="Save current filter" className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            + Save filter
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* SLA legend */}
      {slaConfig.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {slaConfig.map((cfg) => (
            <span key={cfg.severity} className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium capitalize">{cfg.severity}</span>: SLA {cfg.target_hours}h
            </span>
          ))}
          <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">⚠️ warning</span>
          <span className="text-xs text-red-600 dark:text-red-400">🚨 breach</span>
        </div>
      )}

      <SectionCard
        title={`Reports (${filteredReports.length})`}
        subtitle={status === "error" ? "Error loading reports" : status === "loading" ? "Loading…" : undefined}
      >
        {paged.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            {status === "loading" ? "Loading reports…" : "No reports to display"}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {paged.map((report) => {
              const slaStatus = report.status === "open"
                ? getSlaStatus(report.created_at, report.severity ?? "low", slaConfig)
                : "ok";
              const age = formatAge(report.created_at);
              return (
                <div key={report.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{report.reported_name}</span>
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">{report.reason}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${report.status === "open" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"}`}>
                          {report.status}
                        </span>
                        {/* SLA age badge */}
                        {report.status === "open" && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SLA_COLORS[slaStatus]}`} title={`Opened ${age} ago`}>
                            {slaStatus === "breach" ? "🚨" : slaStatus === "warning" ? "⚠️" : "✔"} {age}
                          </span>
                        )}
                      </div>
                      {report.description && (
                        <p className="mb-1.5 text-sm text-gray-700 dark:text-gray-300">{report.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>Reported by: {report.reporter_name}</span>
                        <span>•</span>
                        <span>{new Date(report.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    {report.status === "open" && (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => setModal({ reportId: report.id, reportedName: report.reported_name, action: "resolve" })}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition"
                        >Γ£ô Resolve</button>
                        <button
                          onClick={() => setModal({ reportId: report.id, reportedName: report.reported_name, action: "dismiss" })}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition"
                        >Γ£ò Dismiss</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <TablePagination page={page} totalPages={totalPages} totalCount={filteredReports.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </SectionCard>
    </>
  );
}
