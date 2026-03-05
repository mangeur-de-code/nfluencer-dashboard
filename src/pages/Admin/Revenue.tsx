import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import StatCard from "../../components/admin/StatCard";
import AreaChart from "../../components/admin/charts/AreaChart";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
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
  const { range } = useAdminDateRange();
  const [data, setData] = useState<RevenueData>(fallback);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await fetchAdmin<RevenueData>("/api/admin/revenue", {
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
    </>
  );
}
