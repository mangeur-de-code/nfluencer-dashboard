import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import { SearchIcon } from "../../components/icons/SearchIcon";


type CreatorRow = {
  id: number;
  name: string;
  email: string;
  verified: boolean;
  followers?: number;
  subscribers?: number;
  posts?: number;
  tips?: number;
  revenue?: number;
  lastActivity?: string;
};

export default function Creators() {
  const { range } = useAdminDateRange();
  const [rows, setRows] = useState<CreatorRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await fetchAdmin<{ creators: CreatorRow[] }>(
          "/api/admin/creators",
          {
            start: range.start,
            end: range.end,
            range: range.key,
          }
        );
        if (isMounted) {
          setRows(response.creators || []);
          setStatus("ready");
        }
      } catch (error) {
        if (isMounted) {
          setRows([]);
          setStatus("error");
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <>
      <PageMeta
        title="Admin Creators"
        description="Monitor creator performance"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Creators
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {range.label} • {range.start} → {range.end}
          </p>
        </div>
        <div className="relative">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search creators"
            className="h-10 w-64 rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
        </div>
      </div>

      <SectionCard
        title="Creator Directory"
        subtitle={
          status === "error"
            ? "Live data unavailable."
            : `${filtered.length} creators shown`
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Creator</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Followers</th>
                <th className="px-4 py-3">Subscribers</th>
                <th className="px-4 py-3">Posts</th>
                <th className="px-4 py-3">Tips</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Last Activity</th>
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
                  <td className="px-4 py-3">
                    {row.verified ? "Verified" : "Pending"}
                  </td>
                  <td className="px-4 py-3">{row.followers ?? 0}</td>
                  <td className="px-4 py-3">{row.subscribers ?? 0}</td>
                  <td className="px-4 py-3">{row.posts ?? 0}</td>
                  <td className="px-4 py-3">
                    {row.tips ? `$${row.tips.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.revenue ? `$${row.revenue.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">{row.lastActivity ?? "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {status === "loading"
                      ? "Loading creators..."
                      : "No creators found for this range."}
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
