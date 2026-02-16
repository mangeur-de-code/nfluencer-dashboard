import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";

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
};

export default function Reports() {
    const { range } = useAdminDateRange();
    const [reports, setReports] = useState<Report[]>([]);
    const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const loadReports = async () => {
        setStatus("loading");
        try {
            const response = await fetchAdmin<{ reports: Report[] }>(
                "/api/admin/reports",
                {
                    start: range.start,
                    end: range.end,
                    range: range.key,
                }
            );
            setReports(response.reports || []);
            setStatus("ready");
        } catch (error) {
            console.error("Error loading reports:", error);
            setReports([]);
            setStatus("error");
        }
    };

    useEffect(() => {
        loadReports();
    }, [range]);

    const handleResolve = async (reportId: number, reportedName: string) => {
        const reason = prompt(`Resolve report about ${reportedName}?\n\nResolution details (optional):`);
        if (reason === null) return; // User cancelled

        setActionLoading(reportId);
        try {
            const response = await fetch("/api/admin/resolve-report", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportId,
                    resolution: reason || "Resolved by admin",
                }),
            });

            if (response.ok) {
                await loadReports();
            } else {
                const error = await response.json();
                alert(error.message || "Failed to resolve report");
            }
        } catch (error) {
            console.error("Error resolving report:", error);
            alert("Failed to resolve report");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDismiss = async (reportId: number, reportedName: string) => {
        const reason = prompt(`Dismiss report about ${reportedName}?\n\nReason for dismissal:`);
        if (!reason) return;

        setActionLoading(reportId);
        try {
            const response = await fetch("/api/admin/dismiss-report", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportId,
                    reason,
                }),
            });

            if (response.ok) {
                await loadReports();
            } else {
                const error = await response.json();
                alert(error.message || "Failed to dismiss report");
            }
        } catch (error) {
            console.error("Error dismissing report:", error);
            alert("Failed to dismiss report");
        } finally {
            setActionLoading(null);
        }
    };

    const filteredReports = reports.filter((r) =>
        filter === "all" ? true : r.status === filter
    );

    return (
        <>
            <PageMeta title="Admin Reports" description="User complaints and reports" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                        User Reports
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage user complaints and reported content
                    </p>
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                >
                    <option value="all">All Reports</option>
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>

            <SectionCard
                title={`Reports (${filteredReports.length})`}
                subtitle={
                    status === "error"
                        ? "Error loading reports"
                        : status === "loading"
                            ? "Loading..."
                            : undefined
                }
            >
                {filteredReports.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                        {status === "loading" ? "Loading reports..." : "No reports to display"}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredReports.map((report) => (
                            <div
                                key={report.id}
                                className="border border-gray-200 dark:border-gray-800 rounded-lg p-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {report.reported_name}
                                            </span>
                                            <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded">
                                                {report.reason}
                                            </span>
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${report.status === "open"
                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                    }`}
                                            >
                                                {report.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                            {report.description}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            <span>Reported by: {report.reporter_name}</span>
                                            <span>•</span>
                                            <span>{new Date(report.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {report.status === "open" && (
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => handleResolve(report.id, report.reported_name)}
                                                disabled={actionLoading === report.id}
                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded disabled:opacity-50 transition"
                                            >
                                                ✓ Resolve
                                            </button>
                                            <button
                                                onClick={() => handleDismiss(report.id, report.reported_name)}
                                                disabled={actionLoading === report.id}
                                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded disabled:opacity-50 transition"
                                            >
                                                ✕ Dismiss
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>
        </>
    );
}
