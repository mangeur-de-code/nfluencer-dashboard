import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import StatCard from "../../components/admin/StatCard";
import AreaChart from "../../components/admin/charts/AreaChart";
import { useAdminFetch } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import { useRisk } from "../../context/RiskContext";
import { DollarLineIcon } from "../../icons";

type RevenueData = {
  metrics: {
    grossRevenue: number;
    platformFees: number;
    netEarnings: number;
    payoutsPending: number;
    payoutsProcessing: number;
    payoutsCompleted: number;
    refunds: number;
  };
  series?: {
    revenueByDay: Array<{ date: string; amount: number }>;
  };
};

const fallback: RevenueData = {
  metrics: {
    grossRevenue: 0,
    platformFees: 0,
    netEarnings: 0,
    payoutsPending: 0,
    payoutsProcessing: 0,
    payoutsCompleted: 0,
    refunds: 0,
  },
  series: { revenueByDay: [] },
};

export default function Revenue() {
  const adminFetch = useAdminFetch();
  const { range } = useAdminDateRange();
  const {
    payoutRequests,
    fetchPayoutRequests,
    approvePayoutRequest,
    delayPayoutRequest,
  } = useRisk();
  const [data, setData] = useState<RevenueData>(fallback);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [payoutStatus, setPayoutStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [payoutMessage, setPayoutMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await adminFetch<RevenueData>("/api/admin/revenue", {
          start: range.start,
          end: range.end,
          range: range.key,
        });
        if (isMounted) {
          setData(response);
          setStatus("ready");
        }
      } catch (error) {
        if (isMounted) {
          setData(fallback);
          setStatus("error");
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [range]);

  useEffect(() => {
    let isMounted = true;
    const loadPayoutRequests = async () => {
      setPayoutStatus("loading");
      try {
        await fetchPayoutRequests();
        if (isMounted) {
          setPayoutStatus("ready");
        }
      } catch (error) {
        if (isMounted) {
          setPayoutStatus("error");
          setPayoutMessage("Unable to load payout requests.");
        }
      }
    };

    loadPayoutRequests();
    return () => {
      isMounted = false;
    };
  }, [fetchPayoutRequests]);

  const approvePayout = async (payoutId: string) => {
    setPayoutStatus("loading");
    setPayoutMessage("");
    try {
      await approvePayoutRequest(payoutId);
      await fetchPayoutRequests();
      setPayoutStatus("ready");
      setPayoutMessage("Payout approved successfully.");
    } catch (error) {
      setPayoutStatus("error");
      setPayoutMessage("Failed to approve payout.");
    }
  };

  const delayPayout = async (payoutId: string) => {
    setPayoutStatus("loading");
    setPayoutMessage("");
    try {
      await delayPayoutRequest(payoutId, "Suspicious activity flagged for review");
      await fetchPayoutRequests();
      setPayoutStatus("ready");
      setPayoutMessage("Payout delayed for additional review.");
    } catch (error) {
      setPayoutStatus("error");
      setPayoutMessage("Failed to delay payout.");
    }
  };

  const { metrics } = data;

  const revenueCategories = useMemo(
    () => (data.series?.revenueByDay ?? []).map((d) => d.date),
    [data.series]
  );
  const revenueSeries = useMemo(
    () => [{ name: "Revenue", data: (data.series?.revenueByDay ?? []).map((d) => d.amount) }],
    [data.series]
  );

  return (
    <>
      <PageMeta
        title="Admin Revenue"
        description="Revenue and payout tracking"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Revenue & Payouts
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {range.label} • {range.start} → {range.end}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gross Revenue"
          value={`$${metrics.grossRevenue.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Platform Fees"
          value={`$${metrics.platformFees.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Net Earnings"
          value={`$${metrics.netEarnings.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Refunds"
          value={`$${metrics.refunds.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Payouts Pending"
          value={`$${metrics.payoutsPending.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Payouts Processing"
          value={`$${metrics.payoutsProcessing.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Payouts Completed"
          value={`$${metrics.payoutsCompleted.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
      </div>

      <div className="mt-6">
        <SectionCard
          title="Daily Revenue Trend"
          subtitle={
            status === "error"
              ? "Live data unavailable."
              : revenueCategories.length > 0
                ? `${revenueCategories.length} days of data`
                : "No transactions in this range"
          }
        >
          {revenueCategories.length > 0 ? (
            <AreaChart categories={revenueCategories} series={revenueSeries} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No revenue data available for the selected date range.
            </p>
          )}
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Payout Risk Controls"
          subtitle="Review pending payout requests and take action on flagged creator payouts."
        >
          {payoutStatus === "loading" ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              Loading payout risk controls...
            </p>
          ) : payoutRequests.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No pending payout requests found.
            </p>
          ) : (
            <div className="space-y-4">
              {payoutMessage ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {payoutMessage}
                </div>
              ) : null}
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-950/80">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700 dark:divide-slate-700 dark:text-slate-200">
                  <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-medium">Creator</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Risk Score</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {payoutRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-4 py-3">{request.creatorId}</td>
                        <td className="px-4 py-3">${request.amount.toLocaleString()}</td>
                        <td className="px-4 py-3">{request.creatorRiskScore}</td>
                        <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                          {request.status}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => approvePayout(request.id)}
                              disabled={payoutStatus !== "ready"}
                              className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => delayPayout(request.id)}
                              disabled={payoutStatus !== "ready"}
                              className="rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-500/70 dark:bg-amber-950/30 dark:text-amber-200"
                            >
                              Delay
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
