import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import ConfirmModal from "../../components/admin/ConfirmModal";
import TablePagination from "../../components/admin/TablePagination";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import { useRbac } from "../../context/RbacContext";
import { SearchIcon } from "../../components/icons/SearchIcon";
import { useSortedPaginatedData, SortIcon, exportToCsv } from "../../hooks/useTableUtils";
import { saveLocalFilter, readLocalFilter } from "../../hooks/useAdminPreferences";

const PAGE_SIZE = 25;

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastActive?: string;
  followers?: number;
  subscribers?: number;
  totalSpend?: number;
  status?: string;
};

type ActionKind = "ban" | "promote" | "delete";

const COLUMNS: { key: keyof UserRow; label: string }[] = [
  { key: "name", label: "User" },
  { key: "role", label: "Role" },
  { key: "followers", label: "Followers" },
  { key: "subscribers", label: "Subscribers" },
  { key: "totalSpend", label: "Total Spend" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created" },
];

export default function Users() {
  const { range } = useAdminDateRange();
  const { canModerate } = useRbac();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [query, setQuery] = useState(() => readLocalFilter("users", "query", ""));
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirm, setConfirm] = useState<{ action: ActionKind; ids: number[] } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Persist search filter locally
  useEffect(() => { saveLocalFilter("users", "query", query); }, [query]);

  const loadUsers = async (mounted: { current: boolean }) => {
    setStatus("loading");
    setSelected(new Set());
    try {
      const response = await fetchAdmin<{ users: UserRow[] }>("/api/admin/users", {
        start: range.start,
        end: range.end,
        range: range.key,
      });
      if (mounted.current) {
        setRows(response.users || []);
        setStatus("ready");
      }
    } catch {
      if (mounted.current) {
        setRows([]);
        setStatus("error");
      }
    }
  };

  useEffect(() => {
    const mounted = { current: true };
    loadUsers(mounted);
    return () => { mounted.current = false; };
  }, [range]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.role.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const { sorted: paged, totalPages, page, setPage, sort, toggleSort, resetPage, totalCount } =
    useSortedPaginatedData(filtered as unknown as Record<string, unknown>[], PAGE_SIZE);

  useEffect(() => { resetPage(); }, [query]);

  const pageRows = paged as unknown as UserRow[];
  const allPageIds = pageRows.map((r) => r.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selected.has(id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...allPageIds]));
    }
  }

  function toggleRow(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function requestAction(action: ActionKind, ids?: number[]) {
    const targetIds = ids ?? [...selected];
    if (targetIds.length === 0) return;
    setConfirm({ action, ids: targetIds });
  }

  async function executeAction(action: ActionKind, ids: number[]) {
    const endpoints: Record<ActionKind, string> = {
      ban: "/api/admin/ban-user",
      promote: "/api/admin/promote-user",
      delete: "/api/admin/delete-user",
    };
    setActionLoading(true);
    try {
      await Promise.all(
        ids.map((userId) =>
          fetch(endpoints[action], {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          })
        )
      );
    } finally {
      setActionLoading(false);
      setConfirm(null);
      const mounted = { current: true };
      await loadUsers(mounted);
    }
  }

  function handleExport() {
    exportToCsv(
      `users-${range.key}`,
      filtered.map(({ id, name, email, role, status, followers, subscribers, totalSpend, createdAt }) => ({
        id, name, email, role, status: status ?? "active",
        followers: followers ?? 0, subscribers: subscribers ?? 0,
        totalSpend: totalSpend ?? 0, createdAt,
      }))
    );
  }

  const actionLabels: Record<ActionKind, string> = {
    ban: "ban",
    promote: "promote to admin",
    delete: "permanently delete",
  };
  const actionVariants: Record<ActionKind, "danger" | "warning" | "info"> = {
    ban: "warning",
    promote: "info",
    delete: "danger",
  };

  return (
    <>
      <PageMeta title="Admin Users" description="Monitor platform users" />

      {confirm && (
        <ConfirmModal
          isOpen
          title={`${confirm.action.charAt(0).toUpperCase() + confirm.action.slice(1)} ${confirm.ids.length > 1 ? `${confirm.ids.length} users` : "user"}`}
          message={`Are you sure you want to ${actionLabels[confirm.action]} ${confirm.ids.length > 1 ? `these ${confirm.ids.length} users` : "this user"}? This cannot be undone.`}
          confirmLabel={confirm.action === "ban" ? "Ban" : confirm.action === "promote" ? "Promote" : "Delete"}
          variant={actionVariants[confirm.action]}
          onConfirm={() => executeAction(confirm.action, confirm.ids)}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {range.label} ΓÇó {range.start} ΓåÆ {range.end}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users"
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

      {selected.size > 0 && canModerate && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-900/40 dark:bg-blue-900/20">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selected.size} user{selected.size !== 1 ? "s" : ""} selected
          </span>
          <button onClick={() => requestAction("ban")} disabled={actionLoading} className="rounded px-2.5 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 disabled:opacity-40">Ban</button>
          <button onClick={() => requestAction("delete")} disabled={actionLoading} className="rounded px-2.5 py-1 text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 disabled:opacity-40">Delete</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-blue-500 hover:underline dark:text-blue-400">Clear</button>
        </div>
      )}

      <SectionCard
        title="User Directory"
        subtitle={status === "error" ? "Live data unavailable." : `${totalCount} users shown`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-700"
                  />
                </th>
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
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pageRows.map((row) => (
                <tr key={row.id} className={`text-gray-700 dark:text-gray-200 ${selected.has(row.id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      className="rounded border-gray-300 dark:border-gray-700"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{row.role}</td>
                  <td className="px-4 py-3">{row.followers ?? 0}</td>
                  <td className="px-4 py-3">{row.subscribers ?? 0}</td>
                  <td className="px-4 py-3">{row.totalSpend ? `$${row.totalSpend.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 capitalize">{row.status ?? "active"}</td>
                  <td className="px-4 py-3">{row.createdAt}</td>
                  <td className="px-4 py-3">
                    {canModerate ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => requestAction("ban", [row.id])} disabled={actionLoading || row.status === "banned"} className="rounded px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 disabled:opacity-40 transition">Ban</button>
                        <button onClick={() => requestAction("promote", [row.id])} disabled={actionLoading || row.role === "admin"} className="rounded px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 disabled:opacity-40 transition">Promote</button>
                        <button onClick={() => requestAction("delete", [row.id])} disabled={actionLoading} className="rounded px-2 py-1 text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 disabled:opacity-40 transition">Delete</button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">View only</span>
                    )}
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {status === "loading" ? "Loading usersΓÇª" : "No users found for this range."}
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
