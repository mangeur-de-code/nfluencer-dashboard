import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import { SearchIcon } from "../../components/icons/SearchIcon";

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

export default function Users() {
  const { range } = useAdminDateRange();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadUsers = async (mounted: { current: boolean }) => {
    setStatus("loading");
    try {
      const response = await fetchAdmin<{ users: UserRow[] }>(
        "/api/admin/users",
        { start: range.start, end: range.end, range: range.key }
      );
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

  const handleUserAction = async (
    userId: number,
    action: "ban" | "promote" | "delete"
  ) => {
    const labels: Record<typeof action, string> = {
      ban: "ban this user",
      promote: "promote this user to admin",
      delete: "permanently delete this user",
    };
    if (!confirm(`Are you sure you want to ${labels[action]}?`)) return;

    const endpoints: Record<typeof action, string> = {
      ban: "/api/admin/ban-user",
      promote: "/api/admin/promote-user",
      delete: "/api/admin/delete-user",
    };

    setActionLoading(userId);
    try {
      const res = await fetch(endpoints[action], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as any).error || `Failed to ${action} user`);
      } else {
        // Refresh the list
        const mounted = { current: true };
        await loadUsers(mounted);
      }
    } catch {
      alert(`Error: could not ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

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

  return (
    <>
      <PageMeta title="Admin Users" description="Monitor platform users" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Users
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {range.label} • {range.start} → {range.end}
          </p>
        </div>
        <div className="relative">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users"
            className="h-10 w-64 rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
        </div>
      </div>

      <SectionCard
        title="User Directory"
        subtitle={
          status === "error"
            ? "Live data unavailable."
            : `${filtered.length} users shown`
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Followers</th>
                <th className="px-4 py-3">Subscribers</th>
                <th className="px-4 py-3">Total Spend</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((row) => (
                <tr key={row.id} className="text-gray-700 dark:text-gray-200">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {row.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{row.role}</td>
                  <td className="px-4 py-3">{row.followers ?? 0}</td>
                  <td className="px-4 py-3">{row.subscribers ?? 0}</td>
                  <td className="px-4 py-3">
                    {row.totalSpend ? `$${row.totalSpend.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">{row.status ?? "active"}</td>
                  <td className="px-4 py-3">{row.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUserAction(row.id, "ban")}
                        disabled={actionLoading === row.id || row.status === "banned"}
                        className="rounded px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 disabled:opacity-40 transition"
                      >
                        Ban
                      </button>
                      <button
                        onClick={() => handleUserAction(row.id, "promote")}
                        disabled={actionLoading === row.id || row.status === "admin"}
                        className="rounded px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 disabled:opacity-40 transition"
                      >
                        Promote
                      </button>
                      <button
                        onClick={() => handleUserAction(row.id, "delete")}
                        disabled={actionLoading === row.id}
                        className="rounded px-2 py-1 text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 disabled:opacity-40 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {status === "loading"
                      ? "Loading users..."
                      : "No users found for this range."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}
