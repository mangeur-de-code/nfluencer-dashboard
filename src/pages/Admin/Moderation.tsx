import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import StatCard from "../../components/admin/StatCard";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import { AlertHexaIcon } from "../../icons";

type Flag = {
    id: number;
    content_id: number;
    rule_id: number;
    rule_name: string;
    reason: string;
    severity: string;
    status: string;
    created_at: string;
    creator_id: number;
    creator_username: string;
};

type ModerationData = {
    metrics: {
        openReports: number;
        timeToResolveHours: number;
        flaggedContent: number;
        autoActions: number;
        pendingVerifications: number;
        activeSuspensions: number;
        openAppeals: number;
    };
    recentReports: Array<{
        id: number;
        subject: string;
        status: string;
        createdAt: string;
        severity?: string;
    }>;
};

const fallback: ModerationData = {
    metrics: {
        openReports: 0,
        timeToResolveHours: 0,
        flaggedContent: 0,
        autoActions: 0,
        pendingVerifications: 0,
        activeSuspensions: 0,
        openAppeals: 0,
    },
    recentReports: [],
};

export default function Moderation() {
    const { range } = useAdminDateRange();
    const [data, setData] = useState<ModerationData>(fallback);
    const [flags, setFlags] = useState<Flag[]>([]);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const loadData = async () => {
        setStatus("loading");
        try {
            const [metricsData, flagsData] = await Promise.all([
                fetchAdmin<ModerationData>("/api/admin/moderation", {
                    start: range.start,
                    end: range.end,
                    range: range.key,
                }),
                fetchAdmin<{ flags: Flag[] }>("/api/moderation/flags", { limit: 100 }),
            ]);

            setData(metricsData);
            setFlags(flagsData.flags || []);
            setStatus("ready");
        } catch (error) {
            console.error("Error loading moderation data:", error);
            setData(fallback);
            setFlags([]);
            setStatus("error");
        }
    };

    useEffect(() => {
        loadData();
    }, [range]);

    const handleAction = async (flagId: number, action: "approve" | "remove" | "dismiss") => {
        if (!confirm(`Are you sure you want to ${action} this flag?`)) {
            return;
        }

        setActionLoading(flagId);
        try {
            const response = await fetch("/api/moderation/flags", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ flagId, action }),
            });

            if (response.ok) {
                // Reload data after successful action
                await loadData();
            } else {
                const error = await response.json();
                alert(error.message || "Failed to process action");
            }
        } catch (error) {
            console.error("Error processing action:", error);
            alert("Failed to process action");
        } finally {
            setActionLoading(null);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            case "high":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
            case "medium":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "low":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
        }
    };

    const { metrics } = data;

    return (
        <>
            <PageMeta title="Admin Moderation" description="Content moderation and safety" />

            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Content Moderation
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automated flagging engine & manual review queue
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <StatCard
                    label="Open Flags"
                    value={metrics.openReports}
                    icon={<AlertHexaIcon className="text-gray-800 size-6 dark:text-white/90" />}
                />
                <StatCard
                    label="Avg Resolution Time (hrs)"
                    value={metrics.timeToResolveHours}
                    icon={<AlertHexaIcon className="text-gray-800 size-6 dark:text-white/90" />}
                />
                <StatCard
                    label="Total Flagged"
                    value={metrics.flaggedContent}
                    icon={<AlertHexaIcon className="text-gray-800 size-6 dark:text-white/90" />}
                />
                <StatCard
                    label="Active Rules"
                    value={metrics.autoActions}
                    icon={<AlertHexaIcon className="text-gray-800 size-6 dark:text-white/90" />}
                />
                <StatCard
                    label="Pending Verifications"
                    value={metrics.pendingVerifications}
                    icon={<AlertHexaIcon className="text-gray-800 size-6 dark:text-white/90" />}
                />
                <StatCard
                    label="Active Suspensions"
                    value={metrics.activeSuspensions}
                    icon={<AlertHexaIcon className="text-gray-800 size-6 dark:text-white/90" />}
                />
                <StatCard
                    label="Open Appeals"
                    value={metrics.openAppeals}
                    icon={<AlertHexaIcon className="text-gray-800 size-6 dark:text-white/90" />}
                />
            </div>

            {/* Pending Flags Queue */}
            <SectionCard
                title="Pending Flags"
                subtitle={
                    status === "error"
                        ? "Live data unavailable."
                        : `${flags.length} flags awaiting review`
                }
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Flag ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Content
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rule
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Severity
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Reason
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    View
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {flags.length > 0 ? (
                                flags.map((flag) => (
                                    <tr key={flag.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white/90">
                                            #{flag.id}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {flag.content_id}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {flag.rule_name || `Rule #${flag.rule_id}`}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(flag.severity)}`}>
                                                {flag.severity?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={flag.reason}>
                                            {flag.reason}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(flag.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <a
                                                href={`http://localhost:5173/${flag.creator_username}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition"
                                                title="View Creator Profile"
                                            >
                                                🔍
                                            </a>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAction(flag.id, "approve")}
                                                    disabled={actionLoading === flag.id}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50 transition"
                                                    title="Approve content"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() => handleAction(flag.id, "remove")}
                                                    disabled={actionLoading === flag.id}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded disabled:opacity-50 transition"
                                                    title="Remove content"
                                                >
                                                    ✕
                                                </button>
                                                <button
                                                    onClick={() => handleAction(flag.id, "dismiss")}
                                                    disabled={actionLoading === flag.id}
                                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded disabled:opacity-50 transition"
                                                    title="Dismiss flag"
                                                >
                                                    −
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                        {status === "loading" ? "Loading flags..." : "No pending flags"}
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
