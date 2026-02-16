import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";


type AuditEntry = {
  id: number;
  admin: string;
  action: string;
  target: string;
  createdAt: string;
  details?: string;
};

export default function AuditLog() {
  const { range } = useAdminDateRange();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await fetchAdmin<{ entries: AuditEntry[] }>(
          "/api/admin/audit-log",
          {
            start: range.start,
            end: range.end,
            range: range.key,
          }
        );
        if (isMounted) {
          setEntries(response.entries || []);
          setStatus("ready");
        }
      } catch (error) {
        if (isMounted) {
          setEntries([]);
          setStatus("error");
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [range]);

  return (
    <>
      <PageMeta title="Admin Audit Log" description="Audit history" />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Audit Log
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {range.label} • {range.start} → {range.end}
        </p>
      </div>

      <SectionCard
        title="Recent Admin Actions"
        subtitle={
          status === "error"
            ? "Live data unavailable."
            : `${entries.length} actions logged`
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="text-gray-700 dark:text-gray-200">
                  <td className="px-4 py-3 font-medium">{entry.admin}</td>
                  <td className="px-4 py-3">{entry.action}</td>
                  <td className="px-4 py-3">{entry.target}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {entry.details ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {entry.createdAt}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {status === "loading"
                      ? "Loading audit log..."
                      : "No audit events for this range."}
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
