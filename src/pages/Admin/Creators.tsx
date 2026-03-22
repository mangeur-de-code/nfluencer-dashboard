import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import TablePagination from "../../components/admin/TablePagination";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import { SearchIcon } from "../../components/icons/SearchIcon";
import { useSortedPaginatedData, SortIcon, exportToCsv } from "../../hooks/useTableUtils";

const PAGE_SIZE = 25;

type CreatorRow = {
  id: number;
  name: string;
  email: string;
  kycStatus?: string;
  verified: boolean;
  stripeConnectId?: string | null;
  followers?: number;
  subscribers?: number;
  posts?: number;
  tips?: number;
  revenue?: number;
  lastActivity?: string;
};

const KYC_BADGE: Record<string, string> = {
  verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  suspended: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  none: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const COLUMNS: { key: keyof CreatorRow; label: string }[] = [
  { key: "name", label: "Creator" },
  { key: "kycStatus", label: "KYC Status" },
  { key: "followers", label: "Followers" },
  { key: "subscribers", label: "Subscribers" },
  { key: "posts", label: "Posts" },
  { key: "tips", label: "Tips" },
  { key: "revenue", label: "Revenue" },
  { key: "lastActivity", label: "Last Activity" },
];

export default function Creators() {
  const { range } = useAdminDateRange();
  const [rows, setRows] = useState<CreatorRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadCreators = async (mounted: { current: boolean }) => {
    setStatus("loading");
    try {
      const response = await fetchAdmin<{ creators: CreatorRow[] }>("/api/admin/creators", {
        start: range.start, end: range.end, range: range.key,
      });
      if (mounted.current) {
        setRows(response.creators || []);
        setStatus("ready");
      }
    } catch {
      if (mounted.current) { setRows([]); setStatus("error"); }
    }
  };

  useEffect(() => {
    const mounted = { current: true };
    loadCreators(mounted);
    return () => { mounted.current = false; };
  }, [range]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q));
  }, [rows, query]);

  const { sorted: paged, totalPages, page, setPage, sort, toggleSort, resetPage, totalCount } =
    useSortedPaginatedData(filtered as unknown as Record<string, unknown>[], PAGE_SIZE);

  useEffect(() => { resetPage(); }, [query]);

  const pageRows = paged as unknown as CreatorRow[];

  const handleKycOverride = async (creatorId: number, kycStatus: string) => {
    const isDestructive = kycStatus !== "verified";
    const message = isDestructive
      ? `⚠️ Setting KYC to "${kycStatus}" will DISABLE creator mode and monetization for this creator.\n\nThey will lose access to the Monetization tab, subscription settings, and payouts until re-verified.\n\nAre you sure?`
      : `Set KYC status to "verified" for this creator? This will enable creator mode and monetization.`;
    if (!globalThis.confirm(message)) return;
    setActionLoading(creatorId);
    try {
      const res = await fetch("/api/admin/creators", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "override_kyc", userId: creatorId, kycStatus }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        const mounted = { current: true };
        await loadCreators(mounted);
      } else {
        alert(data.error || "Failed to override KYC status");
      }
    } catch {
      alert("Error: could not update KYC status");
    } finally {
      setActionLoading(null);
    }
  };

  function handleExport() {
    exportToCsv(
      `creators-${range.key}`,
      filtered.map(({ id, name, email, kycStatus, verified, followers, subscribers, posts, tips, revenue, lastActivity }) => ({
        id, name, email,
        kycStatus: kycStatus ?? (verified ? "verified" : "none"),
        followers: followers ?? 0, subscribers: subscribers ?? 0,
        posts: posts ?? 0, tips: tips ?? 0, revenue: revenue ?? 0,
        lastActivity: lastActivity ?? "",
      }))
    );
  }

  return (
    <>
      <PageMeta title="Admin Creators" description="Monitor creator performance" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Creators</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {range.label} • {range.start} → {range.end}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creators"
              className="h-10 w-56 rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
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
        title="Creator Directory"
        subtitle={status === "error" ? "Live data unavailable." : `${totalCount} creators shown`}
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
                <th className="px-4 py-3">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pageRows.map((row) => {
                const kyc = row.kycStatus ?? (row.verified ? "verified" : "none");
                return (
                  <tr key={row.id} className="text-gray-700 dark:text-gray-200">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${KYC_BADGE[kyc] ?? KYC_BADGE.none}`}>
                        {kyc}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.followers ?? 0}</td>
                    <td className="px-4 py-3">{row.subscribers ?? 0}</td>
                    <td className="px-4 py-3">{row.posts ?? 0}</td>
                    <td className="px-4 py-3">{row.tips ? `$${row.tips.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3">{row.revenue ? `$${row.revenue.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3">{row.lastActivity ?? "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        disabled={actionLoading === row.id}
                        defaultValue=""
                        onChange={(e) => {
                          const val = e.target.value;
                          e.target.value = "";
                          if (val) handleKycOverride(row.id, val);
                        }}
                        className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 disabled:opacity-40"
                      >
                        <option value="" disabled>Override KYC…</option>
                        <option value="verified">✓ Set Verified</option>
                        <option value="none">○ Set None</option>
                        <option value="suspended">⊘ Suspend</option>
                        <option value="failed">✕ Set Failed</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {status === "loading" ? "Loading creators…" : "No creators found for this range."}
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
