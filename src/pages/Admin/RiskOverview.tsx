import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import StatCard from "../../components/admin/StatCard";
import SectionCard from "../../components/admin/SectionCard";
import { useRisk } from "../../context/RiskContext";
import {
  AlertHexaIcon,
  DollarLineIcon,
  GroupIcon,
  FileIcon,
} from "../../icons";
import RiskScoreBadge from "../../components/risk/RiskScoreBadge";

/**
 * Risk Overview Dashboard - Real-time fraud & risk control center
 * Displays critical KPIs for platform security and payout safety
 */
export default function RiskOverview() {
  const {
    overviewMetrics,
    fetchOverviewMetrics,
    fetchRecentRiskEvents,
    recentRiskEvents,
    error,
  } = useRisk();

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        await Promise.all([
          fetchOverviewMetrics(),
          fetchRecentRiskEvents(10),
        ]);
        if (isMounted) {
          setStatus("ready");
        }
      } catch (err) {
        if (isMounted) {
          setStatus("error");
          console.error("Failed to load risk overview:", err);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [fetchOverviewMetrics, fetchRecentRiskEvents]);

  const metrics = overviewMetrics;

  return (
    <>
      <PageMeta
        title="Risk Overview"
        description="Real-time fraud detection and risk control center for platform security"
      />

      <div className="space-y-6 pb-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
              Risk Overview
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Real-time fraud detection and platform security monitoring
            </p>
          </div>
        </div>

        {/* Error State */}
        {status === "error" && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400">
              Error loading risk metrics: {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {status === "loading" && (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
              />
            ))}
          </div>
        )}

        {/* KPI Cards Grid */}
        {status === "ready" && metrics && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Dispute Rate */}
              <StatCard
                label="Dispute Rate"
                value={`${metrics.disputeRate.toFixed(2)}%`}
                icon={<AlertHexaIcon className="text-orange-500" />}
                trend={metrics.disputeRate > 3 ? "up" : "down"}
                delta={
                  metrics.disputeRate > 3
                    ? "+Platform at risk"
                    : "Within normal range"
                }
                helper="Target: <2% monthly"
              />

              {/* Refund Rate */}
              <StatCard
                label="Refund Rate"
                value={`${metrics.refundRate.toFixed(2)}%`}
                icon={<DollarLineIcon className="text-red-500" />}
                trend={metrics.refundRate > 5 ? "up" : "down"}
                delta={
                  metrics.refundRate > 5
                    ? "+Elevated refunds"
                    : "Normal range"
                }
                helper="Buyer protection metric"
              />

              {/* Flagged Transactions */}
              <StatCard
                label="Flagged Transactions"
                value={metrics.flaggedTransactions}
                icon={<FileIcon className="text-amber-500" />}
                delta={`Last 24h`}
                helper="Awaiting review"
              />

              {/* New Creators (24h) */}
              <StatCard
                label="New Creators"
                value={metrics.newCreators24h}
                icon={<GroupIcon className="text-blue-500" />}
                delta={`Last 24h`}
                helper="Onboarding monitoring"
              />

              {/* Pending vs Available Payouts */}
              <StatCard
                label="Balance Status"
                value={`$${(metrics.availableBalance / 1000).toFixed(1)}k`}
                icon={<DollarLineIcon className="text-green-500" />}
                delta={`$${(metrics.pendingBalance / 1000).toFixed(1)}k held`}
                trend="flat"
                helper="Available for withdrawal"
              />
            </div>

            {/* Risk Metrics Section */}
            <SectionCard title="Critical Risk Metrics">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Critical Risk Users */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Users with Critical Risk Score
                    </h3>
                    <span className="text-3xl font-bold text-red-600">
                      {metrics.criticalRiskUsers}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Risk score &gt; 80 • Requires immediate action
                  </p>
                  <div className="mt-4 flex gap-2">
                    <div className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-center text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Action Required
                    </div>
                  </div>
                </div>

                {/* High Risk Transactions */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      High-Risk Transactions
                    </h3>
                    <span className="text-3xl font-bold text-orange-600">
                      {metrics.highRiskTransactions}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Last 24 hours • Score 60-80
                  </p>
                  <div className="mt-4 flex gap-2">
                    <div className="flex-1 rounded-lg bg-orange-100 px-3 py-2 text-center text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      Review Queue
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Recent Risk Events */}
            <SectionCard title="Recent Risk Events">
              {recentRiskEvents.length === 0 ? (
                <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    No recent risk events detected
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRiskEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <RiskScoreBadge
                            score={event.riskScore}
                            size="sm"
                            showLabel={false}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {event.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {event.description}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            event.severity === "critical"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : event.severity === "high"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {event.severity}
                        </span>
                        {!event.reviewed && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Quick Actions Section */}
            <SectionCard title="Quick Actions">
              <div className="grid gap-4 md:grid-cols-3">
                <button className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.08]">
                  Review High-Risk Users
                </button>
                <button className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.08]">
                  View Activity Feed
                </button>
                <button className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.08]">
                  Approve Payouts
                </button>
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </>
  );
}
