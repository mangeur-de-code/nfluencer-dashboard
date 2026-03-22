import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import TablePagination from "../../components/admin/TablePagination";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import { useSortedPaginatedData, SortIcon, exportToCsv } from "../../hooks/useTableUtils";
import { SearchIcon } from "../../components/icons/SearchIcon";

const PAGE_SIZE = 30;

type AuditEntry = {
  id: number;
  admin: string;
  action: string;
  target: string;
  createdAt: string;
  details?: string;
};

const COLUMNS: { key: keyof AuditEntry; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "action", label: "Action" },
  { key: "target", label: "Target" },
  { key: "details", label: "Details" },
  { key: "createdAt", label: "Timestamp" },
];

export default function AuditLog() {
  const { range } = useAdminDateRange();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await fetchAdmin<{ entries: AuditEntry[] }>("/api/admin/audit-log", {
          start: range.start, end: range.end, range: range.key,
        });
        if (isMounted) { setEntries(response.entries || []); setStatus("ready"); }
      } catch {
        if (isMounted) { setEntries([]); setStatus("error"); }
      }
    };
    load();
    return () => { isMounted = false; };
  }, [range]);

  const filtered = useMemo(() => {
    if (!query) return entries;
    const q = query.toLowerCase();
    return entries.filter(
      (e) =>
        e.admin.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        (e.details ?? "").toLowerCase().includes(q)
    );
  }, [entries, query]);

  const { sorted: paged, totalPages, page, setPage, sort, toggleSort, resetPage, totalCount } =
    useSortedPaginatedData(filtered as unknown as Record<string, unknown>[], PAGE_SIZE);

  useEffect(() => { resetPage(); }, [query]);

  const pageRows = paged as unknown as AuditEntry[];

  function handleExport() {
    exportToCsv(`audit-log-${range.key}`, filtered.map(({ id, admin, action, target, details, createdAt }) => ({
      id, admin, action, target, details: details ?? "", createdAt,
    })));
  }

  return (
    <>
      <PageMeta title="Admin Audit Log" description="Audit history" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Audit Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {range.label} ΓÇó {range.start} ΓåÆ {range.end}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter logΓÇª"
              className="h-10 w-52 rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>
      </div>

      <SectionCard
        title="Admin Actions"
        subtitle={status === "error" ? "Live data unavailable." : `${totalCount} actions logged`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="cursor-pointer select-none px-4 py-3 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    <SortIcon active={sort.key === col.key} dir={sort.key === col.key ? sort.dir : null} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pageRows.map((entry) => (
                <tr key={entry.id} className="text-gray-700 dark:text-gray-200">
                  <td className="px-4 py-3 font-medium">{entry.admin}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-800">
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">{entry.target}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-500 dark:text-gray-400">
                    {entry.details ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                    {entry.createdAt}
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {status === "loading" ? "Loading audit logΓÇª" : "No audit events for this range."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </SectionCard>
    </>
  );
}
