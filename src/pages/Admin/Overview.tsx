import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import StatCard from "../../components/admin/StatCard";
import SectionCard from "../../components/admin/SectionCard";
import AreaChart from "../../components/admin/charts/AreaChart";
import BarChart from "../../components/admin/charts/BarChart";
import DonutChart from "../../components/admin/charts/DonutChart";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import {
  AlertHexaIcon,
  DollarLineIcon,
  FileIcon,
  GroupIcon,
  PieChartIcon,
  UserCircleIcon,
  VideoIcon,
} from "../../icons";

type OverviewData = {
  range?: { start: string; end: string };
  kpis?: {
    totalUsers: number;
    newUsers: number;
    activeUsers7d: number;
    activeUsers30d: number;
    activeCreators: number;
    activeSubscribers: number;
    mrr: number;
    netRevenue: number;
    pendingPayouts: number;
    openReports: number;
    flaggedContent: number;
    liveStreams: number;
  };
  series?: {
    userGrowth: Array<{ date: string; count: number }>;
    revenue: Array<{ date: string; amount: number }>;
    churn: Array<{ date: string; value: number }>;
    contentMix: Array<{ label: string; value: number }>;
  };
};

const fallbackData: OverviewData = {
  kpis: {
    totalUsers: 0,
    newUsers: 0,
    activeUsers7d: 0,
    activeUsers30d: 0,
    activeCreators: 0,
    activeSubscribers: 0,
    mrr: 0,
    netRevenue: 0,
    pendingPayouts: 0,
    openReports: 0,
    flaggedContent: 0,
    liveStreams: 0,
  },
  series: {
    userGrowth: [],
    revenue: [],
    churn: [],
    contentMix: [
      { label: "Photo", value: 0 },
      { label: "Video", value: 0 },
      { label: "Audio", value: 0 },
      { label: "Text", value: 0 },
    ],
  },
};

export default function Overview() {
  const { range } = useAdminDateRange();
  const [data, setData] = useState<OverviewData>(fallbackData);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await fetchAdmin<OverviewData>("/api/admin/overview", {
          start: range.start,
          end: range.end,
          range: range.key,
        });
        if (isMounted) {
          setData({ ...fallbackData, ...response });
          setStatus("ready");
        }
      } catch (error) {
        if (isMounted) {
          setData(fallbackData);
          setStatus("error");
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const userGrowthCategories = useMemo(
    () => data.series?.userGrowth.map((item) => item.date) || [],
    [data.series?.userGrowth]
  );

  const userGrowthSeries = useMemo(
    () => [
      {
        name: "Users",
        data: data.series?.userGrowth.map((item) => item.count) || [],
      },
    ],
    [data.series?.userGrowth]
  );

  const revenueCategories = useMemo(
    () => data.series?.revenue.map((item) => item.date) || [],
    [data.series?.revenue]
  );

  const revenueSeries = useMemo(
    () => [
      {
        name: "Revenue",
        data: data.series?.revenue.map((item) => item.amount) || [],
      },
    ],
    [data.series?.revenue]
  );

  const churnSeries = useMemo(
    () => [
      {
        name: "Churn",
        data: data.series?.churn.map((item) => item.value) || [],
      },
    ],
    [data.series?.churn]
  );

  const churnCategories = useMemo(
    () => data.series?.churn.map((item) => item.date) || [],
    [data.series?.churn]
  );

  const contentLabels = data.series?.contentMix.map((item) => item.label) || [];
  const contentSeries = data.series?.contentMix.map((item) => item.value) || [];

  const kpis = data.kpis || fallbackData.kpis!;

  return (
    <>
      <PageMeta
        title="Admin Overview"
        description="Platform activity, revenue, and moderation overview"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Platform Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {range.label} • {range.start} → {range.end}
          </p>
        </div>
        {status === "error" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            Live data unavailable. Showing placeholders.
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={kpis.totalUsers.toLocaleString()}
          icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="New Users"
          value={kpis.newUsers.toLocaleString()}
          icon={<UserCircleIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Active Users (7d)"
          value={kpis.activeUsers7d.toLocaleString()}
          icon={<PieChartIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Active Users (30d)"
          value={kpis.activeUsers30d.toLocaleString()}
          icon={<PieChartIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Active Creators"
          value={kpis.activeCreators.toLocaleString()}
          icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Active Subscribers"
          value={kpis.activeSubscribers.toLocaleString()}
          icon={<UserCircleIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="MRR"
          value={`$${kpis.mrr.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Net Revenue"
          value={`$${kpis.netRevenue.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Pending Payouts"
          value={`$${kpis.pendingPayouts.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Open Reports"
          value={kpis.openReports.toLocaleString()}
          icon={<AlertHexaIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Flagged Content"
          value={kpis.flaggedContent.toLocaleString()}
          icon={<FileIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Live Streams"
          value={kpis.liveStreams.toLocaleString()}
          icon={<VideoIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="User Growth"
          subtitle="Daily signups and growth"
        >
          {userGrowthSeries[0].data.length ? (
            <AreaChart categories={userGrowthCategories} series={userGrowthSeries} />
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No growth data yet.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Revenue Trend" subtitle="Gross revenue by day">
          {revenueSeries[0].data.length ? (
            <AreaChart categories={revenueCategories} series={revenueSeries} />
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No revenue data yet.
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Subscription Churn" subtitle="Daily churn counts">
          {churnSeries[0].data.length ? (
            <BarChart categories={churnCategories} series={churnSeries} />
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No churn data yet.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Content Mix" subtitle="Posts by type">
          {contentSeries.some((value) => value > 0) ? (
            <DonutChart labels={contentLabels} series={contentSeries} />
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No content distribution yet.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Operational Alerts" subtitle="Moderation queue">
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center justify-between">
              <span>Open reports</span>
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {kpis.openReports}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Flagged content</span>
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {kpis.flaggedContent}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Live streams</span>
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {kpis.liveStreams}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
