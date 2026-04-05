import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import { useAdminFetch } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import StatCard from "../../components/admin/StatCard";
import AreaChart from "../../components/admin/charts/AreaChart";
import { PieChartIcon, UserCircleIcon } from "../../icons";

type SubscriptionData = {
  metrics: {
    activeSubscriptions: number;
    newSubscriptions: number;
    cancelledSubscriptions: number;
    churnRate: number;
    arpu: number;
    ltv: number;
  };
  series: {
    newByDay: Array<{ date: string; value: number }>;
    churnByDay: Array<{ date: string; value: number }>;
  };
};

const fallback: SubscriptionData = {
  metrics: {
    activeSubscriptions: 0,
    newSubscriptions: 0,
    cancelledSubscriptions: 0,
    churnRate: 0,
    arpu: 0,
    ltv: 0,
  },
  series: {
    newByDay: [],
    churnByDay: [],
  },
};

export default function Subscriptions() {
  const adminFetch = useAdminFetch();
  const { range } = useAdminDateRange();
  const [data, setData] = useState<SubscriptionData>(fallback);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await adminFetch<SubscriptionData>(
          "/api/admin/subscriptions",
          {
            start: range.start,
            end: range.end,
            range: range.key,
          }
        );
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

  const subDates = useMemo(
    () => data.series.newByDay.map((d) => d.date),
    [data.series.newByDay]
  );
  const subSeries = useMemo(
    () => [
      { name: "New", data: data.series.newByDay.map((d) => d.value) },
      { name: "Churned", data: data.series.churnByDay.map((d) => d.value) },
    ],
    [data.series]
  );

  return (
    <>
      <PageMeta
        title="Admin Subscriptions"
        description="Subscription performance"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Subscriptions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {range.label} • {range.start} → {range.end}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Active Subscriptions"
          value={metrics.activeSubscriptions.toLocaleString()}
          icon={<UserCircleIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="New Subscriptions"
          value={metrics.newSubscriptions.toLocaleString()}
          icon={<UserCircleIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Cancelled"
          value={metrics.cancelledSubscriptions.toLocaleString()}
          icon={<PieChartIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Churn Rate"
          value={`${metrics.churnRate.toFixed(2)}%`}
          icon={<PieChartIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="ARPU"
          value={`$${metrics.arpu.toFixed(2)}`}
          icon={<UserCircleIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="LTV"
          value={`$${metrics.ltv.toFixed(2)}`}
          icon={<UserCircleIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
      </div>

      <div className="mt-6">
        <SectionCard
          title="New vs Churned Subscriptions"
          subtitle={
            status === "error"
              ? "Live data unavailable."
              : subDates.length > 0
                ? `${subDates.length} days of data`
                : "No subscription activity in this range"
          }
        >
          {subDates.length > 0 ? (
            <AreaChart categories={subDates} series={subSeries} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No subscription data for the selected date range.
            </p>
          )}
        </SectionCard>
      </div>
    </>
  );
}
